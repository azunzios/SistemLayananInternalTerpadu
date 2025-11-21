<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'reference_type',
        'reference_id',
        'action_url',
        'is_read',
        'read_at',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user this notification belongs to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): self
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
        return $this;
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(): self
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
        return $this;
    }

    /**
     * Scope: unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope: by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: recent
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Static: create notification
     */
    public static function notify(
        string $userId,
        string $title,
        string $message,
        string $type = 'info',
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $actionUrl = null,
        ?array $data = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'action_url' => $actionUrl,
            'data' => $data,
        ]);
    }

    /**
     * Static: notify multiple users
     */
    public static function notifyMultiple(
        array $userIds,
        string $title,
        string $message,
        string $type = 'info',
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $actionUrl = null,
        ?array $data = null
    ): void {
        foreach ($userIds as $userId) {
            self::notify(
                $userId,
                $title,
                $message,
                $type,
                $referenceType,
                $referenceId,
                $actionUrl,
                $data
            );
        }
    }
}
