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
        // Skip if tables already exist (already created by comprehensive migration)
        if (Schema::hasTable('kartu_kendali') && Schema::hasTable('kartu_kendali_entries')) {
            return;
        }

        // Tabel utama kartu kendali (1 kartu per aset)
        Schema::create('kartu_kendali', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique(); // Kode barang
            $table->string('asset_nup')->nullable(); // NUP
            $table->string('asset_name'); // Nama barang
            $table->string('asset_merk')->nullable(); // Merek barang
            $table->text('asset_description')->nullable(); // Spesifikasi/deskripsi
            $table->string('condition')->default('baik'); // Kondisi saat ini
            $table->text('condition_notes')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable(); // Data tambahan
            $table->timestamps();
        });

        // Tabel entries kartu kendali (banyak entry per kartu)
        Schema::create('kartu_kendali_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kartu_kendali_id')->constrained('kartu_kendali')->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
            $table->date('maintenance_date'); // Tanggal pemeliharaan
            $table->string('maintenance_type')->default('corrective'); // corrective/preventive
            
            // Info vendor (jika ada)
            $table->string('vendor_name')->nullable();
            $table->string('vendor_reference')->nullable(); // No. referensi vendor
            
            // Sparepart yang digunakan
            $table->json('spareparts')->nullable(); // Array of sparepart items
            
            // Info teknisi
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('technician_name')->nullable();
            
            // Admin penyedia yang mencatat
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            
            // Detail pemeliharaan
            $table->text('description')->nullable(); // Deskripsi pekerjaan
            $table->text('findings')->nullable(); // Temuan saat pemeliharaan
            $table->text('actions_taken')->nullable(); // Tindakan yang dilakukan
            $table->string('asset_condition_after')->nullable(); // Kondisi setelah perbaikan
            
            // Biaya
            $table->decimal('total_cost', 15, 2)->default(0);
            
            // Lampiran/foto
            $table->json('attachments')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kartu_kendali_entries');
        Schema::dropIfExists('kartu_kendali');
    }
};
