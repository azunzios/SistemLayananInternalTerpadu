<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Http\Resources\AssetResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    /**
     * Get all assets with filtering
     */
    public function index(Request $request)
    {
        $query = Asset::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->active === 'true');
        }

        // Filter by condition
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        // Filter by asset type
        if ($request->has('asset_type')) {
            $query->where('asset_type', $request->asset_type);
        }

        // Search by name, code, or NUP
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('asset_name', 'like', "%$search%")
                  ->orWhere('asset_code', 'like', "%$search%")
                  ->orWhere('asset_nup', 'like', "%$search%")
                  ->orWhere('serial_number', 'like', "%$search%");
            });
        }

        $assets = $query->paginate($request->get('per_page', 15));

        return AssetResource::collection($assets);
    }

    /**
     * Get single asset
     */
    public function show(Asset $asset)
    {
        return new AssetResource($asset);
    }

    /**
     * Create new asset
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_code' => 'required|string|unique:assets,asset_code',
            'asset_nup' => 'required|string|unique:assets,asset_nup',
            'asset_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'asset_type' => 'nullable|string',
            'manufacturer' => 'nullable|string',
            'model' => 'nullable|string',
            'serial_number' => 'nullable|string|unique:assets,serial_number',
            'location' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'unit_kerja' => 'nullable|string',
            'condition' => 'in:baru,baik,kurang_baik,rusak',
            'is_active' => 'boolean',
            'acquisition_date' => 'nullable|date',
            'warranty_end_date' => 'nullable|date',
            'acquisition_cost' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
        ]);

        $asset = Asset::create($validated);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ASSET_CREATED',
            'details' => "Asset created: {$asset->asset_name} ({$asset->asset_code})",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(new AssetResource($asset), 201);
    }

    /**
     * Update asset
     */
    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'asset_code' => 'string|unique:assets,asset_code,' . $asset->id,
            'asset_nup' => 'string|unique:assets,asset_nup,' . $asset->id,
            'asset_name' => 'string|max:255',
            'description' => 'nullable|string',
            'asset_type' => 'nullable|string',
            'manufacturer' => 'nullable|string',
            'model' => 'nullable|string',
            'serial_number' => 'nullable|string|unique:assets,serial_number,' . $asset->id,
            'location' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'unit_kerja' => 'nullable|string',
            'condition' => 'in:baru,baik,kurang_baik,rusak',
            'is_active' => 'boolean',
            'acquisition_date' => 'nullable|date',
            'warranty_end_date' => 'nullable|date',
            'acquisition_cost' => 'nullable|numeric|min:0',
            'current_value' => 'nullable|numeric|min:0',
        ]);

        $asset->update($validated);

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ASSET_UPDATED',
            'details' => "Asset updated: {$asset->asset_name} ({$asset->asset_code})",
            'ip_address' => request()->ip(),
        ]);

        return new AssetResource($asset);
    }

    /**
     * Delete asset
     */
    public function destroy(Asset $asset)
    {
        $assetName = $asset->asset_name;
        $assetCode = $asset->asset_code;

        $asset->delete();

        // Audit log
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'ASSET_DELETED',
            'details' => "Asset deleted: {$assetName} ({$assetCode})",
            'ip_address' => request()->ip(),
        ]);

        return response()->json(['message' => 'Asset deleted successfully'], 200);
    }

    /**
     * Search assets by code and NUP (for ticket creation)
     */
    public function searchByCodeAndNup(Request $request)
    {
        $validated = $request->validate([
            'asset_code' => 'required|string',
            'asset_nup' => 'required|string',
        ]);

        $asset = Asset::where('asset_code', $validated['asset_code'])
            ->where('asset_nup', $validated['asset_nup'])
            ->active()
            ->first();

        if (!$asset) {
            return response()->json([
                'message' => 'Barang tidak ditemukan',
                'asset' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Barang ditemukan',
            'asset' => new AssetResource($asset),
        ], 200);
    }

    /**
     * Get asset types
     */
    public function getTypes()
    {
        return response()->json([
            'types' => [
                'Elektronik',
                'Furniture',
                'Peralatan Kantor',
                'Kendaraan',
                'Mesin',
                'Lainnya',
            ],
        ]);
    }

    /**
     * Get asset conditions
     */
    public function getConditions()
    {
        return response()->json([
            'conditions' => [
                'baru' => 'Baru',
                'baik' => 'Baik',
                'kurang_baik' => 'Kurang Baik',
                'rusak' => 'Rusak',
            ],
        ]);
    }
}
