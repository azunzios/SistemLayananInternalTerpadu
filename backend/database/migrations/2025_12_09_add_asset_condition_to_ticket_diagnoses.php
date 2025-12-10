<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Tambah kolom untuk menyimpan perubahan kondisi asset BMN
    public function up(): void
    {
        Schema::table('ticket_diagnoses', function (Blueprint $table) {
            $table->string('asset_condition_change')->nullable()->after('estimasi_hari');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_diagnoses', function (Blueprint $table) {
            $table->dropColumn('asset_condition_change');
        });
    }
};
