<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Tambah kolom rejection_reason untuk menyimpan alasan penolakan
            // berlaku untuk perbaikan & zoom (zoom sudah punya zoom_rejection_reason)
            $table->text('rejection_reason')->nullable()->after('unrepairable_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('rejection_reason');
        });
    }
};
