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

class NewUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $plainPassword;
    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $plainPassword)
    {
        $this->user = $user;
        $this->plainPassword = $plainPassword;
        $this->loginUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/login';
    }

    /**
     * Send email using Mailtrap API or SMTP based on config
     */
    public function send($mailer)
    {
        $mailDriver = env('MAIL_DRIVER', 'smtp');
        
        // Use Mailtrap API if driver is 'mailtrap'
        if ($mailDriver === 'mailtrap') {
            $apiToken = env('MAILTRAP_API_TOKEN');
            
            if (!$apiToken) {
                throw new \Exception('MAILTRAP_API_TOKEN not configured');
            }

            // Render email body
            $body = view('emails.new-user', [
                'user' => $this->user,
                'plainPassword' => $this->plainPassword,
                'loginUrl' => $this->loginUrl,
            ])->render();

            // Create Mailtrap email
            $email = (new MailtrapEmail())
                ->from(new Address(
                    env('MAIL_FROM_ADDRESS', 'hello@sigapti.azify.page'),
                    env('MAIL_FROM_NAME', 'SIGAP-TI BPS NTB')
                ))
                ->to(new Address($this->user->email, $this->user->name))
                ->subject('Akun Baru SIGAP-TI BPS NTB')
                ->html($body)
                ->category('New User Registration');

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
            subject: 'Akun Baru SIGAP-TI BPS NTB',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.new-user',
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
