<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\Timeline;
use App\Models\Comment;
use App\Models\WorkOrder;
use App\Models\TicketDiagnosis;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class ClearAllTickets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:clear {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all tickets and related data (for testing purposes)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('⚠️  WARNING: This will delete ALL tickets and related data!');
        $this->newLine();

        // Show statistics
        $ticketCount = Ticket::count();
        $timelineCount = Timeline::count();
        $commentCount = Comment::count();
        $workOrderCount = WorkOrder::count();
        $diagnosisCount = TicketDiagnosis::count();
        $notificationCount = Notification::where('reference_type', 'ticket')->count();

        $this->info('Current data:');
        $this->table(
            ['Type', 'Count'],
            [
                ['Tickets', $ticketCount],
                ['Timeline Events', $timelineCount],
                ['Comments', $commentCount],
                ['Work Orders', $workOrderCount],
                ['Diagnoses', $diagnosisCount],
                ['Notifications (ticket-related)', $notificationCount],
            ]
        );
        $this->newLine();

        if ($ticketCount === 0) {
            $this->info('✅ No tickets found. Database is already clean!');
            return 0;
        }

        // Confirm deletion
        if (!$this->option('force')) {
            if (!$this->confirm('Are you sure you want to delete ALL tickets?', false)) {
                $this->info('Cancelled. No data was deleted.');
                return 0;
            }
        }

        $this->info('🗑️  Starting deletion process...');
        $this->newLine();

        try {
            DB::beginTransaction();

            // Delete in correct order to respect foreign key constraints
            
            // 1. Delete comments (including replies)
            $this->info('Deleting comments...');
            $deletedComments = Comment::whereNotNull('ticket_id')->delete();
            $this->line("  ✓ Deleted {$deletedComments} comments");

            // 2. Delete work orders
            $this->info('Deleting work orders...');
            $deletedWorkOrders = WorkOrder::delete();
            $this->line("  ✓ Deleted {$deletedWorkOrders} work orders");

            // 3. Delete diagnoses
            $this->info('Deleting diagnoses...');
            $deletedDiagnoses = TicketDiagnosis::delete();
            $this->line("  ✓ Deleted {$deletedDiagnoses} diagnoses");

            // 4. Delete timeline events
            $this->info('Deleting timeline events...');
            $deletedTimeline = Timeline::delete();
            $this->line("  ✓ Deleted {$deletedTimeline} timeline events");

            // 5. Delete ticket-related notifications
            $this->info('Deleting ticket notifications...');
            $deletedNotifications = Notification::where('reference_type', 'ticket')->delete();
            $this->line("  ✓ Deleted {$deletedNotifications} notifications");

            // 6. Delete audit logs related to tickets (optional)
            $this->info('Deleting ticket audit logs...');
            $deletedAuditLogs = AuditLog::where('auditable_type', 'App\Models\Ticket')->delete();
            $this->line("  ✓ Deleted {$deletedAuditLogs} audit logs");

            // 7. Finally, delete tickets
            $this->info('Deleting tickets...');
            $deletedTickets = Ticket::delete();
            $this->line("  ✓ Deleted {$deletedTickets} tickets");

            DB::commit();

            $this->newLine();
            $this->info('✅ All tickets and related data have been successfully deleted!');
            $this->newLine();

            // Show summary
            $this->info('Summary:');
            $this->table(
                ['Type', 'Deleted'],
                [
                    ['Tickets', $deletedTickets],
                    ['Timeline Events', $deletedTimeline],
                    ['Comments', $deletedComments],
                    ['Work Orders', $deletedWorkOrders],
                    ['Diagnoses', $deletedDiagnoses],
                    ['Notifications', $deletedNotifications],
                    ['Audit Logs', $deletedAuditLogs],
                    ['TOTAL', $deletedTickets + $deletedTimeline + $deletedComments + $deletedWorkOrders + $deletedDiagnoses + $deletedNotifications + $deletedAuditLogs],
                ]
            );

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error occurred during deletion!');
            $this->error('Error: ' . $e->getMessage());
            $this->newLine();
            $this->warn('No data was deleted. Database rolled back to previous state.');
            return 1;
        }
    }
}
