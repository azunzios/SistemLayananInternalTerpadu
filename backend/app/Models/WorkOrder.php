<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'ticket_number',
        'type',
        'status',
        'created_by',
        'items',
        'vendor_name',
        'vendor_contact',
        'vendor_description',
        'license_name',
        'license_description',
        'completion_notes',
        'completed_at',
        'failure_reason',
    ];

    protected $casts = [
        'items' => 'array',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the ticket
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the user who created this work order
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the timeline
     */
    public function timeline(): HasMany
    {
        return $this->hasMany(Timeline::class, 'work_order_id')->orderBy('created_at', 'desc');
    }

    /**
     * Scope to get work orders by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get work orders by status
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get valid statuses
     */
    public static function getStatuses()
    {
        return ['requested', 'in_procurement', 'delivered', 'completed', 'failed', 'cancelled'];
    }

    /**
     * Get valid types
     */
    public static function getTypes()
    {
        return ['sparepart', 'vendor', 'license'];
    }

    /**
     * Check if work order can transition to a specific status
     */
    public function canTransitionTo($newStatus)
    {
        $currentStatus = $this->status;

        $allowedTransitions = [
            'requested' => ['in_procurement', 'cancelled'],
            'in_procurement' => ['delivered', 'failed'],
            'delivered' => ['completed', 'failed'],
            'completed' => [],
            'failed' => ['requested'],
            'cancelled' => [],
        ];

        return in_array($newStatus, $allowedTransitions[$currentStatus] ?? []);
    }
}
