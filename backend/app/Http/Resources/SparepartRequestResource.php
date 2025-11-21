<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SparepartRequestResource extends JsonResource
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
            'workOrderId' => $this->work_order_id,
            'workOrder' => new WorkOrderResource($this->whenLoaded('workOrder')),
            'itemName' => $this->item_name,
            'quantityRequested' => $this->quantity_requested,
            'unit' => $this->unit,
            'status' => $this->status,
            'estimatedPrice' => (float) $this->estimated_price,
            'notes' => $this->notes,
            'requestedBy' => $this->requested_by,
            'requester' => new UserResource($this->whenLoaded('requester')),
            'approvedBy' => $this->approved_by,
            'approver' => new UserResource($this->whenLoaded('approver')),
            'approvedAt' => $this->approved_at?->toIso8601String(),
            'rejectionReason' => $this->rejection_reason,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
