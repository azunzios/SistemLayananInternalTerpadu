<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Tambahkan estimasi_hari column ke ticket_diagnoses
    public function up(): void
    {
        Schema::table('ticket_diagnoses', function (Blueprint $table) {
            $table->string('estimasi_hari')->nullable()->after('technician_notes');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_diagnoses', function (Blueprint $table) {
            $table->dropColumn('estimasi_hari');
        });
    }
};
