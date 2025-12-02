<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;

class TicketNotificationService
{
    // Notifikasi singkat per event

    /**
     * Tiket baru dibuat - notif ke admin_layanan
     */
    public static function onTicketCreated(Ticket $ticket): void
    {
        $admins = User::whereJsonContains('roles', 'admin_layanan')->pluck('id');
        $type = $ticket->type === 'zoom_meeting' ? 'Zoom' : 'Perbaikan';
        
        foreach ($admins as $adminId) {
            Notification::create([
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
            Notification::create([
                'user_id' => $ticket->assigned_to,
                'title' => 'Tugas Baru',
                'message' => "#{$ticket->ticket_number} ditugaskan kepada Anda",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }

        // Notif ke pelapor
        Notification::create([
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
        Notification::create([
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
                Notification::create([
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
        Notification::create([
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
        Notification::create([
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
        Notification::create([
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
            Notification::create([
                'user_id' => $adminId,
                'title' => "Work Order {$label}",
                'message' => "#{$ticket->ticket_number} butuh {$label}",
                'type' => 'info',
                'reference_type' => 'ticket',
                'reference_id' => $ticket->id,
            ]);
        }
    }
}
