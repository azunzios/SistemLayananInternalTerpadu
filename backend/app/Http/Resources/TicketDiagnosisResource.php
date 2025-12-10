<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketDiagnosisResource extends JsonResource
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
            'ticketId' => $this->ticket_id,
            'technicianId' => $this->technician_id,
            'diagnosedBy' => $this->diagnosed_by,
            'diagnosedAt' => $this->diagnosed_at?->toIso8601String(),
            
            // Teknisi info
            'technician' => $this->whenLoaded('technician', function () {
                return $this->technician ? [
                    'id' => $this->technician->id,
                    'name' => $this->technician->name,
                    'email' => $this->technician->email,
                ] : null;
            }),
            
            // Pemeriksaan awal
            'physicalCondition' => $this->physical_condition,
            'visualInspection' => $this->visual_inspection,
            
            // Identifikasi masalah
            'problemDescription' => $this->problem_description,
            'problemCategory' => $this->problem_category,
            'problemSubcategory' => $this->problem_subcategory,
            
            // Testing
            'testingResult' => $this->testing_result,
            'faultyComponents' => $this->faulty_components ?? [],
            
            // Estimasi perbaikan
            'isRepairable' => $this->is_repairable,
            'repairType' => $this->repair_type,
            'repairDifficulty' => $this->repair_difficulty,
            'estimatedRepairHours' => $this->estimated_repair_hours,
            'repairDescription' => $this->repair_description,
            'estimasiHari' => $this->estimasi_hari,
            
            // Rekomendasi
            'repairRecommendation' => $this->repair_recommendation,
            'requiresSparepart' => $this->requires_sparepart,
            'requiredSpareparts' => $this->required_spareparts ?? [],
            'requiresVendor' => $this->requires_vendor,
            'vendorReason' => $this->vendor_reason,
            
            // Jika tidak dapat diperbaiki
            'unrepairableReason' => $this->unrepairable_reason,
            'alternativeSolution' => $this->alternative_solution,
            'assetConditionChange' => $this->asset_condition_change,
            
            // Prioritas & catatan
            'isUrgent' => $this->is_urgent,
            'technicianNotes' => $this->technician_notes,
            'diagnosisPhotos' => $this->diagnosis_photos ?? [],
            
            // Status
            'status' => $this->status,
            'revisedAt' => $this->revised_at?->toIso8601String(),
            
            // Metadata
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
