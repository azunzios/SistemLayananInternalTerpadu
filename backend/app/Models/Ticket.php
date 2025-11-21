<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'type',
        'title',
        'description',
        'category_id',
        'user_id',
        'user_name',
        'user_email',
        'user_phone',
        'unit_kerja',
        'assigned_to',
        'asset_code',
        'asset_nup',
        'asset_location',
        'severity',
        'final_problem_type',
        'repairable',
        'unrepairable_reason',
        'work_order_id',
        'zoom_date',
        'zoom_start_time',
        'zoom_end_time',
        'zoom_duration',
        'zoom_estimated_participants',
        'zoom_co_hosts',
        'zoom_breakout_rooms',
        'zoom_meeting_link',
        'zoom_meeting_id',
        'zoom_passcode',
        'zoom_rejection_reason',
        'zoom_account_id', // Reference to zoom_accounts.id
        'zoom_attachments', // File pendukung zoom
        'form_data',
        'status',
    ];

    protected $casts = [
        'zoom_co_hosts' => 'array',
        'zoom_attachments' => 'array',
        'form_data' => 'array',
        'repairable' => 'boolean',
        'zoom_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created the ticket
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user assigned to this ticket
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the timeline events
     */
    public function timeline(): HasMany
    {
        return $this->hasMany(Timeline::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get the work order
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    /**
     * Get the zoom account (for zoom_meeting tickets)
     */
    public function zoomAccount(): BelongsTo
    {
        return $this->belongsTo(ZoomAccount::class, 'zoom_account_id', 'id');
    }

    /**
     * Get the asset (for perbaikan tickets)
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_code', 'asset_code');
    }

    /**
     * Get the comments on this ticket
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderBy('created_at', 'desc');
    }

    /**
     * Generate unique ticket number
     */
    public static function generateTicketNumber($type = 'perbaikan')
    {
        $prefix = $type === 'zoom_meeting' ? 'Z' : 'T';
        $date = now()->format('Ymd');
        $latestTicket = self::where('ticket_number', 'like', "$prefix-$date-%")
            ->latest('id')
            ->first();

        $sequence = 1;
        if ($latestTicket) {
            $parts = explode('-', $latestTicket->ticket_number);
            $sequence = (int) end($parts) + 1;
        }

        return sprintf('%s-%s-%03d', $prefix, $date, $sequence);
    }

    /**
     * Scope to get tickets by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get tickets by status
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get tickets created by user
     */
    public function scopeCreatedBy($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get tickets assigned to user
     */
    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Get valid statuses for perbaikan type
     */
    public static function getPerbaikanStatuses()
    {
        return [
            'submitted',
            'assigned',
            'in_progress',
            'on_hold',
            'resolved',
            'waiting_for_pegawai',
            'closed',
            'closed_unrepairable',
        ];
    }

    /**
     * Get valid statuses for zoom type
     */
    public static function getZoomStatuses()
    {
        return [
            'pending_review',
            'approved',
            'rejected',
            'cancelled',
            'completed',
        ];
    }

    /**
     * Check if ticket can transition to a specific status
     */
    public function canTransitionTo($newStatus)
    {
        $currentStatus = $this->status;
        
        // Define allowed transitions
        $allowedTransitions = [
            'submitted' => ['assigned', 'rejected'],
            'assigned' => ['in_progress', 'on_hold'],
            'in_progress' => ['resolved', 'on_hold'],
            'on_hold' => ['in_progress'],
            'resolved' => ['waiting_for_pegawai'],
            'waiting_for_pegawai' => ['closed', 'in_progress'],
            'pending_review' => ['approved', 'rejected'],
            'approved' => ['completed', 'cancelled'],
            'rejected' => ['cancelled'],
            'cancelled' => [],
            'closed' => [],
            'closed_unrepairable' => [],
        ];

        return in_array($newStatus, $allowedTransitions[$currentStatus] ?? []);
    }
}
