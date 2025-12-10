<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkOrderResource extends JsonResource
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
            'ticket_id' => $this->ticket_id,
            'ticket_number' => $this->ticket_number,
            'ticket' => new TicketResource($this->whenLoaded('ticket')),
            'type' => $this->type,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'created_by_user' => new UserResource($this->whenLoaded('createdBy')),
            'items' => $this->items ?? [],
            'vendor_name' => $this->vendor_name,
            'vendor_contact' => $this->vendor_contact,
            'vendor_description' => $this->vendor_description,
            'license_name' => $this->license_name,
            'license_description' => $this->license_description,
            'completion_notes' => $this->completion_notes,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'failure_reason' => $this->failure_reason,
            'asset_condition_change' => $this->asset_condition_change,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'timeline' => TimelineResource::collection($this->whenLoaded('timeline')),
        ];
    }
}
