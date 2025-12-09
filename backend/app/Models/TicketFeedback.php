<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketFeedback extends Model
{
    use HasFactory;

    protected $table = 'ticket_feedbacks';

    protected $fillable = [
        'ticket_id',
        'user_id',
        'rating',
        'feedback_text',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relasi ke Ticket
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    // Relasi ke User (pembuat feedback)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
