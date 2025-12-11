<?php

namespace App\Http\Controllers;

use App\Models\ZoomAccount;
use App\Services\ZoomBookingService;
use Illuminate\Http\Request;

class ZoomAccountController extends Controller
{
    /**
     * Get all zoom accounts (active only for pegawai/teknisi, all for admin)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Admin dapat melihat semua, user lain hanya yang aktif
        $query = ZoomAccount::query();
        
        // Check if user has admin role
        $activeRole = $user->role ?? 'pegawai';
        $isAdmin = in_array($activeRole, ['admin_layanan', 'super_admin']);
        
        if (!$isAdmin) {
            $query->where('is_active', true);
        }

        $accounts = $query->orderBy('id')->get();

        return response()->json($accounts);
    }

    /**
     * Get single zoom account
     */
    public function show($id)
    {
        $account = ZoomAccount::where('account_id', $id)->firstOrFail();
        
        // Include booking stats
        $stats = $account->getBookingStats();
        
        return response()->json([
            'account' => $account,
            'stats' => $stats,
        ]);
    }

    /**
     * Create new zoom account (admin only)
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'account_id' => 'required|string|unique:zoom_accounts,account_id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:zoom_accounts,email',
            'host_key' => 'required|string|size:6',
            'plan_type' => 'required|string|in:Pro,Business,Enterprise',
            'max_participants' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'color' => 'required|string|max:20',
            'is_active' => 'boolean',
        ]);

        $account = ZoomAccount::create($validated);

        return response()->json($account, 201);
    }

    /**
     * Update zoom account (admin only)
     */
    public function update(Request $request, $id)
    {
        $this->authorizeAdmin();

        // The $id here is the route parameter, which should be account_id
        // Try to find by account_id first, then by database id if not found
        $account = ZoomAccount::where('account_id', $id)->first() ?? ZoomAccount::find($id);
        
        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:zoom_accounts,email,' . $account->id,
            'host_key' => 'string|size:6',
            'plan_type' => 'string|in:Pro,Business,Enterprise',
            'max_participants' => 'integer|min:1',
            'description' => 'nullable|string',
            'color' => 'string|max:20',
            'is_active' => 'boolean',
        ]);

        $account->update($validated);

        return response()->json($account);
    }

    /**
     * Bulk update zoom accounts (admin only)
     */
    public function updateAll(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            '*.id' => 'required|string',
            '*.name' => 'required|string|max:255',
            '*.email' => 'required|email',
            '*.host_key' => 'required|string|size:6',
            '*.plan_type' => 'required|string|in:Pro,Business,Enterprise',
            '*.max_participants' => 'required|integer|min:1',
            '*.description' => 'nullable|string',
            '*.color' => 'required|string|max:20',
            '*.is_active' => 'required|boolean',
        ]);

        $updated = [];
        foreach ($validated as $accountData) {
            $account = ZoomAccount::find($accountData['id']);
            if ($account) {
                $account->update($accountData);
                $updated[] = $account;
            }
        }

        return response()->json($updated);
    }

    /**
     * Delete zoom account (admin only)
     */
    public function destroy($id)
    {
        $this->authorizeAdmin();

        // Try to find by account_id first, then by database id if not found
        $account = ZoomAccount::where('account_id', $id)->first() ?? ZoomAccount::find($id);
        
        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }
        
        // Check if account has active bookings
        $activeBookings = \App\Models\Ticket::where('type', 'zoom_meeting')
            ->where('zoom_account_id', $account->account_id)
            ->whereIn('status', ['approved', 'pending_review', 'menunggu_review', 'pending_approval'])
            ->count();

        if ($activeBookings > 0) {
            return response()->json([
                'message' => 'Cannot delete account with active bookings',
                'active_bookings' => $activeBookings,
            ], 422);
        }

        $account->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }

    /**
     * Check availability for specific date and time
     */
    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        $bookingService = new ZoomBookingService();
        $summary = $bookingService->getAvailabilitySummary($validated['date']);

        // Check which accounts are available
        $availability = [];
        foreach (ZoomAccount::active()->get() as $account) {
            $isAvailable = $account->isAvailableAt(
                $validated['date'],
                $validated['start_time'],
                $validated['end_time']
            );

            $availability[] = [
                'account_id' => $account->account_id,
                'account_name' => $account->name,
                'is_available' => $isAvailable,
            ];
        }

        return response()->json([
            'date' => $validated['date'],
            'time_range' => $validated['start_time'] . ' - ' . $validated['end_time'],
            'availability' => $availability,
            'summary' => $summary,
        ]);
    }

    /**
     * Get conflicts for specific account, date and time
     */
    public function getConflicts(Request $request, $accountId)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'exclude_ticket_id' => 'nullable|string',
        ]);

        $account = ZoomAccount::where('account_id', $accountId)->firstOrFail();
        $bookingService = new ZoomBookingService();

        $conflicts = $bookingService->getConflicts(
            $accountId,
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
            $validated['exclude_ticket_id'] ?? null
        );

        return response()->json([
            'account' => $account->only(['account_id', 'name']),
            'has_conflict' => count($conflicts) > 0,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Authorize admin_layanan access only
     */
    private function authorizeAdmin()
    {
        $user = auth()->user();
        $activeRole = $user->role ?? 'pegawai';
        
        // Only admin_layanan can manage zoom accounts
        if ($activeRole !== 'admin_layanan') {
            abort(403, 'Unauthorized. Only admin_layanan can manage zoom accounts.');
        }
    }
}
