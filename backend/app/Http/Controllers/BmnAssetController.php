<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Http\Resources\AssetResource;
use App\Models\AuditLog;
use App\Traits\HasRoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BmnAssetController extends Controller
{
    use HasRoleHelper;

    /**
     * Get all assets dengan filtering dan pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = Asset::query();

        // Filter by kondisi
        if ($request->has('kondisi')) {
            $query->where('kondisi', $request->kondisi);
        }

        // Filter by kode satker
        if ($request->has('kode_satker')) {
            $query->where('kode_satker', $request->kode_satker);
        }

        // Search by kode_barang (specific filter)
        if ($request->has('kode_barang') && !empty($request->kode_barang)) {
            $query->where('kode_barang', 'like', "%{$request->kode_barang}%");
        }

        // Search by nup (specific filter)
        if ($request->has('nup') && !empty($request->nup)) {
            $query->where('nup', 'like', "%{$request->nup}%");
        }

        // Search by multiple fields (fallback untuk search umum)
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_barang', 'like', "%$search%")
                  ->orWhere('kode_barang', 'like', "%$search%")
                  ->orWhere('nup', 'like', "%$search%")
                  ->orWhere('merek', 'like', "%$search%")
                  ->orWhere('ruangan', 'like', "%$search%")
                  ->orWhere('pengguna', 'like', "%$search%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $assets = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => AssetResource::collection($assets),
            'meta' => [
                'total' => $assets->total(),
                'per_page' => $assets->perPage(),
                'current_page' => $assets->currentPage(),
                'last_page' => $assets->lastPage(),
            ],
        ]);
    }

    /**
     * Get single asset
     */
    public function show(Asset $asset): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new AssetResource($asset),
        ]);
    }

    /**
     * Create new asset
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only super_admin can create asset
        if (!$this->userHasRole($user, 'super_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can create assets.',
            ], 403);
        }

        $validated = $request->validate([
            'kode_satker' => 'nullable|string|max:50',
            'nama_satker' => 'nullable|string|max:255',
            'kode_barang' => 'required|string|max:50',
            'nama_barang' => 'required|string|max:255',
            'nup' => 'required|string|max:50',
            'kondisi' => 'required|in:Baik,Rusak Ringan,Rusak Berat',
            'merek' => 'nullable|string|max:255',
            'ruangan' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'pengguna' => 'nullable|string|max:255',
        ]);

        // Check duplicate kode_barang + nup
        $exists = Asset::where('kode_barang', $validated['kode_barang'])
            ->where('nup', $validated['nup'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Asset dengan Kode Barang dan NUP tersebut sudah ada.',
            ], 422);
        }

        $asset = Asset::create($validated);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ASSET_CREATED',
            'details' => "Asset BMN created: {$asset->nama_barang} ({$asset->kode_barang} - {$asset->nup})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset berhasil ditambahkan',
            'data' => new AssetResource($asset),
        ], 201);
    }

    /**
     * Update asset
     */
    public function update(Request $request, Asset $asset): JsonResponse
    {
        $user = Auth::user();

        // Only super_admin can update asset
        if (!$this->userHasRole($user, 'super_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can update assets.',
            ], 403);
        }

        $validated = $request->validate([
            'kode_satker' => 'nullable|string|max:50',
            'nama_satker' => 'nullable|string|max:255',
            'kode_barang' => 'string|max:50',
            'nama_barang' => 'string|max:255',
            'nup' => 'string|max:50',
            'kondisi' => 'in:Baik,Rusak Ringan,Rusak Berat',
            'merek' => 'nullable|string|max:255',
            'ruangan' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'pengguna' => 'nullable|string|max:255',
        ]);

        // Check duplicate if kode_barang or nup changed
        if (isset($validated['kode_barang']) || isset($validated['nup'])) {
            $kodeBarang = $validated['kode_barang'] ?? $asset->kode_barang;
            $nup = $validated['nup'] ?? $asset->nup;

            $exists = Asset::where('kode_barang', $kodeBarang)
                ->where('nup', $nup)
                ->where('id', '!=', $asset->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asset dengan Kode Barang dan NUP tersebut sudah ada.',
                ], 422);
            }
        }

        $asset->update($validated);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ASSET_UPDATED',
            'details' => "Asset BMN updated: {$asset->nama_barang} ({$asset->kode_barang} - {$asset->nup})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset berhasil diupdate',
            'data' => new AssetResource($asset),
        ]);
    }

    /**
     * Delete asset
     */
    public function destroy(Asset $asset): JsonResponse
    {
        $user = Auth::user();

        // Only super_admin can delete asset
        if (!$this->userHasRole($user, 'super_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admin can delete assets.',
            ], 403);
        }

        $namaBarang = $asset->nama_barang;
        $kodeBarang = $asset->kode_barang;
        $nup = $asset->nup;

        $asset->delete();

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'ASSET_DELETED',
            'details' => "Asset BMN deleted: {$namaBarang} ({$kodeBarang} - {$nup})",
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset berhasil dihapus',
        ]);
    }

    /**
     * Get asset kondisi options
     */
    public function getKondisiOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'Baik',
                'Rusak Ringan',
                'Rusak Berat',
            ],
        ]);
    }
}
