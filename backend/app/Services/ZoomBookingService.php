<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\ZoomAccount;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ZoomBookingService
{
    /**
     * Validasi dan assign akun zoom otomatis untuk booking baru
     * 
     * @param array $data Data booking (zoom_date, zoom_start_time, zoom_end_time)
     * @param string|null $excludeTicketId ID ticket yang dikecualikan (untuk update)
     * @return array ['success' => bool, 'account_id' => int|null, 'suggested_account_id' => int|null, 'message' => string]
     */
    public function validateAndAssignAccount(array $data, $excludeTicketId = null): array
    {
        // 1. Validasi waktu tidak di masa lalu
        $requestDateTime = Carbon::parse($data['zoom_date'] . ' ' . $data['zoom_start_time']);
        $now = Carbon::now();

        if ($requestDateTime->lessThan($now)) {
            return [
                'success' => false,
                'account_id' => null,
                'suggested_account_id' => null,
                'message' => 'Tidak dapat membuat booking untuk waktu yang sudah lewat.',
            ];
        }

        // 2. Validasi start_time < end_time
        $startMinutes = $this->timeToMinutes($data['zoom_start_time']);
        $endMinutes = $this->timeToMinutes($data['zoom_end_time']);

        if ($startMinutes >= $endMinutes) {
            return [
                'success' => false,
                'account_id' => null,
                'suggested_account_id' => null,
                'message' => 'Waktu mulai harus lebih awal dari waktu selesai.',
            ];
        }

        // 3. Cari akun yang tersedia (prioritas: akun dengan paling sedikit booking)
        $availableAccount = $this->findAvailableAccount(
            $data['zoom_date'],
            $data['zoom_start_time'],
            $data['zoom_end_time'],
            $excludeTicketId
        );

        if (!$availableAccount) {
            return [
                'success' => false,
                'account_id' => null,
                'suggested_account_id' => null,
                'message' => 'Semua akun Zoom sudah terpakai pada waktu tersebut. Silakan pilih waktu lain.',
            ];
        }

        return [
            'success' => true,
            'account_id' => $availableAccount->id,
            'suggested_account_id' => $availableAccount->id,
            'account_name' => $availableAccount->name,
            'message' => "Booking berhasil di-assign ke {$availableAccount->name}.",
        ];
    }

    /**
     * Cari akun zoom yang tersedia untuk waktu tertentu
     * Prioritas: akun dengan paling sedikit booking di hari tersebut
     * 
     * @param string $date Format: Y-m-d
     * @param string $startTime Format: H:i
     * @param string $endTime Format: H:i
     * @param string|null $excludeTicketId Ticket ID yang dikecualikan
     * @return ZoomAccount|null
     */
    public function findAvailableAccount($date, $startTime, $endTime, $excludeTicketId = null): ?ZoomAccount
    {
        // Ambil semua akun aktif
        $accounts = ZoomAccount::active()->get();

        $availableAccounts = [];
        
        foreach ($accounts as $account) {
            if ($account->isAvailableAt($date, $startTime, $endTime, $excludeTicketId)) {
                // Hitung jumlah booking untuk akun ini di hari tersebut
                $bookingCount = Ticket::where('type', 'zoom_meeting')
                    ->where('zoom_account_id', $account->id)
                    ->where('zoom_date', $date)
                    ->whereIn('status', ['approved', 'pending_review'])
                    ->when($excludeTicketId, function ($q) use ($excludeTicketId) {
                        $q->where('id', '!=', $excludeTicketId);
                    })
                    ->count();
                
                $availableAccounts[] = [
                    'account' => $account,
                    'booking_count' => $bookingCount,
                ];
            }
        }

        // Jika ada akun tersedia, pilih yang paling sedikit booking
        if (empty($availableAccounts)) {
            Log::warning("No available zoom account", [
                'date' => $date,
                'time' => "$startTime - $endTime",
                'accounts_checked' => $accounts->count(),
            ]);
            return null;
        }

        // Sort berdasarkan booking count (ascending)
        usort($availableAccounts, function ($a, $b) {
            return $a['booking_count'] <=> $b['booking_count'];
        });

        $selectedAccount = $availableAccounts[0]['account'];

        Log::info("Zoom account assigned", [
            'account_id' => $selectedAccount->id,
            'account_name' => $selectedAccount->name,
            'date' => $date,
            'time' => "$startTime - $endTime",
            'booking_count' => $availableAccounts[0]['booking_count'],
        ]);

        return $selectedAccount;
    }

    /**
     * Cek apakah ada konflik dengan booking yang sudah ada
     * 
     * @param int $accountId Account ID (database id)
     * @param string $date Format: Y-m-d
     * @param string $startTime Format: H:i
     * @param string $endTime Format: H:i
     * @param string|null $excludeTicketId Ticket ID yang dikecualikan
     * @return bool
     */
    public function hasConflict($accountId, $date, $startTime, $endTime, $excludeTicketId = null): bool
    {
        $requestStart = $this->timeToMinutes($startTime);
        $requestEnd = $this->timeToMinutes($endTime);

        $conflicts = Ticket::where('type', 'zoom_meeting')
            ->where('zoom_account_id', $accountId)
            ->where('zoom_date', $date)
            ->whereIn('status', ['approved', 'pending_review'])
            ->when($excludeTicketId, function ($q) use ($excludeTicketId) {
                $q->where('id', '!=', $excludeTicketId);
            })
            ->get();

        foreach ($conflicts as $conflict) {
            $bookedStart = $this->timeToMinutes($conflict->zoom_start_time);
            $bookedEnd = $this->timeToMinutes($conflict->zoom_end_time);

            // Cek overlap: (StartA < EndB) AND (EndA > StartB)
            if ($requestStart < $bookedEnd && $requestEnd > $bookedStart) {
                return true; // Ada konflik
            }
        }

        return false; // Tidak ada konflik
    }

    /**
     * Get list konflik untuk ditampilkan ke user
     * 
     * @param int $accountId Database ID dari zoom account
     * @param string $date
     * @param string $startTime
     * @param string $endTime
     * @param string|null $excludeTicketId
     * @return array
     */
    public function getConflicts($accountId, $date, $startTime, $endTime, $excludeTicketId = null): array
    {
        $requestStart = $this->timeToMinutes($startTime);
        $requestEnd = $this->timeToMinutes($endTime);

        $conflictTickets = Ticket::where('type', 'zoom_meeting')
            ->where('zoom_account_id', $accountId)
            ->where('zoom_date', $date)
            ->whereIn('status', ['approved', 'pending_review'])
            ->when($excludeTicketId, function ($q) use ($excludeTicketId) {
                $q->where('id', '!=', $excludeTicketId);
            })
            ->get();

        $conflicts = [];

        foreach ($conflictTickets as $ticket) {
            $bookedStart = $this->timeToMinutes($ticket->zoom_start_time);
            $bookedEnd = $this->timeToMinutes($ticket->zoom_end_time);

            // Cek overlap
            if ($requestStart < $bookedEnd && $requestEnd > $bookedStart) {
                $conflicts[] = [
                    'ticket_number' => $ticket->ticket_number,
                    'user_name' => $ticket->user?->name ?? 'Unknown',
                    'title' => $ticket->title,
                    'start_time' => $ticket->zoom_start_time,
                    'end_time' => $ticket->zoom_end_time,
                    'status' => $ticket->status,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Konversi waktu HH:mm ke menit
     */
    private function timeToMinutes($time): int
    {
        [$hours, $minutes] = explode(':', $time);
        return ((int) $hours * 60) + (int) $minutes;
    }

    /**
     * Get availability summary untuk semua akun pada tanggal tertentu
     */
    public function getAvailabilitySummary($date): array
    {
        $accounts = ZoomAccount::active()->get();
        $summary = [];

        foreach ($accounts as $account) {
            $bookings = Ticket::where('type', 'zoom_meeting')
                ->where('zoom_account_id', $account->account_id)
                ->where('zoom_date', $date)
                ->whereIn('status', ['approved', 'pending_review', 'menunggu_review', 'pending_approval'])
                ->with('user')
                ->orderBy('zoom_start_time')
                ->get(['id', 'zoom_start_time', 'zoom_end_time', 'title', 'user_id']);

            $summary[] = [
                'account_id' => $account->account_id,
                'account_name' => $account->name,
                'bookings' => $bookings->map(function ($b) {
                    return [
                        'start' => $b->zoom_start_time,
                        'end' => $b->zoom_end_time,
                        'title' => $b->title,
                        'user' => $b->user?->name ?? 'Unknown',
                    ];
                }),
            ];
        }

        return $summary;
    }
}
