<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update tickets dengan status in_repair menjadi in_progress
        DB::table('tickets')
            ->where('status', 'in_repair')
            ->update(['status' => 'in_progress']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: ubah kembali in_progress ke in_repair (jika perlu)
        // Tidak dilakukan karena bisa mengubah data yang memang sudah in_progress
    }
};
