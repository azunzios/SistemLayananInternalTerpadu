<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Notification;
use App\Models\User;

class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $notification;
    public $actionUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, Notification $notification)
    {
        $this->user = $user;
        $this->notification = $notification;
        
        // Build action URL
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        if ($notification->reference_type === 'ticket' && $notification->reference_id) {
            $this->actionUrl = $frontendUrl . '/tickets/' . $notification->reference_id;
        } elseif ($notification->action_url) {
            $this->actionUrl = $frontendUrl . $notification->action_url;
        } else {
            $this->actionUrl = $frontendUrl . '/notifications';
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->notification->title . ' - SIGAP-TI BPS NTB',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.notification',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
