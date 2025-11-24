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
        Schema::create('ticket_diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('technician_id')->constrained('users')->onDelete('restrict');
            
            // Identifikasi masalah
            $table->text('problem_description');
            $table->enum('problem_category', ['hardware', 'software', 'lainnya'])->nullable();
            
            // Hasil diagnosis
            $table->enum('repair_type', [
                'direct_repair',           // Bisa diperbaiki langsung
                'need_sparepart',          // Butuh sparepart
                'need_vendor',             // Butuh vendor
                'need_license',            // Butuh lisensi
                'unrepairable'             // Tidak bisa diperbaiki
            ]);
            
            // Jika direct repair
            $table->text('repair_description')->nullable(); // Apa yang diperbaiki
            
            // Jika unrepairable
            $table->text('unrepairable_reason')->nullable();
            $table->text('alternative_solution')->nullable();
            
            // Catatan
            $table->text('technician_notes')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_diagnoses');
    }
};
