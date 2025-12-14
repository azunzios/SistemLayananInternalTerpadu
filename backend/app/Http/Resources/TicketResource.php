<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            
            // User info - fetched from user relationship
            'userId' => $this->user_id,
            'userName' => $this->whenLoaded('user', fn() => $this->user?->name),
            'userEmail' => $this->whenLoaded('user', fn() => $this->user?->email),
            'userPhone' => $this->whenLoaded('user', fn() => $this->user?->phone),
            'unitKerja' => $this->whenLoaded('user', fn() => $this->user?->unit_kerja),
            
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
            'workOrdersReady' => $this->work_orders_ready ?? false,
            'rejectionReason' => $this->rejection_reason, // Alasan penolakan untuk semua tipe tiket
            'timeline' => TimelineResource::collection($this->whenLoaded('timeline')),
            
            // Button status untuk perbaikan
            'buttonStatus' => $this->when(
                $this->type === 'perbaikan',
                $this->getButtonStatus()
            ),
            
            // Comments
            'commentsCount' => $this->whenLoaded('comments', function () {
                return $this->comments->count();
            }),
            
            // Work Orders
            'workOrders' => WorkOrderResource::collection($this->whenLoaded('workOrders')),
            
            // Feedback
            'feedback' => $this->whenLoaded('feedback', function () {
                return $this->feedback ? [
                    'id' => $this->feedback->id,
                    'userId' => $this->feedback->user_id,
                    'userName' => $this->feedback->user?->name,
                    'rating' => $this->feedback->rating,
                    'feedbackText' => $this->feedback->feedback_text,
                    'createdAt' => $this->feedback->created_at?->toIso8601String(),
                ] : null;
            }),
            
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];

        // Add type-specific fields
        if ($this->type === 'perbaikan') {
            $baseData = array_merge($baseData, [
                'assetCode' => $this->kode_barang, // Menggunakan kode_barang dari struktur BMN
                'assetNUP' => $this->nup, // Menggunakan nup dari struktur BMN
                'assetLocation' => $this->asset_location,
                'severity' => $this->severity,
                'finalProblemType' => $this->final_problem_type,
                'repairable' => $this->repairable,
                'unrepairableReason' => $this->unrepairable_reason,
                'workOrderId' => $this->work_order_id,
                'attachments' => $this->transformAttachments($this->attachments ?? []),
                'formData' => $this->form_data,
                'diagnosis' => $this->whenLoaded('diagnosis', function () {
                    return $this->diagnosis ? new TicketDiagnosisResource($this->diagnosis) : null;
                }),
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
                'attachments' => $this->transformAttachments($this->zoom_attachments ?? []),
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

    private function getButtonStatus()
    {
        // Tiket yang sudah rejected atau closed tidak bisa diubah
        $isClosed = in_array($this->status, ['rejected', 'closed']);
        
        $diagnosis = $this->diagnosis;
        
        $hasDiagnosis = $diagnosis !== null;
        $repairType = $diagnosis?->repair_type;
        $needsWorkOrder = in_array($repairType, ['need_sparepart', 'need_vendor', 'need_license']);
        $canBeCompleted = in_array($repairType, ['direct_repair', 'unrepairable']);
        
        // Get work orders
        $workOrders = $this->workOrders ?? [];
        $allWorkOrdersDelivered = count($workOrders) > 0
            ? collect($workOrders)->every(fn($wo) => in_array($wo->status, ['delivered', 'completed', 'failed', 'cancelled']))
            : true;
        
        // Check work_orders_ready flag
        $workOrdersReady = $this->work_orders_ready ?? false;
        
        return [
            'ubahDiagnosis' => [
                'enabled' => !$isClosed,
                'reason' => $isClosed ? 'Tiket sudah ditutup' : null,
            ],
            'workOrder' => [
                'enabled' => !$isClosed && $hasDiagnosis && $needsWorkOrder,
                'reason' => $isClosed ? 'Tiket sudah ditutup' : (!$hasDiagnosis ? 'Diagnosis belum diisi' : (!$needsWorkOrder ? 'Diagnosis tidak memerlukan work order' : null)),
            ],
            'selesaikan' => [
                'enabled' => !$isClosed && $hasDiagnosis && (!$needsWorkOrder || $workOrdersReady),
                'reason' => $isClosed ? 'Tiket sudah ditutup' : (!$hasDiagnosis ? 'Diagnosis belum diisi' : ($needsWorkOrder && !$workOrdersReady ? 'Klik "Lanjutkan Perbaikan" setelah work order selesai' : null)),
            ],
        ];
    }

    /**
     * Transform attachments array to ensure correct URL with proper encoding
     */
    private function transformAttachments(array $attachments): array
    {
        return collect($attachments)->map(function ($attachment) {
            // Regenerate URL from path to ensure correct APP_URL and proper encoding
            if (isset($attachment['path'])) {
                // Split path into directory and filename
                $pathParts = explode('/', $attachment['path']);
                $filename = array_pop($pathParts);
                $directory = implode('/', $pathParts);
                
                // Encode filename to handle spaces and special characters
                $encodedFilename = rawurlencode($filename);
                $encodedPath = $directory ? $directory . '/' . $encodedFilename : $encodedFilename;
                
                $attachment['url'] = config('app.url') . '/storage/' . $encodedPath;
            }
            return $attachment;
        })->toArray();
    }
}
