<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Notification;
use App\Mail\NotificationMail;

class TestEmailNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:email-notification {email?} {--user-id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email notification system by sending a test notification email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔔 Testing Email Notification System...');
        $this->newLine();

        // Get user
        $user = null;
        if ($this->option('user-id')) {
            $user = User::find($this->option('user-id'));
        } else {
            $user = User::first();
        }

        if (!$user) {
            $this->error('❌ User not found! Please create a user first or specify --user-id');
            return 1;
        }

        // Get email
        $email = $this->argument('email') ?? $user->email;
        
        if (!$email) {
            $this->error('❌ No email address found! Please provide email as argument or ensure user has email.');
            return 1;
        }

        $this->info("📧 Sending test email to: {$email}");
        $this->info("👤 User: {$user->name} (ID: {$user->id})");
        $this->newLine();

        // Create test notification
        try {
            $notification = Notification::create([
                'user_id' => $user->id,
                'title' => '🧪 Test Notifikasi Email',
                'message' => 'Ini adalah test email dari sistem notifikasi SIGAP-TI BPS NTB. Jika Anda menerima email ini, berarti konfigurasi email sudah benar!',
                'type' => 'info',
                'reference_type' => 'test',
                'reference_id' => null,
            ]);

            $this->info('✅ Test notification created in database (ID: ' . $notification->id . ')');
        } catch (\Exception $e) {
            $this->error('❌ Failed to create notification: ' . $e->getMessage());
            return 1;
        }

        // Send email
        try {
            $this->info('📤 Sending email...');
            
            Mail::to($email)->send(new NotificationMail($user, $notification));
            
            $this->newLine();
            $this->info('✅ Email sent successfully!');
            $this->newLine();
            $this->line('📬 Check your inbox at: ' . $email);
            $this->line('💡 Don\'t forget to check spam/junk folder if you don\'t see it.');
            $this->newLine();
            
            // Show mail configuration
            $this->line('📋 Current Mail Configuration:');
            $this->table(
                ['Setting', 'Value'],
                [
                    ['Mailer', config('mail.default')],
                    ['Host', config('mail.mailers.smtp.host')],
                    ['Port', config('mail.mailers.smtp.port')],
                    ['Username', config('mail.mailers.smtp.username')],
                    ['From Address', config('mail.from.address')],
                    ['From Name', config('mail.from.name')],
                ]
            );

            return 0;
        } catch (\Exception $e) {
            $this->newLine();
            $this->error('❌ Failed to send email!');
            $this->error('Error: ' . $e->getMessage());
            $this->newLine();
            
            $this->line('🔍 Troubleshooting tips:');
            $this->line('1. Check your .env file for correct MAIL_* settings');
            $this->line('2. If using Gmail, ensure you\'re using App Password (not regular password)');
            $this->line('3. Run: php artisan config:clear');
            $this->line('4. Check logs: tail -f storage/logs/laravel.log');
            $this->newLine();
            
            return 1;
        }
    }
}

