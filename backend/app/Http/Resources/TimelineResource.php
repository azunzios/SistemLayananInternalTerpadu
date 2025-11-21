<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimelineResource extends JsonResource
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
            'action' => $this->action,
            'details' => $this->details,
            'actor' => $this->user?->name ?? $this->actor_id ?? 'System',
            'metadata' => $this->metadata,
            'timestamp' => $this->created_at?->toIso8601String(),
        ];
    }
}
