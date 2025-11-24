<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\Ticket;
use App\Models\Timeline;
use App\Http\Resources\WorkOrderResource;
use App\Traits\HasRoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class WorkOrderController extends Controller
{
    use HasRoleHelper;
    /**
     * Get all work orders with filtering
     * ?status=requested&type=sparepart&ticket_id=1&page=1&per_page=15
     */
    public function index(Request $request): JsonResponse
    {
        $query = WorkOrder::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by ticket_id
        if ($request->has('ticket_id')) {
            $query->where('ticket_id', $request->ticket_id);
        }

        // Role-based filtering
        $user = Auth::user();
        if ($user && !$this->userHasAnyRole($user, ['super_admin', 'admin_penyedia'])) {
            // Teknisi can only see work orders for assigned tickets
            // Pegawai can only see work orders for their own tickets
            $query->whereHas('ticket', function ($q) use ($user) {
                if ($this->userHasRole($user, 'teknisi')) {
                    $q->where('assigned_to', $user->id);
                } elseif ($this->userHasRole($user, 'pegawai')) {
                    $q->where('created_by', $user->id);
                }
            });
        }

        $perPage = $request->per_page ?? 15;
        $workOrders = $query->with(['ticket', 'createdBy', 'timeline'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Work orders retrieved successfully',
            'data' => WorkOrderResource::collection($workOrders),
            'pagination' => [
                'total' => $workOrders->total(),
                'per_page' => $workOrders->perPage(),
                'current_page' => $workOrders->currentPage(),
                'last_page' => $workOrders->lastPage(),
                'from' => $workOrders->firstItem(),
                'to' => $workOrders->lastItem(),
            ],
        ], 200);
    }

    /**
     * Create a new work order
     * POST /work-orders
     * Request body:
     * {
     *   "ticket_id": 1,
     *   "type": "sparepart",
     *   "items": [
     *     {"name": "Charger", "quantity": 1, "unit": "pcs", "estimated_price": 150000},
     *     {"name": "Cable", "quantity": 2, "unit": "pcs", "estimated_price": 50000}
     *   ]
     * }
     * OR for vendor:
     * {
     *   "ticket_id": 1,
     *   "type": "vendor",
     *   "vendor_name": "PT Service",
     *   "vendor_contact": "081234567890",
     *   "vendor_description": "AC Refrigeration Service"
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only teknisi can create work orders
        if (!$this->userHasRole($user, 'teknisi')) {
            return response()->json([
                'success' => false,
                'message' => 'Only teknisi can create work orders',
            ], 403);
        }

        $validated = $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'type' => 'required|in:sparepart,vendor,license',
            'items' => 'nullable|array',
            'items.*.name' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|numeric|min:1',
            'items.*.unit' => 'required_with:items|string|max:50',
            'items.*.remarks' => 'nullable|string',
            'items.*.estimated_price' => 'nullable|numeric|min:0',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
            'vendor_description' => 'nullable|string',
            'license_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $ticket = Ticket::find($validated['ticket_id']);
        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found',
            ], 404);
        }

        // Validate ticket status - work order can only be created for on_hold or in_diagnosis tickets
        if (!in_array($ticket->status, ['on_hold', 'in_diagnosis', 'in_repair', 'assigned', 'accepted', 'in_progress'])) {
            return response()->json([
                'success' => false,
                'message' => 'Work order can only be created for tickets in diagnosis or repair process',
            ], 422);
        }

        // Prepare data based on type
        $workOrderData = [
            'ticket_id' => $validated['ticket_id'],
            'ticket_number' => $ticket->ticket_number,
            'type' => $validated['type'],
            'status' => 'requested',
            'created_by' => $user->id,
        ];

        if ($validated['type'] === 'sparepart') {
            $workOrderData['items'] = $validated['items'] ?? [];
        } elseif ($validated['type'] === 'vendor') {
            $workOrderData['vendor_name'] = $validated['vendor_name'] ?? null;
            $workOrderData['vendor_contact'] = $validated['vendor_contact'] ?? null;
            $workOrderData['vendor_description'] = $validated['description'] ?? $validated['vendor_description'] ?? null;
        } elseif ($validated['type'] === 'license') {
            $workOrderData['license_name'] = $validated['license_name'] ?? null;
            $workOrderData['license_description'] = $validated['description'] ?? null;
        }

        $workOrder = WorkOrder::create($workOrderData);

        // Update ticket status to on_hold when work order is created
        if (in_array($ticket->status, ['in_progress', 'in_diagnosis', 'in_repair'])) {
            $ticket->update(['status' => 'on_hold']);
        }

        // Log timeline
        Timeline::create([
            'ticket_id' => $validated['ticket_id'],
            'work_order_id' => $workOrder->id,
            'user_id' => $user->id,
            'action' => 'work_order_created',
            'details' => "Work order created: {$validated['type']} type",
            'metadata' => [
                'type' => $validated['type'],
                'status' => 'requested',
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Work order created successfully',
            'data' => new WorkOrderResource($workOrder->load(['ticket', 'createdBy', 'timeline'])),
        ], 201);
    }

    /**
     * Get a single work order
     */
    public function show(WorkOrder $workOrder): JsonResponse
    {
        $workOrder->load(['ticket', 'createdBy', 'timeline']);

        return response()->json([
            'success' => true,
            'message' => 'Work order retrieved successfully',
            'data' => new WorkOrderResource($workOrder),
        ], 200);
    }

    /**
     * Update work order (items, vendor info, etc)
     * PATCH /work-orders/{id}
     */
    public function update(Request $request, WorkOrder $workOrder): JsonResponse
    {
        $user = Auth::user();

        // Only teknisi who created it or admin can update
        if ($workOrder->created_by !== $user->id && !$this->userHasAnyRole($user, ['super_admin', 'admin_penyedia'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this work order',
            ], 403);
        }

        // Can only update if status is requested
        if ($workOrder->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' => 'Can only update work orders with requested status',
            ], 422);
        }

        $validated = $request->validate([
            'items' => 'nullable|array',
            'items.*.name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit' => 'required|string|max:50',
            'items.*.remarks' => 'nullable|string',
            'items.*.estimated_price' => 'nullable|numeric|min:0',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
            'vendor_description' => 'nullable|string',
        ]);

        if (isset($validated['items'])) {
            $workOrder->items = $validated['items'];
        }
        if (isset($validated['vendor_name'])) {
            $workOrder->vendor_name = $validated['vendor_name'];
        }
        if (isset($validated['vendor_contact'])) {
            $workOrder->vendor_contact = $validated['vendor_contact'];
        }
        if (isset($validated['vendor_description'])) {
            $workOrder->vendor_description = $validated['vendor_description'];
        }

        $workOrder->save();

        Timeline::create([
            'ticket_id' => $workOrder->ticket_id,
            'work_order_id' => $workOrder->id,
            'user_id' => $user->id,
            'action' => 'work_order_updated',
            'details' => 'Work order updated',
            'metadata' => [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Work order updated successfully',
            'data' => new WorkOrderResource($workOrder->load(['ticket', 'createdBy', 'timeline'])),
        ], 200);
    }

    /**
     * Update work order status with transition validation
     * PATCH /work-orders/{id}/status
     * Request body:
     * {
     *   "status": "in_procurement",
     *   "notes": "Procuring spare parts from supplier"
     * }
     */
    public function updateStatus(Request $request, WorkOrder $workOrder): JsonResponse
    {
        $user = Auth::user();

        // Only admin_penyedia or super_admin can update status
        if (!$this->userHasAnyRole($user, ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only admin penyedia can update work order status',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:requested,in_procurement,delivered,completed,failed,cancelled',
            'notes' => 'nullable|string',
            'completion_notes' => 'nullable|string',
            'failure_reason' => 'nullable|string',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $workOrder->status;

        // Validate transition
        if (!$workOrder->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot transition from {$oldStatus} to {$newStatus}",
                'current_status' => $oldStatus,
                'available_transitions' => [
                    'requested' => ['in_procurement', 'cancelled'],
                    'in_procurement' => ['delivered', 'failed'],
                    'delivered' => ['completed', 'failed'],
                    'completed' => [],
                    'failed' => ['requested'],
                    'cancelled' => [],
                ][$oldStatus] ?? [],
            ], 422);
        }

        // Update status
        $workOrder->status = $newStatus;

        // Update vendor info if provided
        if (isset($validated['vendor_name'])) {
            $workOrder->vendor_name = $validated['vendor_name'];
        }
        if (isset($validated['vendor_contact'])) {
            $workOrder->vendor_contact = $validated['vendor_contact'];
        }

        // Handle completion
        if ($newStatus === 'completed') {
            $workOrder->completed_at = now();
            if (isset($validated['completion_notes'])) {
                $workOrder->completion_notes = $validated['completion_notes'];
            }
        }

        // Handle failure
        if ($newStatus === 'failed') {
            if (isset($validated['failure_reason'])) {
                $workOrder->failure_reason = $validated['failure_reason'];
            }
        }

        $workOrder->save();

        // Log timeline
        Timeline::create([
            'ticket_id' => $workOrder->ticket_id,
            'work_order_id' => $workOrder->id,
            'user_id' => $user->id,
            'action' => 'work_order_status_changed',
            'details' => "Work order status changed from {$oldStatus} to {$newStatus}",
            'metadata' => [
                'from' => $oldStatus,
                'to' => $newStatus,
                'notes' => $validated['notes'] ?? null,
                'completion_notes' => $validated['completion_notes'] ?? null,
                'failure_reason' => $validated['failure_reason'] ?? null,
            ],
        ]);

        // If work order is completed, update ticket status
        if ($newStatus === 'completed') {
            $ticket = $workOrder->ticket;
            if ($ticket && in_array($ticket->status, ['on_hold', 'in_progress'])) {
                $oldStatus = $ticket->status;
                $ticket->status = 'resolved';
                $ticket->save();

                Timeline::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'action' => 'ticket_status_changed',
                    'details' => 'Ticket status auto-updated to resolved (work order completed)',
                    'metadata' => [
                        'from' => $oldStatus,
                        'to' => 'resolved',
                        'trigger' => 'work_order_completion',
                    ],
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Work order status updated successfully',
            'data' => new WorkOrderResource($workOrder->load(['ticket', 'createdBy', 'timeline'])),
        ], 200);
    }

    /**
     * Delete a work order
     * Only allowed if status is requested
     */
    public function destroy(WorkOrder $workOrder): JsonResponse
    {
        $user = Auth::user();

        // Only creator or admin can delete
        if ($workOrder->created_by !== $user->id && !$this->userHasAnyRole($user, ['super_admin', 'admin_penyedia'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this work order',
            ], 403);
        }

        // Only allow deletion of requested status
        if ($workOrder->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' => 'Can only delete work orders with requested status',
            ], 422);
        }

        $ticketId = $workOrder->ticket_id;
        $workOrder->delete();

        // Log timeline
        Timeline::create([
            'ticket_id' => $ticketId,
            'user_id' => $user->id,
            'action' => 'work_order_deleted',
            'details' => 'Work order deleted',
            'metadata' => [
                'work_order_id' => $workOrder->id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Work order deleted successfully',
        ], 200);
    }

    /**
     * Get work order statistics
     * GET /work-orders/stats/summary
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = [
            'total' => WorkOrder::count(),
            'by_status' => [],
            'by_type' => [],
        ];

        foreach (WorkOrder::getStatuses() as $status) {
            $stats['by_status'][$status] = WorkOrder::where('status', $status)->count();
        }

        foreach (WorkOrder::getTypes() as $type) {
            $stats['by_type'][$type] = WorkOrder::where('type', $type)->count();
        }

        return response()->json([
            'success' => true,
            'message' => 'Work order statistics retrieved',
            'data' => $stats,
        ], 200);
    }
}
