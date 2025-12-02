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
    public function kartuKendali(Request $request): JsonResponse
    {
        $query = WorkOrder::where('status', 'completed')
            ->with(['ticket.user', 'ticket.diagnosis.technician', 'createdBy']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('ticket', function ($ticketQ) use ($search) {
                    $ticketQ->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                })
                ->orWhere('vendor_name', 'like', "%{$search}%")
                ->orWhere('license_name', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $perPage = $request->per_page ?? 15;
        $workOrders = $query->orderBy('completed_at', 'desc')->paginate($perPage);

        // Transform data untuk kartu kendali
        $data = $workOrders->map(function ($wo) {
            $ticket = $wo->ticket;
            $ticketData = is_string($ticket?->data) ? json_decode($ticket->data, true) : ($ticket?->data ?? []);
            
            // Get asset NUP untuk hitung total perawatan
            $assetNup = $ticketData['asset_nup'] ?? $ticketData['nup'] ?? $ticket?->nup ?? null;
            
            // Hitung berapa kali aset ini sudah dirawat (completed work orders dengan NUP yang sama)
            $maintenanceCount = 0;
            if ($assetNup) {
                $maintenanceCount = WorkOrder::where('status', 'completed')
                    ->whereHas('ticket', function ($q) use ($assetNup) {
                        $q->where('nup', $assetNup)
                            ->orWhere('form_data->nup', $assetNup)
                            ->orWhere('form_data->asset_nup', $assetNup);
                    })
                    ->count();
            }

            // Get diagnosis data
            $diagnosis = $ticket?->diagnosis;
            $diagnosisData = null;
            if ($diagnosis) {
                $diagnosisData = [
                    'physicalCondition' => $diagnosis->physical_condition,
                    'visualInspection' => $diagnosis->visual_inspection,
                    'problemDescription' => $diagnosis->problem_description,
                    'problemCategory' => $diagnosis->problem_category,
                    'testingResult' => $diagnosis->testing_result,
                    'faultyComponents' => $diagnosis->faulty_components ?? [],
                    'isRepairable' => $diagnosis->is_repairable,
                    'repairType' => $diagnosis->repair_type,
                    'repairDifficulty' => $diagnosis->repair_difficulty,
                    'repairRecommendation' => $diagnosis->repair_recommendation,
                    'requiresSparepart' => $diagnosis->requires_sparepart,
                    'requiredSpareparts' => $diagnosis->required_spareparts ?? [],
                    'requiresVendor' => $diagnosis->requires_vendor,
                    'vendorReason' => $diagnosis->vendor_reason,
                    'technicianNotes' => $diagnosis->technician_notes,
                    'diagnosedAt' => $diagnosis->diagnosed_at?->toISOString(),
                    'technicianName' => $diagnosis->technician?->name,
                ];
            }

            return [
                'id' => $wo->id,
                'ticketId' => $wo->ticket_id,
                'ticketNumber' => $ticket?->ticket_number,
                'ticketTitle' => $ticket?->title,
                'type' => $wo->type,
                'completedAt' => $wo->completed_at?->toISOString(),
                'completionNotes' => $wo->completion_notes,
                // Asset info
                'assetCode' => $ticketData['asset_code'] ?? $ticketData['kode_barang'] ?? $ticket?->kode_barang ?? null,
                'assetName' => $ticketData['asset_name'] ?? $ticketData['nama_barang'] ?? $ticket?->title,
                'assetNup' => $assetNup,
                'maintenanceCount' => $maintenanceCount, // Berapa kali aset ini sudah dirawat
                // Work order specific data (apa yang diminta)
                'items' => $wo->items,
                'vendorName' => $wo->vendor_name,
                'vendorContact' => $wo->vendor_contact,
                'vendorDescription' => $wo->vendor_description,
                'licenseName' => $wo->license_name,
                'licenseDescription' => $wo->license_description,
                // Diagnosis data
                'diagnosis' => $diagnosisData,
                // Technician info
                'technicianId' => $wo->created_by,
                'technicianName' => $wo->createdBy?->name,
                // Requester info
                'requesterId' => $ticket?->user_id,
                'requesterName' => $ticket?->user?->name,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali retrieved successfully',
            'data' => $data,
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
     * Export Kartu Kendali ke Excel
     * GET /kartu-kendali/export
     */
    public function exportKartuKendali(Request $request)
    {
        $workOrders = WorkOrder::where('status', 'completed')
            ->with(['ticket.user', 'ticket.diagnosis.technician', 'createdBy'])
            ->orderBy('completed_at', 'desc')
            ->get();

        // Transform data
        $rows = [];
        $no = 1;
        foreach ($workOrders as $wo) {
            $ticket = $wo->ticket;
            $ticketData = is_string($ticket?->data) ? json_decode($ticket->data, true) : ($ticket?->data ?? []);
            $diagnosis = $ticket?->diagnosis;
            
            // Parse items JSON
            $items = $wo->items;
            if (is_string($items)) {
                $items = json_decode($items, true) ?? [];
            }
            $itemsText = collect($items)->map(fn($i) => ($i['name'] ?? $i['item_name'] ?? '') . ' x' . ($i['quantity'] ?? 1))->implode(', ');

            $rows[] = [
                'no' => $no++,
                'ticket_number' => $ticket?->ticket_number ?? '-',
                'ticket_title' => $ticket?->title ?? '-',
                'asset_code' => $ticketData['asset_code'] ?? $ticketData['kode_barang'] ?? '-',
                'asset_nup' => $ticketData['asset_nup'] ?? $ticketData['nup'] ?? '-',
                'requester' => $ticket?->user?->name ?? '-',
                'technician' => $wo->createdBy?->name ?? '-',
                // Diagnosis
                'problem' => $diagnosis?->problem_description ?? '-',
                'physical_condition' => $diagnosis?->physical_condition ?? '-',
                'is_repairable' => $diagnosis?->is_repairable ? 'Ya' : 'Tidak',
                'repair_recommendation' => $diagnosis?->repair_recommendation ?? '-',
                // Work order
                'spareparts' => $itemsText ?: '-',
                'vendor_name' => $wo->vendor_name ?? '-',
                'vendor_description' => $wo->vendor_description ?? '-',
                'license_name' => $wo->license_name ?? '-',
                'license_description' => $wo->license_description ?? '-',
                'completion_notes' => $wo->completion_notes ?? '-',
                'completed_at' => $wo->completed_at?->format('d/m/Y H:i') ?? '-',
            ];
        }

        // Generate Excel menggunakan PhpSpreadsheet
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Kartu Kendali');

        // Header
        $headers = [
            'No', 'No. Tiket', 'Judul Tiket', 'Kode Aset', 'NUP', 
            'Pelapor', 'Teknisi', 'Masalah', 'Kondisi Fisik', 
            'Dapat Diperbaiki', 'Rekomendasi', 'Suku Cadang', 
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
            $sheet->setCellValue('I' . $rowNum, $row['physical_condition']);
            $sheet->setCellValue('J' . $rowNum, $row['is_repairable']);
            $sheet->setCellValue('K' . $rowNum, $row['repair_recommendation']);
            $sheet->setCellValue('L' . $rowNum, $row['spareparts']);
            $sheet->setCellValue('M' . $rowNum, $row['vendor_name']);
            $sheet->setCellValue('N' . $rowNum, $row['vendor_description']);
            $sheet->setCellValue('O' . $rowNum, $row['license_name']);
            $sheet->setCellValue('P' . $rowNum, $row['license_description']);
            $sheet->setCellValue('Q' . $rowNum, $row['completion_notes']);
            $sheet->setCellValue('R' . $rowNum, $row['completed_at']);
            $rowNum++;
        }

        // Auto-size columns
        foreach (range('A', 'R') as $col) {
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
}
