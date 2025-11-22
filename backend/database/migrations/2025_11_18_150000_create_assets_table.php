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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            // Identitas BMN
            $table->string('asset_code', 50)->unique();      // Kode Barang (15 digit)
            $table->string('asset_nup', 50)->unique();       // NUP
            $table->string('asset_name');                    // Nama Barang
            $table->string('merk_tipe')->nullable();         // Merk/Tipe
            $table->text('spesifikasi')->nullable();         // Spesifikasi/Keterangan teknis

            // Data perolehan
            $table->unsignedSmallInteger('tahun_perolehan')->nullable(); // Tahun perolehan
            $table->date('tanggal_perolehan')->nullable();               // Tanggal perolehan (jika tersedia)
            $table->enum('sumber_dana', ['dipa', 'pnbp', 'hibah', 'lainnya'])->nullable();
            $table->string('nomor_bukti_perolehan')->nullable();         // No BAST/SP2D/dll

            // Nilai
            $table->decimal('nilai_perolehan', 15, 2)->nullable(); // Harga perolehan
            $table->decimal('nilai_buku', 15, 2)->nullable();      // Nilai buku (opsional)

            // Kuantitas
            $table->string('satuan', 50)->default('unit');
            $table->unsignedInteger('jumlah')->default(1);

            // Lokasi & Pengguna
            $table->string('location')->nullable();                    // Lokasi fisik
            $table->string('unit_pengguna')->nullable();               // Unit pengguna
            $table->foreignId('penanggung_jawab_user_id')->nullable()->constrained('users')->onDelete('set null');

            // Kondisi & Status penggunaan
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat'])->default('baik');
            $table->enum('status_penggunaan', ['digunakan', 'dipinjamkan', 'idle'])->default('digunakan');
            $table->boolean('is_active')->default(true);

            // Catatan tambahan
            $table->text('keterangan')->nullable();
            
            $table->timestamps();
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
