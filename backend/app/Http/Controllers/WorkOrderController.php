<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\Ticket;
use App\Models\Timeline;
use App\Http\Resources\WorkOrderResource;
use App\Traits\HasRoleHelper;
use App\Services\TicketNotificationService;
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
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by ticket_id
        if ($request->has('ticket_id')) {
            $query->where('ticket_id', $request->ticket_id);
        }

        // Filter by created_by (for teknisi viewing their own work orders)
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        // Search filter - search by ticket number, title, sparepart name, vendor name, license name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                // Search in ticket
                $q->whereHas('ticket', function ($ticketQ) use ($search) {
                    $ticketQ->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                })
                // Search in items JSON (sparepart names)
                ->orWhere('items', 'like', "%{$search}%")
                // Search in vendor fields
                ->orWhere('vendor_name', 'like', "%{$search}%")
                ->orWhere('vendor_description', 'like', "%{$search}%")
                // Search in license fields
                ->orWhere('license_name', 'like', "%{$search}%")
                ->orWhere('license_description', 'like', "%{$search}%");
            });
        }

        // Role-based filtering (only if not filtering by specific created_by)
        $user = Auth::user();
        if (!$request->has('created_by') && $user && !$this->userHasAnyRole($user, ['super_admin', 'admin_penyedia'])) {
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
     * Get work orders by ticket
     */
    public function listByTicket(Ticket $ticket): JsonResponse
    {
        $workOrders = $ticket->workOrders()
            ->with(['createdBy', 'timeline'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => WorkOrderResource::collection($workOrders),
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
        // Reset work_orders_ready to false since new work order needs to be completed
        if (in_array($ticket->status, ['in_progress', 'in_diagnosis', 'in_repair'])) {
            $ticket->update([
                'status' => 'on_hold',
                'work_orders_ready' => false,
            ]);
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

        // Notifikasi ke admin_penyedia
        TicketNotificationService::onWorkOrderCreated($ticket, $validated['type']);

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
     * Update work order status - flexible transitions allowed
     * PATCH /work-orders/{id}/status
     * 
     * Request body:
     * {
     *   "status": "requested" | "in_procurement" | "completed" | "unsuccessful",
     *   "vendor_name": "PT ABC",     // optional for vendor type
     *   "vendor_contact": "08xx",    // optional for vendor type
     *   "completion_notes": "...",   // required for completed
     *   "failure_reason": "..."      // required for unsuccessful
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
            'status' => 'required|in:requested,in_procurement,completed,unsuccessful',
            'completion_notes' => 'nullable|string',
            'failure_reason' => 'nullable|string',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $workOrder->status;

        // Validate transition (sekarang fleksibel, hanya cek tidak boleh sama)
        if (!$workOrder->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => $oldStatus === $newStatus 
                    ? 'Status sudah ' . WorkOrder::getStatusLabel($oldStatus)
                    : "Tidak dapat mengubah status dari {$oldStatus} ke {$newStatus}",
                'current_status' => $oldStatus,
            ], 422);
        }

        // Validation for specific statuses
        if ($newStatus === 'unsuccessful' && empty($validated['failure_reason'])) {
            return response()->json([
                'success' => false,
                'message' => 'Alasan kegagalan wajib diisi saat menandai tidak berhasil',
            ], 422);
        }

        // Update status
        $workOrder->status = $newStatus;

        // Update vendor info if provided (untuk type vendor)
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

            // Check if all work orders for this ticket are completed
            $this->checkAndUpdateTicketWorkOrdersReady($workOrder);
        }

        // Handle unsuccessful
        if ($newStatus === 'unsuccessful') {
            $workOrder->failure_reason = $validated['failure_reason'] ?? null;
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
                'completion_notes' => $validated['completion_notes'] ?? null,
                'failure_reason' => $validated['failure_reason'] ?? null,
            ],
        ]);

        // Send notification to teknisi yang buat work order
        $ticket = $workOrder->ticket;
        if ($ticket && $workOrder->created_by) {
            TicketNotificationService::onWorkOrderStatusChanged(
                $ticket,
                $workOrder->created_by,
                $oldStatus,
                $newStatus
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Work order status updated successfully',
            'data' => new WorkOrderResource($workOrder->load(['ticket', 'createdBy', 'timeline'])),
        ], 200);
    }

    /**
     * Check if all work orders for ticket are completed, update work_orders_ready flag
     */
    private function checkAndUpdateTicketWorkOrdersReady(WorkOrder $workOrder): void
    {
        $ticket = $workOrder->ticket;
        if (!$ticket) {
            return;
        }

        // Check if all work orders for this ticket are completed
        $allWorkOrdersCompleted = !WorkOrder::where('ticket_id', $ticket->id)
            ->whereNotIn('status', ['completed', 'unsuccessful'])
            ->exists();

        if ($allWorkOrdersCompleted) {
            $ticket->work_orders_ready = true;
            $ticket->save();

            // Notifikasi ke teknisi bahwa semua work orders sudah selesai
            if ($ticket->assigned_to) {
                TicketNotificationService::onAllWorkOrdersCompleted($ticket, $ticket->assigned_to);
            }
        }
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
        // Count by status
        $byStatus = [
            'requested' => WorkOrder::where('status', 'requested')->count(),
            'in_procurement' => WorkOrder::where('status', 'in_procurement')->count(),
            'completed' => WorkOrder::where('status', 'completed')->count(),
            'unsuccessful' => WorkOrder::where('status', 'unsuccessful')->count(),
        ];

        // Count by type
        $byType = [
            'sparepart' => WorkOrder::where('type', 'sparepart')->count(),
            'vendor' => WorkOrder::where('type', 'vendor')->count(),
            'license' => WorkOrder::where('type', 'license')->count(),
        ];

        // Recent work orders (latest 10)
        $recentWorkOrders = WorkOrder::with(['ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($wo) {
                return [
                    'id' => $wo->id,
                    'type' => $wo->type,
                    'status' => $wo->status,
                    'ticketNumber' => $wo->ticket?->ticket_number,
                    'ticketTitle' => $wo->ticket?->title,
                    'createdAt' => $wo->created_at->toISOString(),
                ];
            });

        $stats = [
            'total' => WorkOrder::count(),
            'by_status' => $byStatus,
            'by_type' => $byType,
            'recent' => $recentWorkOrders,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Work order statistics retrieved',
            'data' => $stats,
        ], 200);
    }

    /**
     * Get Kartu Kendali - completed work orders grouped by ticket
     * GET /work-orders/kartu-kendali
     */
    /**
     * Kartu Kendali List - 1 entry per TIKET perbaikan
     * Semua tiket type=perbaikan ditampilkan (tidak harus punya work order)
     */
    public function kartuKendali(Request $request): JsonResponse
    {
        // Ambil semua tiket perbaikan kecuali yang rejected
        // PENTING: Filter work order completed harus dilakukan SEBELUM pagination
        $query = Ticket::where('type', 'perbaikan')
            ->where('status', '!=', 'rejected')
            // Filter: HANYA tiket yang punya work order completed
            ->whereHas('workOrders', function ($q) {
                $q->where('status', 'completed');
            })
            ->with(['user', 'assignedUser', 'workOrders' => function ($q) {
                $q->where('status', 'completed')
                  ->orderBy('completed_at', 'desc');
            }]);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('kode_barang', 'like', "%{$search}%")
                    ->orWhere('nup', 'like', "%{$search}%")
                    ->orWhere('form_data->assetCode', 'like', "%{$search}%")
                    ->orWhere('form_data->kode_barang', 'like', "%{$search}%")
                    ->orWhere('form_data->assetNUP', 'like', "%{$search}%")
                    ->orWhere('form_data->nup', 'like', "%{$search}%");
            });
        }

        // Filter by status (optional)
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $perPage = $request->per_page ?? 15;
        $tickets = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        // Transform data - 1 entry per tiket
        $data = $tickets->map(function ($ticket) {
            
            $formData = is_string($ticket->form_data) ? json_decode($ticket->form_data, true) : ($ticket->form_data ?? []);
            
            $assetCode = $formData['assetCode'] ?? $formData['kode_barang'] ?? $ticket->kode_barang ?? null;
            $assetNup = $formData['assetNUP'] ?? $formData['nup'] ?? $ticket->nup ?? null;
            
            // Hitung berapa kali aset ini sudah dirawat (tiket berbeda dengan NUP sama)
            $maintenanceCount = 0;
            if ($assetNup) {
                $maintenanceCount = Ticket::where('type', 'perbaikan')
                    ->where(function ($q) use ($assetNup) {
                        $q->where('nup', $assetNup)
                            ->orWhere('form_data->nup', $assetNup)
                            ->orWhere('form_data->asset_nup', $assetNup)
                            ->orWhere('form_data->assetNUP', $assetNup);
                    })->count();
            }

            // Ambil completed work order terakhir untuk tanggal selesai (jika ada)
            $latestWo = $ticket->workOrders->first();
            
            // Hitung total work orders completed untuk tiket ini
            $workOrderCount = $ticket->workOrders->count();
            
            // Get teknisi dari assignedTo
            $technicianName = $ticket->assignedUser?->name 
                ?? $latestWo?->createdBy?->name 
                ?? null;

            return [
                'id' => $ticket->id,
                'ticketId' => $ticket->id,
                'ticketNumber' => $ticket->ticket_number,
                'ticketTitle' => $ticket->title,
                'ticketStatus' => $ticket->status,
                'completedAt' => $latestWo?->completed_at?->toISOString(),
                'closedAt' => $ticket->status === 'closed' ? $ticket->updated_at?->toISOString() : null,
                // Asset info
                'assetCode' => $assetCode,
                'assetName' => $formData['assetName'] ?? $formData['nama_barang'] ?? $ticket->title,
                'assetNup' => $assetNup,
                'maintenanceCount' => $maintenanceCount,
                'workOrderCount' => $workOrderCount,
                // Technician info
                'technicianName' => $technicianName,
                // Requester info
                'requesterId' => $ticket->user_id,
                'requesterName' => $ticket->user?->name,
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali retrieved successfully',
            'data' => $data,
            'pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'from' => $tickets->firstItem(),
                'to' => $tickets->lastItem(),
            ],
        ], 200);
    }

    /**
     * Kartu Kendali Detail - 1 tiket perbaikan dengan semua info
     * GET /kartu-kendali/{ticket}
     * Menampilkan diagnosis, work orders (jika ada), dll
     */
    public function kartuKendaliDetail(Ticket $ticket): JsonResponse
    {
        // Load relations - termasuk semua work orders (completed atau tidak)
        $ticket->load(['user', 'diagnosis.technician', 'assignedUser', 'workOrders' => function ($q) {
            $q->with('createdBy')->orderBy('completed_at', 'asc');
        }]);
        
        $formData = is_string($ticket->form_data) ? json_decode($ticket->form_data, true) : ($ticket->form_data ?? []);
        
        // Get asset info
        $assetCode = $formData['assetCode'] ?? $formData['kode_barang'] ?? $ticket->kode_barang ?? null;
        $assetNup = $formData['assetNUP'] ?? $formData['nup'] ?? $ticket->nup ?? null;
        
        // Get related tickets (same NUP, different ticket) - semua tiket perbaikan
        $relatedTickets = [];
        $maintenanceCount = 0;
        
        if ($assetNup) {
            $relatedTicketQuery = Ticket::where('type', 'perbaikan')
                ->where('id', '!=', $ticket->id)
                ->where(function ($q) use ($assetNup) {
                    $q->where('nup', $assetNup)
                        ->orWhere('form_data->nup', $assetNup)
                        ->orWhere('form_data->asset_nup', $assetNup)
                        ->orWhere('form_data->assetNUP', $assetNup);
                })
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Hitung total tiket dengan aset yang sama (termasuk tiket ini)
            $maintenanceCount = $relatedTicketQuery->count() + 1;
            
            $relatedTickets = $relatedTicketQuery->map(fn($t) => [
                'id' => $t->id,
                'ticketNumber' => $t->ticket_number,
                'title' => $t->title,
                'status' => $t->status,
                'createdAt' => $t->created_at?->toISOString(),
            ])->values()->toArray();
        }

        // Get diagnosis data
        $diagnosis = $ticket->diagnosis;
        $diagnosisData = null;
        if ($diagnosis) {
            $diagnosisData = [
                'problem_category' => $diagnosis->problem_category,
                'problem_description' => $diagnosis->problem_description,
                'repair_type' => $diagnosis->repair_type,
                'is_repairable' => $diagnosis->repair_type !== 'unrepairable',
                'repair_description' => $diagnosis->repair_description,
                'unrepairable_reason' => $diagnosis->unrepairable_reason,
                'alternative_solution' => $diagnosis->alternative_solution,
                'technician_notes' => $diagnosis->technician_notes,
                'estimasi_hari' => $diagnosis->estimasi_hari,
                'diagnosed_at' => $diagnosis->created_at?->toISOString(),
                'technician_name' => $diagnosis->technician?->name,
            ];
        }

        // Ambil semua work orders (completed atau tidak)
        $allWorkOrders = $ticket->workOrders;
        $completedWorkOrders = $allWorkOrders->where('status', 'completed');
        
        // Spareparts - gabungkan semua items dari WO type=sparepart yang completed
        $allSpareparts = [];
        foreach ($completedWorkOrders->where('type', 'sparepart') as $wo) {
            $items = is_string($wo->items) ? json_decode($wo->items, true) : ($wo->items ?? []);
            foreach ($items as $item) {
                $allSpareparts[] = [
                    'name' => $item['name'] ?? $item['sparepart_name'] ?? '-',
                    'quantity' => $item['quantity'] ?? $item['qty'] ?? 1,
                    'unit' => $item['unit'] ?? '-',
                    'completedAt' => $wo->completed_at?->toISOString(),
                    'technicianName' => $wo->createdBy?->name,
                ];
            }
        }
        
        // Vendors - setiap vendor punya catatan penyelesaian masing-masing
        $allVendors = [];
        foreach ($completedWorkOrders->where('type', 'vendor') as $wo) {
            $allVendors[] = [
                'name' => $wo->vendor_name,
                'contact' => $wo->vendor_contact,
                'description' => $wo->vendor_description,
                'completionNotes' => $wo->completion_notes,
                'completedAt' => $wo->completed_at?->toISOString(),
                'technicianName' => $wo->createdBy?->name,
            ];
        }
        
        // Licenses
        $allLicenses = [];
        foreach ($completedWorkOrders->where('type', 'license') as $wo) {
            $allLicenses[] = [
                'name' => $wo->license_name,
                'description' => $wo->license_description,
                'completedAt' => $wo->completed_at?->toISOString(),
                'technicianName' => $wo->createdBy?->name,
            ];
        }
        
        // Pending work orders (belum completed, kecualikan unsuccessful)
        $pendingWorkOrders = $allWorkOrders->whereNotIn('status', ['completed', 'unsuccessful'])->map(fn($wo) => [
            'id' => $wo->id,
            'type' => $wo->type,
            'status' => $wo->status,
            'createdAt' => $wo->created_at?->toISOString(),
        ])->values()->toArray();

        // Unsuccessful work orders
        $unsuccessfulWorkOrders = $allWorkOrders->where('status', 'unsuccessful');
        $unsuccessfulWorkOrdersData = $unsuccessfulWorkOrders->map(fn($wo) => [
            'id' => $wo->id,
            'type' => $wo->type,
            'status' => $wo->status,
            'createdAt' => $wo->created_at?->toISOString(),
            'updatedAt' => $wo->updated_at?->toISOString(),
        ])->values()->toArray();

        // Teknisi - dari assigned atau diagnosis
        $technicianName = $ticket->assignedUser?->name ?? $diagnosis?->technician?->name ?? null;

        $data = [
            'id' => $ticket->id,
            'ticketId' => $ticket->id,
            'ticketNumber' => $ticket->ticket_number,
            'ticketTitle' => $ticket->title,
            'ticketStatus' => $ticket->status,
            'createdAt' => $ticket->created_at?->toISOString(),
            'closedAt' => $ticket->status === 'closed' ? $ticket->updated_at?->toISOString() : null,
            // Tanggal terakhir work order completed (jika ada)
            'lastCompletedAt' => $completedWorkOrders->sortByDesc('completed_at')->first()?->completed_at?->toISOString(),
            // Asset info
            'assetCode' => $assetCode,
            'assetName' => $formData['assetName'] ?? $formData['nama_barang'] ?? $ticket->title,
            'assetNup' => $assetNup,
            'maintenanceCount' => $maintenanceCount,
            'relatedTickets' => $relatedTickets,
            // Gabungan semua work orders completed
            'spareparts' => $allSpareparts,
            'vendors' => $allVendors,
            'licenses' => $allLicenses,
            'totalWorkOrders' => $allWorkOrders->count(),
            'completedWorkOrders' => $completedWorkOrders->count(),
            'unsuccessfulWorkOrders' => $unsuccessfulWorkOrders->count(),
            'pendingWorkOrders' => $pendingWorkOrders,
            'unsuccessfulWorkOrdersList' => $unsuccessfulWorkOrdersData,
            // Diagnosis data
            'diagnosis' => $diagnosisData,
            // Requester info
            'requesterId' => $ticket->user_id,
            'requesterName' => $ticket->user?->name,
            // Technician info
            'technicianName' => $technicianName,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali detail retrieved successfully',
            'data' => $data,
        ], 200);
    }

    /**
     * Export Kartu Kendali ke Excel
     * GET /kartu-kendali/export
     */
    public function exportKartuKendali(Request $request)
    {
        // Hanya ambil work order yang benar-benar completed (bukan unsuccessful)
        $workOrders = WorkOrder::where('status', 'completed')
            ->with(['ticket.user', 'ticket.diagnosis.technician', 'createdBy'])
            ->orderBy('completed_at', 'desc')
            ->get();

        // Transform data
        $rows = [];
        $no = 1;
        foreach ($workOrders as $wo) {
            $ticket = $wo->ticket;
            $formData = is_string($ticket?->form_data) ? json_decode($ticket->form_data, true) : ($ticket?->form_data ?? []);
            $diagnosis = $ticket?->diagnosis;
            
            // Parse items JSON
            $items = $wo->items;
            if (is_string($items)) {
                $items = json_decode($items, true) ?? [];
            }
            $itemsText = collect($items)->map(fn($i) => ($i['name'] ?? $i['item_name'] ?? '') . ' ' . ($i['quantity'] ?? 1) . ' ' . ($i['unit'] ?? ''))->implode(', ');

            $rows[] = [
                'no' => $no++,
                'ticket_number' => $ticket?->ticket_number ?? '-',
                'ticket_title' => $ticket?->title ?? '-',
                'asset_code' => $ticket?->kode_barang ?? $formData['assetCode'] ?? $formData['kode_barang'] ?? '-',
                'asset_nup' => $ticket?->nup ?? $formData['assetNUP'] ?? $formData['nup'] ?? '-',
                'requester' => $ticket?->user?->name ?? '-',
                'technician' => $wo->createdBy?->name ?? '-',
                // Diagnosis
                'problem' => $diagnosis?->problem_description ?? '-',
                'is_repairable' => $diagnosis?->repair_type !== 'unrepairable' ? 'Ya' : 'Tidak',
                'repair_notes' => $diagnosis?->technician_notes ?? '-',
                // Work order
                'spareparts' => $itemsText ?: '-',
                'vendor_name' => $wo->vendor_name ?? '-',
                'vendor_description' => $wo->vendor_description ?? '-',
                'license_name' => $wo->license_name ?? '-',
                'license_description' => $wo->license_description ?? '-',
                'completion_notes' => $wo->completion_notes ?? '-',
                'completed_at' => $wo->completed_at?->timezone('Asia/Jakarta')->format('d/m/Y H:i') ?? '-',
            ];
        }

        // Generate Excel menggunakan PhpSpreadsheet
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Kartu Kendali');

        // Header
        $headers = [
            'No', 'No. Tiket', 'Judul Tiket', 'Kode Aset', 'NUP', 
            'Pelapor', 'Teknisi', 'Masalah', 
            'Dapat Diperbaiki', 'Catatan Teknisi', 'Suku Cadang', 
            'Nama Vendor', 'Deskripsi Vendor', 'Nama Lisensi', 
            'Deskripsi Lisensi', 'Catatan Penyelesaian', 'Tanggal Selesai'
        ];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('4472C4');
            $sheet->getStyle($col . '1')->getFont()->getColor()->setRGB('FFFFFF');
            $col++;
        }

        // Data rows
        $rowNum = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue('A' . $rowNum, $row['no']);
            $sheet->setCellValue('B' . $rowNum, $row['ticket_number']);
            $sheet->setCellValue('C' . $rowNum, $row['ticket_title']);
            $sheet->setCellValue('D' . $rowNum, $row['asset_code']);
            $sheet->setCellValue('E' . $rowNum, $row['asset_nup']);
            $sheet->setCellValue('F' . $rowNum, $row['requester']);
            $sheet->setCellValue('G' . $rowNum, $row['technician']);
            $sheet->setCellValue('H' . $rowNum, $row['problem']);
            $sheet->setCellValue('I' . $rowNum, $row['is_repairable']);
            $sheet->setCellValue('J' . $rowNum, $row['repair_notes']);
            $sheet->setCellValue('K' . $rowNum, $row['spareparts']);
            $sheet->setCellValue('L' . $rowNum, $row['vendor_name']);
            $sheet->setCellValue('M' . $rowNum, $row['vendor_description']);
            $sheet->setCellValue('N' . $rowNum, $row['license_name']);
            $sheet->setCellValue('O' . $rowNum, $row['license_description']);
            $sheet->setCellValue('P' . $rowNum, $row['completion_notes']);
            $sheet->setCellValue('Q' . $rowNum, $row['completed_at']);
            $rowNum++;
        }

        // Auto-size columns
        foreach (range('A', 'Q') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Stream response sebagai Excel
        $filename = 'kartu_kendali_' . date('Y-m-d_His') . '.xlsx';
        
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Change BMN condition for unsuccessful work order (sparepart/vendor only)
     */
    public function changeBMNCondition(Request $request, WorkOrder $workOrder): JsonResponse
    {
        $user = Auth::user();

        // Only teknisi can change BMN condition
        if (!$this->userHasRole($user, 'teknisi')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate work order type and status
        if (!in_array($workOrder->type, ['sparepart', 'vendor'])) {
            return response()->json(['message' => 'BMN condition can only be changed for sparepart or vendor work orders'], 400);
        }

        if ($workOrder->status !== 'unsuccessful') {
            return response()->json(['message' => 'BMN condition can only be changed for unsuccessful work orders'], 400);
        }

        $validated = $request->validate([
            'asset_condition_change' => 'required|in:Baik,Rusak Ringan,Rusak Berat',
        ]);

        // Get ticket and asset
        $ticket = $workOrder->ticket;
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $asset = \App\Models\Asset::findByCodeAndNup($ticket->kode_barang, $ticket->nup);
        if (!$asset) {
            return response()->json(['message' => 'Asset BMN not found'], 404);
        }

        $oldCondition = $asset->kondisi;
        $newCondition = $validated['asset_condition_change'];

        // Update work order
        $workOrder->update([
            'asset_condition_change' => $newCondition,
        ]);

        // Update asset condition
        $asset->update(['kondisi' => $newCondition]);

        // Create audit log
        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ASSET_CONDITION_CHANGED',
            'details' => "Asset {$asset->kode_barang} NUP {$asset->nup} condition changed from {$oldCondition} to {$newCondition} via work order #{$workOrder->id}",
            'ip_address' => request()->ip(),
        ]);

        // Send notification to superadmins
        $superAdmins = \App\Models\User::where('role', 'super_admin')->get();
        foreach ($superAdmins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'warning',
                'title' => 'Perubahan Kondisi Asset BMN (Work Order)',
                'message' => "Kondisi barang BMN telah diubah melalui work order yang tidak berhasil:\n\nTiket: {$ticket->ticket_number}\nWork Order: #{$workOrder->id} ({$workOrder->type})\n\nKode Barang: {$asset->kode_barang}\nNUP: {$asset->nup}\nNama Barang: {$asset->nama_barang}\nMerek/Tipe: {$asset->merek}\n\nKondisi Lama: {$oldCondition}\nKondisi Baru: {$newCondition}\n\nDiubah oleh: {$user->name}",
                'reference_type' => 'asset',
                'reference_id' => $asset->id,
                'action_url' => "/tickets/{$ticket->id}",
                'data' => json_encode([
                    'ticket_id' => $ticket->id,
                    'work_order_id' => $workOrder->id,
                    'asset_id' => $asset->id,
                    'kode_barang' => $asset->kode_barang,
                    'nup' => $asset->nup,
                    'old_condition' => $oldCondition,
                    'new_condition' => $newCondition,
                ]),
            ]);
        }

        // Create timeline entry
        Timeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'ASSET_CONDITION_CHANGED',
            'description' => "Kondisi BMN diubah menjadi {$newCondition} (Work Order #{$workOrder->id} tidak berhasil)",
            'details' => json_encode([
                'work_order_id' => $workOrder->id,
                'work_order_type' => $workOrder->type,
                'old_condition' => $oldCondition,
                'new_condition' => $newCondition,
                'asset_code' => $asset->kode_barang,
                'asset_nup' => $asset->nup,
            ]),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kondisi BMN berhasil diubah',
            'data' => new WorkOrderResource($workOrder->fresh()),
        ]);
    }
}
