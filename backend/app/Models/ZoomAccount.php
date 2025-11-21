<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZoomAccount extends Model
{
    protected $fillable = [
        'account_id',
        'name',
        'email',
        'host_key',
        'plan_type',
        'max_participants',
        'description',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_participants' => 'integer',
    ];

    /**
     * Scope untuk akun yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Cek apakah akun tersedia untuk waktu tertentu
     * 
     * @param string $date Format: Y-m-d
     * @param string $startTime Format: H:i
     * @param string $endTime Format: H:i
     * @param string|null $excludeTicketId Ticket ID yang dikecualikan (untuk update)
     * @return bool
     */
    public function isAvailableAt($date, $startTime, $endTime, $excludeTicketId = null)
    {
        if (!$this->is_active) {
            return false;
        }

        // Cari booking yang konflik
        $conflicts = Ticket::where('type', 'zoom_meeting')
            ->where(function ($q) use ($excludeTicketId) {
                $q->where('status', 'approved')
                  ->orWhere('status', 'pending_review')
                  ->orWhere('status', 'menunggu_review')
                  ->orWhere('status', 'pending_approval');
            })
            ->where('zoom_account_id', $this->account_id)
            ->where('zoom_date', $date)
            ->when($excludeTicketId, function ($q) use ($excludeTicketId) {
                $q->where('id', '!=', $excludeTicketId);
            })
            ->get();

        // Konversi waktu ke menit untuk mudah dibandingkan
        $requestStart = $this->timeToMinutes($startTime);
        $requestEnd = $this->timeToMinutes($endTime);

        foreach ($conflicts as $conflict) {
            $bookedStart = $this->timeToMinutes($conflict->zoom_start_time);
            $bookedEnd = $this->timeToMinutes($conflict->zoom_end_time);

            // Cek overlap: (StartA < EndB) AND (EndA > StartB)
            if ($requestStart < $bookedEnd && $requestEnd > $bookedStart) {
                return false; // Ada konflik
            }
        }

        return true; // Tersedia
    }

    /**
     * Konversi waktu HH:mm ke menit
     */
    private function timeToMinutes($time)
    {
        [$hours, $minutes] = explode(':', $time);
        return ((int) $hours * 60) + (int) $minutes;
    }

    /**
     * Get booking statistics untuk akun ini
     */
    public function getBookingStats()
    {
        $bookings = Ticket::where('type', 'zoom_meeting')
            ->where('zoom_account_id', $this->account_id)
            ->get();

        $today = now()->format('Y-m-d');

        return [
            'total' => $bookings->count(),
            'approved' => $bookings->where('status', 'approved')->count(),
            'pending' => $bookings->whereIn('status', ['pending_review', 'menunggu_review', 'pending_approval'])->count(),
            'today' => $bookings->where('zoom_date', $today)->count(),
        ];
    }
}
