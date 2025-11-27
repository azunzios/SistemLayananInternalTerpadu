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
        // Skip if table doesn't exist (handled by comprehensive setup migration)
        if (!Schema::hasTable('kartu_kendali_entries')) {
            return;
        }

        // First, remove duplicate entries (keep only the oldest one for each work_order_id)
        try {
            DB::statement('
                DELETE t1 FROM kartu_kendali_entries t1
                INNER JOIN kartu_kendali_entries t2
                WHERE t1.id > t2.id
                AND t1.work_order_id = t2.work_order_id
            ');
        } catch (\Exception $e) {
            // Ignore if operation fails (e.g., no duplicates or unique constraint already exists)
            \Log::warning('Could not remove duplicates: ' . $e->getMessage());
        }

        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // Try to add unique constraint - ignore if it already exists
            try {
                $table->unique('work_order_id');
            } catch (\Exception $e) {
                \Log::warning('Unique constraint already exists: ' . $e->getMessage());
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('kartu_kendali_entries')) {
            return;
        }

        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // Drop unique constraint if exists
            if (Schema::hasIndex('kartu_kendali_entries', 'kartu_kendali_entries_work_order_id_unique')) {
                $table->dropUnique(['work_order_id']);
            }
        });
    }
};
