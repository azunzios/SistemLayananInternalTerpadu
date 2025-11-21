<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    // Get all audit logs (admin only)
    public function index(Request $request)
    {
        $logs = AuditLog::query();

        // Filter by userId if provided
        if ($request->has('userId')) {
            $logs->where('user_id', $request->userId);
        }

        // Filter by action if provided
        if ($request->has('action')) {
            $logs->where('action', $request->action);
        }

        // Filter by date range if provided
        if ($request->has('startDate')) {
            $logs->whereDate('created_at', '>=', $request->startDate);
        }

        if ($request->has('endDate')) {
            $logs->whereDate('created_at', '<=', $request->endDate);
        }

        return response()->json(
            $logs->orderBy('created_at', 'desc')->paginate(50)
        );
    }

    // Create a new audit log
    public function store(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|string',
            'details' => 'nullable|string',
            'ipAddress' => 'nullable|string',
        ]);

        $user = $request->user();

        $log = AuditLog::create([
            'user_id' => $user?->id,
            'action' => $validated['action'],
            'details' => $validated['details'],
            'ip_address' => $validated['ipAddress'] ?? $request->ip(),
        ]);

        return response()->json($log, 201);
    }

    // Get audit logs for current user
    public function myLogs(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $logs = AuditLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    // Get specific audit log
    public function show($id)
    {
        $log = AuditLog::findOrFail($id);

        return response()->json($log);
    }

    // Delete audit log (admin only)
    public function destroy($id)
    {
        $log = AuditLog::findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Audit log deleted successfully']);
    }
}
