<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Alter status enum to include new values
            DB::statement("ALTER TABLE tickets MODIFY COLUMN status ENUM(
                'submitted',
                'assigned',
                'accepted',
                'in_diagnosis',
                'in_repair',
                'in_progress',
                'on_hold',
                'resolved',
                'waiting_for_pegawai',
                'closed',
                'unrepairable',
                'closed_unrepairable',
                'pending_review',
                'approved',
                'rejected',
                'cancelled',
                'completed'
            ) NOT NULL DEFAULT 'submitted'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Revert to original enum values
            DB::statement("ALTER TABLE tickets MODIFY COLUMN status ENUM(
                'submitted',
                'assigned',
                'in_progress',
                'on_hold',
                'resolved',
                'waiting_for_pegawai',
                'closed',
                'closed_unrepairable',
                'pending_review',
                'approved',
                'rejected',
                'cancelled',
                'completed'
            ) NOT NULL DEFAULT 'submitted'");
        });
    }
};
