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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventory')->onDelete('cascade');
            $table->enum('movement_type', ['purchase', 'usage', 'adjustment', 'return', 'damage', 'loss']); // Type of movement
            $table->integer('quantity'); // Can be positive or negative
            $table->string('reference_type')->nullable(); // e.g., 'work_order', 'sparepart_request'
            $table->unsignedBigInteger('reference_id')->nullable(); // ID of the reference (work_order_id, etc)
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
