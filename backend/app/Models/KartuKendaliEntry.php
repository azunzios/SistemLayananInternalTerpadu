<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KartuKendaliEntry extends Model
{
    protected $table = 'kartu_kendali_entries';

    protected $fillable = [
        'kartu_kendali_id',
        'ticket_id',
        'work_order_id',
        'maintenance_date',
        'maintenance_type',
        'vendor_name',
        'vendor_reference',
        'vendor_contact',
        'vendor_description',
        'license_name',
        'license_description',
        'spareparts',
        'technician_id',
        'technician_name',
        'recorded_by',
        'asset_condition_after',
    ];

    protected $casts = [
        'spareparts' => 'array',
        'maintenance_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the Kartu Kendali this entry belongs to
     */
    public function kartuKendali(): BelongsTo
    {
        return $this->belongsTo(KartuKendali::class);
    }

    /**
     * Get associated ticket
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get associated work order
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    /**
     * Get technician who performed maintenance
     */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /**
     * Get admin who recorded this entry
     */
    public function recordedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Scope: get by maintenance type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('maintenance_type', $type);
    }

    /**
     * Scope: get recent entries
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('maintenance_date', '>=', now()->subDays($days));
    }

    /**
     * Scope: get by technician
     */
    public function scopeByTechnician($query, $technicianId)
    {
        return $query->where('technician_id', $technicianId);
    }

    /**
     * Static method to create entry from work order
     */
    public static function createFromWorkOrder(WorkOrder $workOrder, User $technician, array $data)
    {
        $kartuKendaliId = self::findOrCreateKartuKendali($workOrder)->id;

        return self::create([
            'kartu_kendali_id' => $kartuKendaliId,
            'ticket_id' => $workOrder->ticket_id,
            'work_order_id' => $workOrder->id,
            'maintenance_date' => $data['maintenance_date'] ?? now()->date(),
            'maintenance_type' => $data['maintenance_type'] ?? 'repair',
            'vendor_name' => $data['vendor_name'] ?? null,
            'vendor_reference' => $data['vendor_reference'] ?? null,
            'spareparts' => $data['spareparts'] ?? [],
            'technician_id' => $technician->id,
            'technician_name' => $technician->name,
            'recorded_by' => auth()->id(),
            'asset_condition_after' => $data['asset_condition_after'] ?? 'baik',
        ]);
    }

    /**
     * Find or create Kartu Kendali for an asset from ticket
     */
    private static function findOrCreateKartuKendali(WorkOrder $workOrder): KartuKendali
    {
        $ticket = $workOrder->ticket;
        
        // Get asset info from ticket data
        $assetCode = $ticket->data['assetCode'] ?? null;
        $assetNup = $ticket->data['assetNUP'] ?? null;
        
        if (!$assetCode || !$assetNup) {
            throw new \Exception('Asset code and NUP required for Kartu Kendali');
        }

        return KartuKendali::firstOrCreate(
            ['asset_code' => $assetCode],
            [
                'asset_nup' => $assetNup,
                'asset_name' => $ticket->data['assetName'] ?? 'Unknown',
                'condition' => 'baik',
            ]
        );
    }
}
