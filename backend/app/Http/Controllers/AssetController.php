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

        // Filter by sumber dana
        if ($request->has('sumber_dana')) {
            $query->where('sumber_dana', $request->sumber_dana);
        }

        // Filter by status penggunaan
        if ($request->has('status_penggunaan')) {
            $query->where('status_penggunaan', $request->status_penggunaan);
        }

        // Search by name, code, or NUP
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_barang', 'like', "%$search%")
                  ->orWhere('kode_barang', 'like', "%$search%")
                  ->orWhere('nup', 'like', "%$search%")
                  ->orWhere('merek', 'like', "%$search%")
                  ->orWhere('serial_number', 'like', "%$search%")
                  ->orWhere('pengguna', 'like', "%$search%")
                  ->orWhere('ruangan', 'like', "%$search%");
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
            'asset_code' => 'required|string|max:50|unique:assets,asset_code',
            'asset_nup' => 'required|string|max:50|unique:assets,asset_nup',
            'asset_name' => 'required|string|max:255',
            'merk_tipe' => 'nullable|string|max:255',
            'spesifikasi' => 'nullable|string',
            'tahun_perolehan' => 'nullable|integer|min:1900|max:' . date('Y'),
            'tanggal_perolehan' => 'nullable|date',
            'sumber_dana' => 'nullable|in:dipa,pnbp,hibah,lainnya',
            'nomor_bukti_perolehan' => 'nullable|string|max:255',
            'nilai_perolehan' => 'nullable|numeric|min:0',
            'nilai_buku' => 'nullable|numeric|min:0',
            'satuan' => 'nullable|string|max:50',
            'jumlah' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'unit_pengguna' => 'nullable|string|max:255',
            'penanggung_jawab_user_id' => 'nullable|exists:users,id',
            'condition' => 'in:baik,rusak_ringan,rusak_berat',
            'status_penggunaan' => 'in:digunakan,dipinjamkan,idle',
            'is_active' => 'boolean',
            'keterangan' => 'nullable|string',
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
            'asset_code' => 'string|max:50|unique:assets,asset_code,' . $asset->id,
            'asset_nup' => 'string|max:50|unique:assets,asset_nup,' . $asset->id,
            'asset_name' => 'string|max:255',
            'merk_tipe' => 'nullable|string|max:255',
            'spesifikasi' => 'nullable|string',
            'tahun_perolehan' => 'nullable|integer|min:1900|max:' . date('Y'),
            'tanggal_perolehan' => 'nullable|date',
            'sumber_dana' => 'nullable|in:dipa,pnbp,hibah,lainnya',
            'nomor_bukti_perolehan' => 'nullable|string|max:255',
            'nilai_perolehan' => 'nullable|numeric|min:0',
            'nilai_buku' => 'nullable|numeric|min:0',
            'satuan' => 'nullable|string|max:50',
            'jumlah' => 'nullable|integer|min:1',
            'location' => 'nullable|string|max:255',
            'unit_pengguna' => 'nullable|string|max:255',
            'penanggung_jawab_user_id' => 'nullable|exists:users,id',
            'condition' => 'in:baik,rusak_ringan,rusak_berat',
            'status_penggunaan' => 'in:digunakan,dipinjamkan,idle',
            'is_active' => 'boolean',
            'keterangan' => 'nullable|string',
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
        // Accept both old and new parameter names for backward compatibility
        $assetCode = $request->input('asset_code') ?? $request->input('kode_barang');
        $assetNup = $request->input('asset_nup') ?? $request->input('nup');
        
        $validated = validator([
            'asset_code' => $assetCode,
            'asset_nup' => $assetNup,
        ], [
            'asset_code' => 'required|string',
            'asset_nup' => 'required|string',
        ])->validate();

        // Cari asset dengan struktur BMN (kode_barang, nup)
        $asset = Asset::where('kode_barang', $validated['asset_code'])
            ->where('nup', $validated['asset_nup'])
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
            'sumber_dana' => [
                'dipa' => 'DIPA',
                'pnbp' => 'PNBP',
                'hibah' => 'Hibah',
                'lainnya' => 'Lainnya',
            ],
            'status_penggunaan' => [
                'digunakan' => 'Digunakan',
                'dipinjamkan' => 'Dipinjamkan',
                'idle' => 'Idle',
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
                'baik' => 'Baik',
                'rusak_ringan' => 'Rusak Ringan',
                'rusak_berat' => 'Rusak Berat',
            ],
        ]);
    }
}
