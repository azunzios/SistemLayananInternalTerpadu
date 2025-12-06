<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use App\Mail\NotificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TicketNotificationService
{
    /**
     * Helper: Create notification and send email
     */
    private static function createNotificationWithEmail(array $data): Notification
    {
        // Create notification in database
        $notification = Notification::create($data);
        
        // Send email notification
        try {
            $user = User::find($data['user_id']);
            if ($user && $user->email) {
                Mail::to($user->email)->send(new NotificationMail($user, $notification));
            }
        } catch (\Exception $e) {
            // Log error but don't fail the notification creation
            Log::error('Failed to send notification email: ' . $e->getMessage(), [
                'notification_id' => $notification->id,
                'user_id' => $data['user_id'],
            ]);
        }
        
        return $notification;
    }

    // Notifikasi singkat per event

    /**
     * Tiket baru dibuat - notif ke admin_layanan
     */
    public static function onTicketCreated(Ticket $ticket): void
    {
        $admins = User::whereJsonContains('roles', 'admin_layanan')->pluck('id');
        $type = $ticket->type === 'zoom_meeting' ? 'Zoom' : 'Perbaikan';
        
        foreach ($admins as $adminId) {
            self::createNotificationWithEmail([
                'user_id' => $adminId,
                'title' => "Tiket {$type} Baru",
                'message' => "#{$ticket->ticket_number} - {$ticket->title}",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }
    }

    /**
     * Tiket di-assign ke teknisi
     */
    public static function onTicketAssigned(Ticket $ticket): void
    {
        // Notif ke teknisi
        if ($ticket->assigned_to) {
            self::createNotificationWithEmail([
                'user_id' => $ticket->assigned_to,
                'title' => 'Tugas Baru',
                'message' => "#{$ticket->ticket_number} ditugaskan kepada Anda",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }

        // Notif ke pelapor
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Tiket Ditangani',
            'message' => "#{$ticket->ticket_number} sudah ditugaskan ke teknisi",
            'type' => 'info',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);
    }

    /**
     * Status tiket berubah - notif ke pelapor
     */
    public static function onStatusChanged(Ticket $ticket, string $oldStatus, string $newStatus): void
    {
        $statusLabels = [
            'in_progress' => 'sedang dikerjakan',
            'on_hold' => 'ditunda sementara',
            'waiting_for_submitter' => 'menunggu konfirmasi Anda',
            'closed' => 'telah selesai',
            'approved' => 'disetujui',
            'rejected' => 'ditolak',
        ];

        $label = $statusLabels[$newStatus] ?? $newStatus;
        
        // Notif ke pelapor
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Update Tiket',
            'message' => "#{$ticket->ticket_number} {$label}",
            'type' => $newStatus === 'rejected' ? 'error' : ($newStatus === 'closed' ? 'success' : 'info'),
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);

        // Jika on_hold/waiting, notif juga ke admin_penyedia untuk perbaikan
        if ($ticket->type === 'perbaikan' && in_array($newStatus, ['on_hold'])) {
            $admins = User::whereJsonContains('roles', 'admin_penyedia')->pluck('id');
            foreach ($admins as $adminId) {
                self::createNotificationWithEmail([
                    'user_id' => $adminId,
                    'title' => 'Tiket Menunggu',
                    'message' => "#{$ticket->ticket_number} butuh tindak lanjut",
                    'type' => 'warning',
                    'reference_type' => 'ticket',
                    'reference_id' => $ticket->id,
                ]);
            }
        }
    }

    /**
     * Zoom disetujui - notif ke pelapor
     */
    public static function onZoomApproved(Ticket $ticket): void
    {
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Zoom Disetujui',
            'message' => "#{$ticket->ticket_number} meeting siap digunakan",
            'type' => 'success',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);
    }

    /**
     * Zoom ditolak - notif ke pelapor
     */
    public static function onZoomRejected(Ticket $ticket, string $reason): void
    {
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Zoom Ditolak',
            'message' => "#{$ticket->ticket_number}: {$reason}",
            'type' => 'error',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);
    }

    /**
     * Tiket selesai - notif ke pelapor & super_admin
     */
    public static function onTicketClosed(Ticket $ticket): void
    {
        // Notif pelapor
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Tiket Selesai',
            'message' => "#{$ticket->ticket_number} telah diselesaikan",
            'type' => 'success',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);
    }

    /**
     * Work Order dibuat - notif ke admin_penyedia
     */
    public static function onWorkOrderCreated(Ticket $ticket, string $woType): void
    {
        $admins = User::whereJsonContains('roles', 'admin_penyedia')->pluck('id');
        $typeLabels = ['sparepart' => 'Sparepart', 'vendor' => 'Vendor', 'license' => 'Lisensi'];
        $label = $typeLabels[$woType] ?? $woType;

        foreach ($admins as $adminId) {
            self::createNotificationWithEmail([
                'user_id' => $adminId,
                'title' => "Work Order {$label}",
                'message' => "#{$ticket->ticket_number} butuh {$label}",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }
    }

    /**
     * Work Order status changed - notif ke teknisi yang buat WO
     */
    public static function onWorkOrderStatusChanged(Ticket $ticket, int $technicianId, string $oldStatus, string $newStatus): void
    {
        $statusLabels = [
            'requested' => 'Menunggu Proses',
            'in_procurement' => 'Dalam Tahap Pengadaan',
            'completed' => 'Sudah Selesai',
            'unsuccessful' => 'Tidak Berhasil',
        ];

        $oldLabel = $statusLabels[$oldStatus] ?? $oldStatus;
        $newLabel = $statusLabels[$newStatus] ?? $newStatus;

        // Notif ke teknisi yang buat work order
        self::createNotificationWithEmail([
            'user_id' => $technicianId,
            'title' => 'Update Work Order',
            'message' => "#{$ticket->ticket_number}: {$newLabel}",
            'type' => $newStatus === 'completed' ? 'success' : ($newStatus === 'unsuccessful' ? 'error' : 'info'),
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);

        // Jika completed, notif juga ke pelapor
        if ($newStatus === 'completed') {
            self::createNotificationWithEmail([
                'user_id' => $ticket->user_id,
                'title' => 'Pengadaan Selesai',
                'message' => "#{$ticket->ticket_number} pengadaan telah selesai",
                'type' => 'success',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }
    }

    /**
     * Semua Work Orders selesai - notif ke teknisi
     */
    public static function onAllWorkOrdersCompleted(Ticket $ticket, int $technicianId): void
    {
        self::createNotificationWithEmail([
            'user_id' => $technicianId,
            'title' => 'Semua Pengadaan Selesai',
            'message' => "#{$ticket->ticket_number} semua pengadaan telah selesai, siap dilanjutkan",
            'type' => 'success',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);
    }

    /**
     * Diagnosis created/updated - notif ke admin_layanan & pelapor
     */
    public static function onDiagnosisCreated(Ticket $ticket, string $repairType): void
    {
        $repairTypeLabels = [
            'direct_repair' => 'dapat diperbaiki langsung',
            'need_sparepart' => 'membutuhkan sparepart',
            'need_vendor' => 'membutuhkan vendor',
            'need_license' => 'membutuhkan lisensi',
            'unrepairable' => 'tidak dapat diperbaiki',
        ];
        
        $label = $repairTypeLabels[$repairType] ?? $repairType;

        // Notif ke pelapor
        self::createNotificationWithEmail([
            'user_id' => $ticket->user_id,
            'title' => 'Diagnosis Selesai',
            'message' => "#{$ticket->ticket_number}: {$label}",
            'type' => $repairType === 'unrepairable' ? 'warning' : 'info',
            'reference_type' => 'ticket',
            'reference_id' => $ticket->id,
        ]);

        // Notif ke admin_layanan jika butuh pengadaan
        if (in_array($repairType, ['need_sparepart', 'need_vendor', 'need_license'])) {
            $admins = User::whereJsonContains('roles', 'admin_layanan')->pluck('id');
            foreach ($admins as $adminId) {
                self::createNotificationWithEmail([
                    'user_id' => $adminId,
                    'title' => 'Butuh Pengadaan',
                    'message' => "#{$ticket->ticket_number}: {$label}",
                    'type' => 'info',
                    'reference_type' => 'ticket',
                    'reference_id' => $ticket->id,
                ]);
            }
        }
    }

    /**
     * New comment - notif ke pihak terkait
     */
    public static function onCommentCreated(Ticket $ticket, int $commenterId, ?int $parentCommenterId = null): void
    {
        $userIdsToNotify = [];

        // Jika reply, notif ke pembuat comment asli
        if ($parentCommenterId && $parentCommenterId !== $commenterId) {
            $userIdsToNotify[] = $parentCommenterId;
        }

        // Notif ke pelapor (jika bukan dia yang comment)
        if ($ticket->user_id !== $commenterId) {
            $userIdsToNotify[] = $ticket->user_id;
        }

        // Notif ke teknisi yang ditugaskan (jika ada dan bukan dia yang comment)
        if ($ticket->assigned_to && $ticket->assigned_to !== $commenterId) {
            $userIdsToNotify[] = $ticket->assigned_to;
        }

        // Deduplicate
        $userIdsToNotify = array_unique($userIdsToNotify);

        foreach ($userIdsToNotify as $userId) {
            self::createNotificationWithEmail([
                'user_id' => $userId,
                'title' => 'Komentar Baru',
                'message' => "#{$ticket->ticket_number} ada komentar baru",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }
    }
}
