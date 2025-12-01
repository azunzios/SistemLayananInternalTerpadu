<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop kartu_kendali tables - data redundan dengan work_orders + tickets
     * Kartu Kendali sekarang = view dari work_orders WHERE status = 'completed'
     */
    public function up(): void
    {
        // Drop entries table first (has FK to kartu_kendali)
        Schema::dropIfExists('kartu_kendali_entries');
        
        // Drop main table
        Schema::dropIfExists('kartu_kendali');
    }

    public function down(): void
    {
        // Recreate if needed (simplified version)
        Schema::create('kartu_kendali', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique();
            $table->string('asset_nup')->nullable();
            $table->string('asset_name');
            $table->string('asset_merk')->nullable();
            $table->string('condition')->default('baik');
            $table->string('location')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('kartu_kendali_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kartu_kendali_id')->constrained('kartu_kendali')->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->foreignId('work_order_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->date('maintenance_date');
            $table->string('maintenance_type')->default('corrective');
            $table->json('spareparts')->nullable();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('technician_name')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }
};
