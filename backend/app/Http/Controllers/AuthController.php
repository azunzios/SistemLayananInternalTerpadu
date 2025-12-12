<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // If user exists perform account status checks
        if ($user) {
            if (!$user->is_active) {
                throw ValidationException::withMessages([
                    'email' => ['Account is inactive. Contact administrator.'],
                ]);
            }
            if ($user->locked_until && $user->locked_until->isFuture()) {
                throw ValidationException::withMessages([
                    'email' => ['Account locked until '.$user->locked_until->format('Y-m-d H:i:s').' UTC (WITA = +06.00)'],
                ]);
            }
        }

        // Validate credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $user->failed_login_attempts += 1;
                // Lock after 5 failed attempts for 15 minutes
                if ($user->failed_login_attempts >= 5) {
                    $user->locked_until = now()->addMinutes(15);
                    $user->failed_login_attempts = 0; // reset counter on lock
                }
                $user->save();

                // Audit log failed
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'LOGIN_FAILED',
                    'details' => 'Failed login attempt',
                    'ip_address' => $request->ip(),
                ]);
            }
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Successful login: reset counters
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Audit log success
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN_SUCCESS',
            'details' => 'User logged in',
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
