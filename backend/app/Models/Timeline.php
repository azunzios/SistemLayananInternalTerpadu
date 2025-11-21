<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timeline extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'action',
        'details',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
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
     * Get the user who created this timeline entry
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create status change entry
     */
    public static function logStatusChange($ticketId, $userId, $oldStatus, $newStatus)
    {
        return self::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'action' => 'status_changed',
            'details' => "Status changed from '{$oldStatus}' to '{$newStatus}'",
            'metadata' => [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
        ]);
    }

    /**
     * Log assignment
     */
    public static function logAssignment($ticketId, $userId, $assignedToId, $assignedToName)
    {
        return self::create([
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'action' => 'assigned',
            'details' => "Ticket assigned to {$assignedToName}",
            'metadata' => [
                'assigned_to_id' => $assignedToId,
                'assigned_to_name' => $assignedToName,
            ],
        ]);
    }
}
