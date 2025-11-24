<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing zoom tickets yang zoom_duration NULL
        // Hitung duration dari zoom_start_time dan zoom_end_time
        DB::statement("
            UPDATE tickets 
            SET zoom_duration = TIMESTAMPDIFF(MINUTE, zoom_start_time, zoom_end_time)
            WHERE type = 'zoom_meeting' 
            AND zoom_duration IS NULL 
            AND zoom_start_time IS NOT NULL 
            AND zoom_end_time IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu rollback karena ini hanya update data
    }
};
