<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketDiagnosis extends Model
{
    use HasFactory;

    protected $table = 'ticket_diagnoses';

    protected $fillable = [
        'ticket_id',
        'technician_id',
        'problem_description',
        'problem_category',
        'repair_type',
        'repair_description',
        'unrepairable_reason',
        'alternative_solution',
        'technician_notes',
        'estimasi_hari',
        'asset_condition_change',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the ticket that owns the diagnosis
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the technician who performed the diagnosis
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Check if needs work order (sparepart/vendor/license)
     */
    public function needsWorkOrder(): bool
    {
        return in_array($this->repair_type, ['need_sparepart', 'need_vendor', 'need_license']);
    }

    /**
     * Check if can be repaired directly
     */
    public function canRepairDirectly(): bool
    {
        return $this->repair_type === 'direct_repair';
    }

    /**
     * Check if unrepairable
     */
    public function isUnrepairable(): bool
    {
        return $this->repair_type === 'unrepairable';
    }

    /**
     * Get problem category label
     */
    public function getProblemCategoryLabel(): string
    {
        return match($this->problem_category) {
            'hardware' => 'Hardware',
            'software' => 'Software',
            'lainnya' => 'Lainnya',
            default => $this->problem_category,
        };
    }

    /**
     * Get repair type label
     */
    public function getRepairTypeLabel(): string
    {
        return match($this->repair_type) {
            'direct_repair' => 'Bisa Diperbaiki Langsung',
            'need_sparepart' => 'Butuh Sparepart',
            'need_vendor' => 'Butuh Vendor',
            'need_license' => 'Butuh Lisensi',
            'unrepairable' => 'Tidak Dapat Diperbaiki',
            default => $this->repair_type,
        };
    }
}
