<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'asset_code' => $this->asset_code,
            'asset_nup' => $this->asset_nup,
            'asset_name' => $this->asset_name,
            'merk_tipe' => $this->merk_tipe,
            'spesifikasi' => $this->spesifikasi,
            'tahun_perolehan' => $this->tahun_perolehan,
            'tanggal_perolehan' => $this->tanggal_perolehan?->toDateString(),
            'sumber_dana' => $this->sumber_dana,
            'nomor_bukti_perolehan' => $this->nomor_bukti_perolehan,
            'nilai_perolehan' => $this->nilai_perolehan,
            'nilai_buku' => $this->nilai_buku,
            'satuan' => $this->satuan,
            'jumlah' => $this->jumlah,
            'location' => $this->location,
            'unit_pengguna' => $this->unit_pengguna,
            'penanggung_jawab_user_id' => $this->penanggung_jawab_user_id,
            'penanggung_jawab_name' => $this->user?->name,
            'condition' => $this->condition,
            'status_penggunaan' => $this->status_penggunaan,
            'is_active' => $this->is_active,
            'keterangan' => $this->keterangan,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
