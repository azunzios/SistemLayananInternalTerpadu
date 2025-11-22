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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique(); // e.g., T-20251118-001
            $table->enum('type', ['perbaikan', 'zoom_meeting']);
            $table->string('title');
            $table->text('description');
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            
            // User who created the ticket (pegawai)
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->string('user_phone')->nullable();
            $table->string('unit_kerja')->nullable();
            
            // Teknisi atau Admin assigned
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            
            // Perbaikan specific fields
            $table->string('asset_code')->nullable();
            $table->string('asset_nup')->nullable();
            $table->string('asset_location')->nullable();
            $table->enum('severity', ['low', 'normal', 'high', 'critical'])->default('normal');
            $table->enum('final_problem_type', ['hardware', 'software', 'lainnya'])->nullable();
            $table->boolean('repairable')->nullable();
            $table->text('unrepairable_reason')->nullable();
            $table->unsignedBigInteger('work_order_id')->nullable(); // Will add FK constraint in WorkOrder migration
            
            // Zoom specific fields
            $table->date('zoom_date')->nullable();
            $table->time('zoom_start_time')->nullable();
            $table->time('zoom_end_time')->nullable();
            $table->integer('zoom_duration')->nullable(); // in minutes
            $table->integer('zoom_estimated_participants')->default(0);
            $table->json('zoom_co_hosts')->nullable(); // [{name, email}, ...]
            $table->integer('zoom_breakout_rooms')->default(0);
            $table->string('zoom_meeting_link')->nullable();
            $table->string('zoom_meeting_id')->nullable();
            $table->string('zoom_passcode')->nullable();
            $table->text('zoom_rejection_reason')->nullable();
            $table->json('zoom_attachments')->nullable(); // File pendukung untuk zoom
            
            // Dynamic form data (JSON)
            $table->json('form_data')->nullable();
            
            // Status
            $table->enum('status', [
                'submitted',           // Tiket baru diajukan
                'assigned',            // Ditugaskan ke teknisi (perbaikan only)
                'in_progress',         // Sedang dikerjakan
                'on_hold',             // Menunggu sparepart/vendor (perbaikan only)
                'resolved',            // Selesai diperbaiki (perbaikan only)
                'waiting_for_pegawai', // Menunggu konfirmasi pegawai
                'closed',              // Selesai & dikonfirmasi
                'closed_unrepairable', // Tidak dapat diperbaiki (perbaikan only)
                'pending_review',      // Menunggu review (zoom only)
                'approved',            // Disetujui (zoom only)
                'rejected',            // Ditolak (zoom & perbaikan)
                'cancelled',           // Dibatalkan (zoom only)
                'completed',           // Acara zoom selesai (zoom only)
            ])->default('submitted');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
