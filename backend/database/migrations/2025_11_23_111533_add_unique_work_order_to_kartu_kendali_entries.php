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
        // First, remove duplicate entries (keep only the oldest one for each work_order_id)
        DB::statement('
            DELETE t1 FROM kartu_kendali_entries t1
            INNER JOIN kartu_kendali_entries t2
            WHERE t1.id > t2.id
            AND t1.work_order_id = t2.work_order_id
        ');

        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // Add unique constraint to prevent duplicate entries for same work order
            $table->unique('work_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // Drop unique constraint
            $table->dropUnique(['work_order_id']);
        });
    }
};
