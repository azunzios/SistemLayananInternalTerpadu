<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KartuKendaliEntryResource extends JsonResource
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
            'kartuKendaliId' => $this->kartu_kendali_id,
            'ticketId' => $this->ticket_id,
            'workOrderId' => $this->work_order_id,
            'maintenanceDate' => $this->maintenance_date?->format('Y-m-d'),
            'maintenanceType' => $this->maintenance_type,
            'vendorName' => $this->vendor_name,
            'vendorReference' => $this->vendor_reference,
            'spareparts' => $this->spareparts,
            'technicianId' => $this->technician_id,
            'technicianName' => $this->technician_name,
            'technician' => new UserResource($this->whenLoaded('technician')),
            'recordedBy' => $this->recorded_by,
            'recordedByUser' => new UserResource($this->whenLoaded('recordedByUser')),
            'description' => $this->description,
            'findings' => $this->findings,
            'actionsTaken' => $this->actions_taken,
            'assetConditionAfter' => $this->asset_condition_after,
            'totalCost' => $this->total_cost ? (float)$this->total_cost : null,
            'attachments' => $this->attachments,
            'ticket' => new TicketResource($this->whenLoaded('ticket')),
            'workOrder' => new WorkOrderResource($this->whenLoaded('workOrder')),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
