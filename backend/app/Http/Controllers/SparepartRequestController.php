<?php

namespace App\Http\Controllers;

use App\Models\SparepartRequest;
use App\Models\WorkOrder;
use App\Http\Resources\SparepartRequestResource;
use App\Traits\HasRoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SparepartRequestController extends Controller
{
    use HasRoleHelper;

    /**
     * Get all sparepart requests with filtering
     * GET /sparepart-requests?status=pending&work_order_id=1&page=1&per_page=15
     */
    public function index(Request $request): JsonResponse
    {
        $query = SparepartRequest::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by work order
        if ($request->has('work_order_id')) {
            $query->where('work_order_id', $request->work_order_id);
        }

        // Role-based filtering
        $user = auth()->user();
        if (!$this->userHasAnyRole($user, ['super_admin', 'admin_penyedia'])) {
            // Teknisi can only see their own requests
            if ($this->userHasRole($user, 'teknisi')) {
                $query->where('requested_by', $user->id);
            }
        }

        $perPage = $request->per_page ?? 15;
        $requests = $query->with(['workOrder', 'requester', 'approver'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Sparepart requests retrieved successfully',
            'data' => SparepartRequestResource::collection($requests),
            'pagination' => [
                'total' => $requests->total(),
                'per_page' => $requests->perPage(),
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'from' => $requests->firstItem(),
                'to' => $requests->lastItem(),
            ],
        ], 200);
    }

    /**
     * Create new sparepart request
     * POST /sparepart-requests
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'work_order_id' => 'required|exists:work_orders,id',
            'item_name' => 'required|string|max:255',
            'quantity_requested' => 'required|integer|min:1',
            'unit' => 'required|string|max:20',
            'estimated_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $workOrder = WorkOrder::find($validated['work_order_id']);
        if (!$workOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Work order not found',
            ], 404);
        }

        // Only teknisi assigned to ticket or admin can request
        $ticket = $workOrder->ticket;
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            if (!$this->userHasRole(auth()->user(), 'teknisi') || $ticket->assigned_to !== auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to request spare parts for this work order',
                ], 403);
            }
        }

        $sparepartRequest = SparepartRequest::create([
            ...$validated,
            'status' => 'pending',
            'requested_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request created successfully',
            'data' => new SparepartRequestResource($sparepartRequest->load(['workOrder', 'requester'])),
        ], 201);
    }

    /**
     * Get single sparepart request
     */
    public function show(SparepartRequest $sparepartRequest): JsonResponse
    {
        $sparepartRequest->load(['workOrder', 'requester', 'approver']);

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request retrieved successfully',
            'data' => new SparepartRequestResource($sparepartRequest),
        ], 200);
    }

    /**
     * Approve sparepart request
     * PATCH /sparepart-requests/{id}/approve
     */
    public function approve(Request $request, SparepartRequest $sparepartRequest): JsonResponse
    {
        // Only admin_penyedia can approve
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only admin penyedia can approve sparepart requests',
            ], 403);
        }

        if ($sparepartRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Can only approve pending sparepart requests',
            ], 422);
        }

        $sparepartRequest->status = 'approved';
        $sparepartRequest->approved_by = auth()->id();
        $sparepartRequest->approved_at = now();
        $sparepartRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request approved successfully',
            'data' => new SparepartRequestResource($sparepartRequest->load(['workOrder', 'requester', 'approver'])),
        ], 200);
    }

    /**
     * Reject sparepart request
     * PATCH /sparepart-requests/{id}/reject
     */
    public function reject(Request $request, SparepartRequest $sparepartRequest): JsonResponse
    {
        // Only admin_penyedia can reject
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only admin penyedia can reject sparepart requests',
            ], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        if ($sparepartRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Can only reject pending sparepart requests',
            ], 422);
        }

        $sparepartRequest->status = 'rejected';
        $sparepartRequest->rejection_reason = $validated['rejection_reason'];
        $sparepartRequest->approved_by = auth()->id();
        $sparepartRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request rejected successfully',
            'data' => new SparepartRequestResource($sparepartRequest->load(['workOrder', 'requester', 'approver'])),
        ], 200);
    }

    /**
     * Mark sparepart request as fulfilled
     * PATCH /sparepart-requests/{id}/fulfill
     */
    public function fulfill(Request $request, SparepartRequest $sparepartRequest): JsonResponse
    {
        // Only admin_penyedia can fulfill
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only admin penyedia can fulfill sparepart requests',
            ], 403);
        }

        if ($sparepartRequest->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Can only fulfill approved sparepart requests',
            ], 422);
        }

        $sparepartRequest->status = 'fulfilled';
        $sparepartRequest->save();

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request fulfilled successfully',
            'data' => new SparepartRequestResource($sparepartRequest->load(['workOrder', 'requester', 'approver'])),
        ], 200);
    }

    /**
     * Get statistics for sparepart requests
     * GET /sparepart-requests/stats/summary
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => SparepartRequest::count(),
            'by_status' => [],
        ];

        foreach (SparepartRequest::getStatuses() as $status) {
            $stats['by_status'][$status] = SparepartRequest::where('status', $status)->count();
        }

        return response()->json([
            'success' => true,
            'message' => 'Sparepart request statistics retrieved',
            'data' => $stats,
        ], 200);
    }
}
