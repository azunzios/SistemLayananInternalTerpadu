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
            // Struktur BMN baru
            'kodeSatker' => $this->kode_satker,
            'namaSatker' => $this->nama_satker,
            'kodeBarang' => $this->kode_barang,
            'namaBarang' => $this->nama_barang,
            'nup' => $this->nup,
            'kondisi' => $this->kondisi,
            'merek' => $this->merek,
            'ruangan' => $this->ruangan,
            'serialNumber' => $this->serial_number,
            'pengguna' => $this->pengguna,
            
            // Backward compatibility untuk ticket creation & kartu kendali
            'location' => $this->ruangan, // map ruangan ke location
            'asset_name' => $this->nama_barang, // map nama_barang ke asset_name
            'asset_code' => $this->kode_barang, // map kode_barang ke asset_code
            'asset_nup' => $this->nup, // map nup ke asset_nup untuk kartu kendali
            'condition' => $this->kondisi, // map kondisi ke condition
            'merek' => $this->merek, // include merek untuk merk/tipe display
            'merk_tipe' => $this->merek, // map merek ke merk_tipe untuk kartu kendali
            
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
