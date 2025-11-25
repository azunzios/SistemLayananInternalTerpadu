<?php

namespace App\Http\Controllers;

use App\Models\KartuKendali;
use App\Models\KartuKendaliEntry;
use App\Http\Resources\KartuKendaliResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class KartuKendaliController extends Controller
{
    use \App\Traits\HasRoleHelper;

    /**
     * List all Kartu Kendali with filtering
     * GET /kartu-kendali?asset_code=...&condition=...&page=1&per_page=15
     */
    public function index(Request $request): JsonResponse
    {
        $query = KartuKendali::query();

        // Filter by asset code
        if ($request->has('asset_code')) {
            $query->byAssetCode($request->asset_code);
        }

        // Filter by condition
        if ($request->has('condition')) {
            $query->byCondition($request->condition);
        }

        // Filter by active only
        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Search by asset name or NUP
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('asset_name', 'like', "%$search%")
                  ->orWhere('asset_nup', 'like', "%$search%")
                  ->orWhere('asset_code', 'like', "%$search%");
            });
        }

        $perPage = $request->input('per_page', 15);
        $kartuKendali = $query->with('responsibleUser', 'entries')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali retrieved successfully',
            'data' => KartuKendaliResource::collection($kartuKendali),
            'pagination' => [
                'total' => $kartuKendali->total(),
                'per_page' => $kartuKendali->perPage(),
                'current_page' => $kartuKendali->currentPage(),
                'last_page' => $kartuKendali->lastPage(),
                'from' => $kartuKendali->firstItem(),
                'to' => $kartuKendali->lastItem(),
            ],
        ], 200);
    }

    /**
     * Create new Kartu Kendali
     * POST /kartu-kendali
     */
    public function store(Request $request): JsonResponse
    {
        // Only admin_penyedia and super_admin can create
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to create Kartu Kendali',
            ], 403);
        }

        $validated = $request->validate([
            'asset_code' => 'required|string|max:50|unique:kartu_kendali',
            'asset_nup' => 'required|string|max:50|unique:kartu_kendali',
            'asset_name' => 'required|string|max:255',
            'asset_description' => 'nullable|string',
            'condition' => 'nullable|in:baik,rusak_ringan,rusak_berat',
            'condition_notes' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'metadata' => 'nullable|array',
        ]);

        $kartuKendali = KartuKendali::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali created successfully',
            'data' => new KartuKendaliResource($kartuKendali),
        ], 201);
    }

    /**
     * Get single Kartu Kendali with entries
     * GET /kartu-kendali/{id}
     */
    public function show(KartuKendali $kartuKendali): JsonResponse
    {
        $kartuKendali->load('responsibleUser', 'entries.technician', 'entries.recordedByUser');

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali retrieved successfully',
            'data' => new KartuKendaliResource($kartuKendali),
        ], 200);
    }

    /**
     * Update Kartu Kendali
     * PATCH /kartu-kendali/{id}
     */
    public function update(Request $request, KartuKendali $kartuKendali): JsonResponse
    {
        // Only admin_penyedia and super_admin can update
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update Kartu Kendali',
            ], 403);
        }

        $validated = $request->validate([
            'asset_name' => 'nullable|string|max:255',
            'asset_description' => 'nullable|string',
            'condition' => 'nullable|in:baik,rusak_ringan,rusak_berat',
            'condition_notes' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'metadata' => 'nullable|array',
        ]);

        $kartuKendali->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali updated successfully',
            'data' => new KartuKendaliResource($kartuKendali),
        ], 200);
    }

    /**
     * Delete Kartu Kendali
     * DELETE /kartu-kendali/{id}
     */
    public function destroy(KartuKendali $kartuKendali): JsonResponse
    {
        // Only super_admin can delete
        if (!$this->userHasRole(auth()->user(), 'super_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete Kartu Kendali',
            ], 403);
        }

        $kartuKendali->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali deleted successfully',
        ], 200);
    }

    /**
     * Add maintenance entry to Kartu Kendali
     * POST /kartu-kendali/{id}/entries
     */
    public function addEntry(Request $request, KartuKendali $kartuKendali): JsonResponse
    {
        // Only admin_penyedia, teknisi, and super_admin can add entries
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to add entry',
            ], 403);
        }

        $validated = $request->validate([
            'ticket_id' => 'nullable|exists:tickets,id',
            'work_order_id' => 'nullable|exists:work_orders,id',
            'maintenance_date' => 'required|date',
            'maintenance_type' => 'required|in:inspection,maintenance,repair,spare_part_replacement,upgrade,removal',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_reference' => 'nullable|string|max:100',
            'spareparts' => 'nullable|array',
            'technician_id' => 'required|exists:users,id',
            'description' => 'nullable|string',
            'findings' => 'nullable|string',
            'actions_taken' => 'nullable|string',
            'asset_condition_after' => 'nullable|in:baik,rusak_ringan,rusak_berat',
            'total_cost' => 'nullable|numeric|min:0',
            'attachments' => 'nullable|array',
        ]);

        $entry = KartuKendaliEntry::create([
            ...$validated,
            'kartu_kendali_id' => $kartuKendali->id,
            'recorded_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entry added successfully',
            'data' => $entry,
        ], 201);
    }

    /**
     * Get maintenance entries for a Kartu Kendali
     * GET /kartu-kendali/{id}/entries?page=1&per_page=10
     */
    public function getEntries(Request $request, KartuKendali $kartuKendali): JsonResponse
    {
        $query = $kartuKendali->entries();

        // Filter by maintenance type
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        // Filter by technician
        if ($request->has('technician_id')) {
            $query->byTechnician($request->technician_id);
        }

        $query->with('technician', 'recordedByUser', 'ticket', 'workOrder');

        $perPage = $request->input('per_page', 10);
        $entries = $query->latest('maintenance_date')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Entries retrieved successfully',
            'data' => $entries,
            'pagination' => [
                'total' => $entries->total(),
                'per_page' => $entries->perPage(),
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
            ],
        ], 200);
    }

    /**
     * Create Kartu Kendali entry from completed Work Order
     * POST /kartu-kendali/from-work-order
     */
    public function createFromWorkOrder(Request $request): JsonResponse
    {
        // Only admin_penyedia can create entries from work orders
        if (!$this->userHasAnyRole(auth()->user(), ['admin_penyedia', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admin penyedia can create kartu kendali entries.',
            ], 403);
        }

        $validated = $request->validate([
            'work_order_id' => 'required|exists:work_orders,id',
            'asset_code' => 'required|string|max:50',
            'asset_nup' => 'required|string|max:50',
            'asset_name' => 'required|string|max:255',
            'asset_merk' => 'nullable|string|max:255',
            'maintenance_date' => 'required|date',
        ]);

        $workOrder = \App\Models\WorkOrder::with('ticket')->find($validated['work_order_id']);

        if (!$workOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Work order not found',
            ], 404);
        }

        // Check if work order is completed
        if ($workOrder->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Work order must be completed before creating kartu kendali entry',
            ], 422);
        }

        // Check if this work order already has a kartu kendali entry
        $existingEntry = KartuKendaliEntry::where('work_order_id', $workOrder->id)->first();
        if ($existingEntry) {
            return response()->json([
                'success' => false,
                'message' => 'Kartu kendali entry already exists for this work order',
            ], 422);
        }

        // Find or create Kartu Kendali for this asset
        $kartuKendali = KartuKendali::firstOrCreate(
            ['asset_code' => $validated['asset_code']],
            [
                'asset_nup' => $validated['asset_nup'],
                'asset_name' => $validated['asset_name'],
                'asset_merk' => $validated['asset_merk'] ?? null,
                'condition' => 'baik',
                'location' => $workOrder->ticket->data['asset_location'] ?? null,
            ]
        );

        // Get technician from work order
        $technicianId = $workOrder->created_by;
        $technician = \App\Models\User::find($technicianId);

        // Prepare spareparts, vendor, and license data from work order
        $spareparts = [];
        $vendorName = null;
        $vendorReference = null;
        $vendorContact = null;
        $vendorDescription = null;
        $licenseName = null;
        $licenseDescription = null;

        if ($workOrder->type === 'sparepart') {
            $items = is_string($workOrder->items) ? json_decode($workOrder->items, true) : $workOrder->items;
            $spareparts = $items ?? [];
        } elseif ($workOrder->type === 'vendor') {
            $vendorName = $workOrder->vendor_name;
            $vendorReference = $workOrder->vendor_reference ?? $workOrder->id;
            $vendorContact = $workOrder->vendor_contact;
            $vendorDescription = $workOrder->vendor_description;
        } elseif ($workOrder->type === 'license') {
            $licenseName = $workOrder->license_name;
            $licenseDescription = $workOrder->license_description;
        }

        // Create entry
        $entry = KartuKendaliEntry::create([
            'kartu_kendali_id' => $kartuKendali->id,
            'ticket_id' => $workOrder->ticket_id,
            'work_order_id' => $workOrder->id,
            'maintenance_date' => $validated['maintenance_date'],
            'maintenance_type' => 'corrective',
            'vendor_name' => $vendorName,
            'vendor_reference' => $vendorReference,
            'vendor_contact' => $vendorContact,
            'vendor_description' => $vendorDescription,
            'license_name' => $licenseName,
            'license_description' => $licenseDescription,
            'spareparts' => $spareparts,
            'technician_id' => $technicianId,
            'technician_name' => $technician?->name,
            'recorded_by' => auth()->id(),
            'asset_condition_after' => 'baik',
        ]);

        $kartuKendali->load('responsibleUser', 'entries');

        return response()->json([
            'success' => true,
            'message' => 'Kartu Kendali entry created successfully',
            'data' => [
                'kartu_kendali' => new KartuKendaliResource($kartuKendali),
                'entry' => $entry,
            ],
        ], 201);
    }

    /**
     * Check if work order already has kartu kendali entry
     * GET /kartu-kendali/check-work-order/{work_order_id}
     */
    public function checkWorkOrder($workOrderId): JsonResponse
    {
        $exists = KartuKendaliEntry::where('work_order_id', $workOrderId)->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'has_kartu_kendali' => $exists,
            ],
        ], 200);
    }

    /**
     * Get statistics
     * GET /kartu-kendali/stats/summary
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_assets' => KartuKendali::count(),
            'by_condition' => KartuKendali::groupBy('condition')->selectRaw('condition, count(*) as count')->pluck('count', 'condition'),
            'total_maintenance_records' => KartuKendaliEntry::count(),
            'by_maintenance_type' => KartuKendaliEntry::groupBy('maintenance_type')->selectRaw('maintenance_type, count(*) as count')->pluck('count', 'maintenance_type'),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Statistics retrieved successfully',
            'data' => $stats,
        ], 200);
    }
}
