<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\AuditLog;
use App\Mail\NewUserMail;
use Illuminate\Support\Facades\Mail;

class UserController extends Controller
{
    /**
     * Get all users (paginated)
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role')) {
            $query->where('roles', 'like', '%"' . $request->role . '"%');
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        // Search by name, email or NIP (privacy-aware)
        if ($request->has('search')) {
            $search = trim((string) $request->search);

            // Require minimum 4 characters for privacy; return empty when too short
            if (mb_strlen($search) < 4) {
                $empty = User::whereRaw('0 = 1')->paginate($request->get('per_page', 15));
                return UserResource::collection($empty);
            }

            // If role not explicitly requested, default to pegawai only
            if (!$request->has('role')) {
                $query->where('roles', 'like', '%"pegawai"%');
            }

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%")
                  ->orWhere('nip', 'like', "%$search%");
            });
        }

        $users = $query->paginate($request->get('per_page', 15));

        return UserResource::collection($users);
    }

    /**
     * Get single user by ID
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'nip' => 'required|string|unique:users,nip',
            'jabatan' => 'required|string|max:255',
            'unit_kerja' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'roles' => 'required|array|min:1',
            'roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
            'is_active' => 'boolean',
        ]);

        // Store plain password for email
        $plainPassword = $validated['password'];
        
        $validated['password'] = Hash::make($validated['password']);

        // Set role (single) dari roles dengan priority logic
        // Untuk multi-role, ambil role pertama yang paling tinggi prioritasnya
        // Priority: super_admin > admin_layanan > admin_penyedia > teknisi > pegawai
        $rolePriority = ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai'];
        $primaryRole = 'pegawai'; // default fallback
        
        foreach ($rolePriority as $role) {
            if (in_array($role, $validated['roles'])) {
                $primaryRole = $role;
                break; // Ambil yang pertama ketemu (prioritas tertinggi)
            }
        }
        $validated['role'] = $primaryRole;

        $user = User::create($validated);

        // Send welcome email with credentials
        try {
            Mail::to($user->email)->send(new NewUserMail($user, $plainPassword));
        } catch (\Exception $e) {
            // Log error but don't fail user creation
            \Log::error('Failed to send new user email: ' . $e->getMessage());
        }

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'USER_CREATED',
            'details' => "User created: {$user->name} ({$user->email})",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(new UserResource($user), 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $user->id,
            'nip' => 'string|unique:users,nip,' . $user->id,
            'jabatan' => 'string|max:255',
            'unit_kerja' => 'string|max:255',
            'phone' => 'string|max:20',
            'roles' => 'array|min:1',
            'roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Set role (single) dari roles dengan priority logic jika roles diupdate
        if (isset($validated['roles'])) {
            // Priority: super_admin > admin_layanan > admin_penyedia > teknisi > pegawai
            $rolePriority = ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai'];
            $primaryRole = 'pegawai'; // default fallback
            
            foreach ($rolePriority as $role) {
                if (in_array($role, $validated['roles'])) {
                    $primaryRole = $role;
                    break; // Ambil yang pertama ketemu (prioritas tertinggi)
                }
            }
            $validated['role'] = $primaryRole;
        }

        $user->fill($validated);
        $user->save();

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'USER_UPDATED',
            'details' => "User updated: {$user->name} ({$user->email})",
            'ip_address' => request()->ip(),
        ]);

        return new UserResource($user);
    }

    /**
     * Delete user
     */
    public function destroy(User $user)
    {
        $userData = "{$user->name} ({$user->email})";
        $user->delete();

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'USER_DELETED',
            'details' => "User deleted: {$userData}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Update user roles (multi-role management)
     */
    public function updateRoles(Request $request, User $user)
    {
        $validated = $request->validate([
            'roles' => 'required|array|min:1',
            'roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
        ]);

        $user->roles = $validated['roles'];
        
        // Ensure active role is valid
        $this->ensureActiveRoleIsValid($user);
        
        $user->save();

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'USER_ROLES_UPDATED',
            'details' => "Roles updated for {$user->name}: " . implode(', ', $validated['roles']),
            'ip_address' => request()->ip(),
        ]);

        return new UserResource($user);
    }

    /**
     * Helper to ensure active role is in the roles array
     */
    /**
     * Get current authenticated user
     */
    public function getCurrentUser(Request $request)
    {
        return new UserResource($request->user());
    }

    /**
     * Update current user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'required|string|size:18|unique:users,nip,' . $user->id,
            'jabatan' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:20',
            // unit_kerja tidak boleh diubah oleh user sendiri
        ]);

        $user->update([
            'name' => $validated['name'],
            'nip' => $validated['nip'],
            'jabatan' => $validated['jabatan'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'PROFILE_UPDATED',
            'details' => "User updated their profile: {$user->name}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Change user active role
     */
    public function changeRole(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'role' => 'required|string',
        ]);

        $requestedRole = $validated['role'];
        
        // Ensure the requested role is in the user's available roles
        $availableRoles = is_array($user->roles) ? $user->roles : json_decode($user->roles ?? '[]', true);
        
        if (!in_array($requestedRole, $availableRoles)) {
            throw ValidationException::withMessages([
                'role' => ['You do not have permission to switch to this role.'],
            ]);
        }

        $user->role = $requestedRole;
        $user->save();

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ROLE_SWITCHED',
            'details' => "User switched active role to: {$requestedRole}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'message' => 'Role berhasil diubah',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',      // at least one lowercase letter
                'regex:/[A-Z]/',      // at least one uppercase letter
                'regex:/[0-9]/',      // at least one number
                'regex:/[@$!%*#?&]/', // at least one special character
                'different:current_password',
            ],
            'new_password_confirmation' => 'required|same:new_password',
        ], [
            'new_password.regex' => 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus',
            'new_password.different' => 'Password baru harus berbeda dengan password lama',
            'new_password_confirmation.same' => 'Konfirmasi password tidak cocok',
        ]);

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak sesuai'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'PASSWORD_CHANGED',
            'details' => "User changed their password: {$user->name}",
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah',
        ]);
    }

    /**
     * Upload user avatar
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png|max:2048', // max 2MB
        ]);

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar && \Storage::disk('public')->exists($user->avatar)) {
                \Storage::disk('public')->delete($user->avatar);
            }

            // Store new avatar
            $path = $request->file('avatar')->store('avatars', 'public');

            // Update user
            $user->update([
                'avatar' => $path,
            ]);

            // Audit log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'AVATAR_UPDATED',
                'details' => "User uploaded new avatar: {$user->name}",
                'ip_address' => request()->ip(),
            ]);

            return response()->json(new UserResource($user->fresh()), 200);
        }

        return response()->json([
            'message' => 'Tidak ada file yang diupload',
        ], 400);
    }

    /**
     * Bulk update users (for admin)
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'is_active' => 'required|boolean',
            'roles' => 'array',
            'roles.*' => Rule::in(['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai']),
        ]);

        $updates = ['is_active' => $validated['is_active']];
        if (isset($validated['roles'])) {
            $updates['roles'] = $validated['roles'];
        }

        User::whereIn('id', $validated['user_ids'])->update($updates);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'USERS_BULK_UPDATED',
            'details' => 'Bulk updated ' . count($validated['user_ids']) . ' users',
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['message' => 'Users updated successfully']);
    }
}
