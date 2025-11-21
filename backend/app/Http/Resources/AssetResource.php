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
            'description' => $this->description,
            'asset_type' => $this->asset_type,
            'manufacturer' => $this->manufacturer,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'location' => $this->location,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'unit_kerja' => $this->unit_kerja,
            'condition' => $this->condition,
            'is_active' => $this->is_active,
            'acquisition_date' => $this->acquisition_date?->toDateString(),
            'warranty_end_date' => $this->warranty_end_date?->toDateString(),
            'acquisition_cost' => $this->acquisition_cost,
            'current_value' => $this->current_value,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
