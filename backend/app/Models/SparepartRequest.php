<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SparepartRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_order_id',
        'item_name',
        'quantity_requested',
        'unit',
        'status',
        'estimated_price',
        'notes',
        'requested_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'estimated_price' => 'decimal:2',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the work order
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    /**
     * Get the user who requested
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who approved
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get valid statuses
     */
    public static function getStatuses()
    {
        return ['pending', 'approved', 'fulfilled', 'rejected'];
    }

    /**
     * Check if request can transition to a specific status
     */
    public function canTransitionTo($newStatus)
    {
        $transitions = [
            'pending' => ['approved', 'rejected'],
            'approved' => ['fulfilled', 'rejected'],
            'fulfilled' => [],
            'rejected' => [],
        ];

        return in_array($newStatus, $transitions[$this->status] ?? []);
    }

    /**
     * Scope to get pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved requests
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get by work order
     */
    public function scopeByWorkOrder($query, $workOrderId)
    {
        return $query->where('work_order_id', $workOrderId);
    }
}
