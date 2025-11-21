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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            
            // Recipient
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Notification content
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['info', 'success', 'warning', 'error'])->default('info')->index();
            
            // Context reference (ticket, work order, etc)
            $table->string('reference_type')->nullable(); // 'ticket', 'work_order', 'inventory'
            $table->unsignedBigInteger('reference_id')->nullable();
            
            // Navigation
            $table->string('action_url')->nullable();
            
            // Status
            $table->boolean('is_read')->default(false)->index();
            $table->timestamp('read_at')->nullable();
            
            // Metadata
            $table->json('data')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'is_read', 'created_at']);
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
