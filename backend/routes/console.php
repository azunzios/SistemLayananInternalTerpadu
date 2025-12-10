<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Mailtrap\Helper\ResponseHelper;
use Mailtrap\MailtrapClient;
use Mailtrap\Mime\MailtrapEmail;
use Symfony\Component\Mime\Address;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Test Mailtrap API
Artisan::command('send-test-mail', function () {
    $apiToken = env('MAILTRAP_API_TOKEN');
    
    if (!$apiToken || $apiToken === 'your_mailtrap_api_token_here') {
        $this->error('❌ MAILTRAP_API_TOKEN not configured in .env file');
        $this->info('Please get your API token from: https://mailtrap.io/api-tokens');
        return 1;
    }

    $this->info('📧 Sending test email via Mailtrap API...');

    try {
        $email = (new MailtrapEmail())
            ->from(new Address(
                env('MAIL_FROM_ADDRESS', 'hello@sigapti.azify.page'),
                env('MAIL_FROM_NAME', 'SIGAP-TI BPS NTB')
            ))
            ->to(new Address('test@example.com', 'Test User'))
            ->subject('Test Email - SIGAP-TI')
            ->category('Test')
            ->text('This is a test email from SIGAP-TI system!')
            ->html('<h1>Test Email</h1><p>This is a test email from SIGAP-TI system!</p>');

        $response = MailtrapClient::initSendingEmails(
            apiKey: $apiToken
        )->send($email);

        $this->info('✅ Email sent successfully!');
        $this->line('Response: ' . json_encode(ResponseHelper::toArray($response), JSON_PRETTY_PRINT));
        
        return 0;
    } catch (\Exception $e) {
        $this->error('❌ Failed to send email: ' . $e->getMessage());
        return 1;
    }
})->purpose('Send test email via Mailtrap API');

// Test Reset Password Email
Artisan::command('test-reset-password-email {email}', function ($email) {
    $this->info('📧 Testing Reset Password Email...');
    
    try {
        $user = \App\Models\User::where('email', $email)->first();
        
        if (!$user) {
            $this->error('❌ User not found: ' . $email);
            return 1;
        }
        
        $token = \Illuminate\Support\Str::random(64);
        
        \Illuminate\Support\Facades\Mail::to($user)->send(
            new \App\Mail\ResetPasswordMail($user, $token)
        );
        
        $this->info('✅ Reset password email sent to: ' . $user->email);
        $this->line('Reset URL: ' . env('FRONTEND_URL') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email));
        
        return 0;
    } catch (\Exception $e) {
        $this->error('❌ Failed to send email: ' . $e->getMessage());
        return 1;
    }
})->purpose('Test reset password email');

// Test New User Email
Artisan::command('test-new-user-email {email}', function ($email) {
    $this->info('📧 Testing New User Email...');
    
    try {
        $user = \App\Models\User::where('email', $email)->first();
        
        if (!$user) {
            $this->error('❌ User not found: ' . $email);
            return 1;
        }
        
        $plainPassword = 'TestPassword123!';
        
        \Illuminate\Support\Facades\Mail::to($user)->send(
            new \App\Mail\NewUserMail($user, $plainPassword)
        );
        
        $this->info('✅ New user email sent to: ' . $user->email);
        $this->line('Test Password: ' . $plainPassword);
        
        return 0;
    } catch (\Exception $e) {
        $this->error('❌ Failed to send email: ' . $e->getMessage());
        return 1;
    }
})->purpose('Test new user welcome email');

// Test Notification Email
Artisan::command('test-notification-email {email}', function ($email) {
    $this->info('📧 Testing Notification Email...');
    
    try {
        $user = \App\Models\User::where('email', $email)->first();
        
        if (!$user) {
            $this->error('❌ User not found: ' . $email);
            return 1;
        }
        
        // Create a test notification
        $notification = new \App\Models\Notification();
        $notification->user_id = $user->id;
        $notification->title = 'Test Notification';
        $notification->message = 'This is a test notification from SIGAP-TI system.';
        $notification->type = 'info';
        $notification->is_read = false;
        $notification->save();
        
        \Illuminate\Support\Facades\Mail::to($user)->send(
            new \App\Mail\NotificationMail($user, $notification)
        );
        
        $this->info('✅ Notification email sent to: ' . $user->email);
        $this->line('Notification ID: ' . $notification->id);
        
        // Clean up test notification
        $notification->delete();
        
        return 0;
    } catch (\Exception $e) {
        $this->error('❌ Failed to send email: ' . $e->getMessage());
        return 1;
    }
})->purpose('Test notification email');

