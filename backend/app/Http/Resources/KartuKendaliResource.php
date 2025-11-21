<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KartuKendaliResource extends JsonResource
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
            'assetCode' => $this->asset_code,
            'assetNup' => $this->asset_nup,
            'assetName' => $this->asset_name,
            'assetDescription' => $this->asset_description,
            'condition' => $this->condition,
            'conditionNotes' => $this->condition_notes,
            'location' => $this->location,
            'responsibleUserId' => $this->responsible_user_id,
            'responsibleUser' => new UserResource($this->whenLoaded('responsibleUser')),
            'metadata' => $this->metadata,
            'entries' => KartuKendaliEntryResource::collection($this->whenLoaded('entries')),
            'totalCost' => $this->total_cost ?? 0,
            'maintenanceCount' => $this->maintenance_count ?? 0,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
