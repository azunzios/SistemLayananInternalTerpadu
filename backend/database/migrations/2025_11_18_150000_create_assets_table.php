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
            $table->string('asset_code')->unique(); // Kode Barang, e.g., "KB-2024-001"
            $table->string('asset_nup')->unique();   // NUP (Nomor Urut Pendaftaran), e.g., "000001"
            $table->string('asset_name');             // Nama barang, e.g., "Laptop Dell"
            $table->text('description')->nullable();  // Deskripsi detail
            
            // Asset info
            $table->string('asset_type')->nullable();     // Tipe aset, e.g., "Elektronik", "Furniture"
            $table->string('manufacturer')->nullable();   // Pabrikan
            $table->string('model')->nullable();          // Model
            $table->string('serial_number')->nullable();  // Nomor seri
            
            // Lokasi & Pengguna
            $table->string('location')->nullable();       // Lokasi saat ini
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Pengguna pemegang
            $table->string('unit_kerja')->nullable();     // Unit kerja pengguna
            
            // Kondisi & Status
            $table->enum('condition', ['baru', 'baik', 'kurang_baik', 'rusak'])->default('baik');
            $table->boolean('is_active')->default(true);
            
            // Tanggal
            $table->date('acquisition_date')->nullable(); // Tanggal perolehan
            $table->date('warranty_end_date')->nullable(); // Tanggal akhir garansi
            
            // Nilai
            $table->decimal('acquisition_cost', 15, 2)->nullable(); // Biaya perolehan
            $table->decimal('current_value', 15, 2)->nullable();    // Nilai sekarang
            
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
