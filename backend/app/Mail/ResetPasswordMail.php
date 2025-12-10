<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use Mailtrap\MailtrapClient;
use Mailtrap\Mime\MailtrapEmail;
use Symfony\Component\Mime\Address;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;
    public $resetUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
        $this->resetUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
    }

    /**
     * Send email - Override to use Mailtrap API or SMTP
     */
    public function send($mailer)
    {
        $mailDriver = env('MAIL_DRIVER', 'smtp');
        
        // Use Mailtrap API if driver is 'mailtrap'
        if ($mailDriver === 'mailtrap') {
            $apiToken = env('MAILTRAP_API_TOKEN');
            
            if (!$apiToken) {
                throw new \Exception('MAILTRAP_API_TOKEN not configured in .env file');
            }

            // Render email body
            $body = view('emails.reset-password', [
                'user' => $this->user,
                'token' => $this->token,
                'resetUrl' => $this->resetUrl,
            ])->render();

            // Create Mailtrap email
            $email = (new MailtrapEmail())
                ->from(new Address(
                    env('MAIL_FROM_ADDRESS', 'hello@sigapti.azify.page'),
                    env('MAIL_FROM_NAME', 'SIGAP-TI BPS NTB')
                ))
                ->to(new Address($this->user->email, $this->user->name))
                ->subject('Reset Password - SIGAP-TI BPS NTB')
                ->html($body)
                ->category('Password Reset');

            // Send via Mailtrap API
            $client = MailtrapClient::initSendingEmails(apiKey: $apiToken);
            return $client->send($email);
        }
        
        // Use default Laravel SMTP (Gmail or other SMTP)
        return parent::send($mailer);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password - SIGAP-TI BPS NTB',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
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
