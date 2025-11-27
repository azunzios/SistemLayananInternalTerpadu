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
        // Drop old assets table
        Schema::dropIfExists('assets');

        // Create new assets table sesuai struktur BMN
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('kode_satker')->nullable(); // Kode Satker
            $table->string('nama_satker')->nullable(); // Nama Satker
            $table->string('kode_barang'); // Kode Barang - required
            $table->string('nama_barang'); // Nama Barang - required
            $table->string('nup'); // NUP - required
            $table->string('kondisi')->default('Baik'); // Kondisi (Baik/Rusak Ringan/Rusak Berat)
            $table->string('merek')->nullable(); // Merek - nullable
            $table->string('ruangan')->nullable(); // Ruangan - nullable
            $table->string('serial_number')->nullable(); // Serial Number - nullable
            $table->string('pengguna')->nullable(); // Pengguna - nullable
            $table->timestamps();

            // Indexes untuk pencarian cepat
            $table->index('kode_barang');
            $table->index('nup');
            $table->index(['kode_barang', 'nup']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
