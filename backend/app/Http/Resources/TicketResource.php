<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $baseData = [
            'id' => $this->id,
            'ticketNumber' => $this->ticket_number,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'categoryId' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'type' => $this->category->type,
                ] : null;
            }),
            
            // User info
            'userId' => $this->user_id,
            'userName' => $this->user_name,
            'userEmail' => $this->user_email,
            'userPhone' => $this->user_phone,
            'unitKerja' => $this->unit_kerja,
            
            // Assignment
            'assignedTo' => $this->assigned_to,
            'assignedUser' => $this->whenLoaded('assignedUser', function () {
                return $this->assignedUser ? [
                    'id' => $this->assignedUser->id,
                    'name' => $this->assignedUser->name,
                    'email' => $this->assignedUser->email,
                ] : null;
            }),
            
            // Status & Timeline
            'status' => $this->status,
            'timeline' => TimelineResource::collection($this->whenLoaded('timeline')),
            
            // Comments
            'commentsCount' => $this->whenLoaded('comments', function () {
                return $this->comments->count();
            }),
            
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];

        // Add type-specific fields
        if ($this->type === 'perbaikan') {
            $baseData = array_merge($baseData, [
                'assetCode' => $this->asset_code,
                'assetNUP' => $this->asset_nup,
                'assetLocation' => $this->asset_location,
                'severity' => $this->severity,
                'finalProblemType' => $this->final_problem_type,
                'repairable' => $this->repairable,
                'unrepairableReason' => $this->unrepairable_reason,
                'workOrderId' => $this->work_order_id,
                'attachments' => $this->attachments ?? [],
                'formData' => $this->form_data,
            ]);
        } else if ($this->type === 'zoom_meeting') {
            $baseData = array_merge($baseData, [
                'date' => $this->zoom_date?->format('Y-m-d'),
                'startTime' => $this->zoom_start_time,
                'endTime' => $this->zoom_end_time,
                'duration' => $this->zoom_duration,
                'estimatedParticipants' => $this->zoom_estimated_participants,
                'coHosts' => $this->zoom_co_hosts ?? [],
                'breakoutRooms' => $this->zoom_breakout_rooms,
                'meetingLink' => $this->zoom_meeting_link,
                'meetingId' => $this->zoom_meeting_id,
                'passcode' => $this->zoom_passcode,
                'rejectionReason' => $this->zoom_rejection_reason,
                'attachments' => $this->zoom_attachments ?? [],
                'zoomAccountId' => $this->zoom_account_id,
                'zoomAccount' => $this->whenLoaded('zoomAccount', function () {
                    return $this->zoomAccount ? [
                        'id' => $this->zoomAccount->id,
                        'accountId' => $this->zoomAccount->account_id,
                        'name' => $this->zoomAccount->name,
                        'email' => $this->zoomAccount->email,
                        'hostKey' => $this->zoomAccount->host_key,
                        'color' => $this->zoomAccount->color,
                    ] : null;
                }),
            ]);
        }

        return $baseData;
    }
}
