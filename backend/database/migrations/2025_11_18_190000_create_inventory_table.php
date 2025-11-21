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
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('item_name');
            $table->string('item_code')->unique();
            $table->text('description')->nullable();
            $table->string('category'); // e.g., 'spare_parts', 'consumables', 'tools'
            $table->string('unit'); // e.g., 'pcs', 'box', 'unit'
            $table->integer('quantity_on_hand')->default(0);
            $table->integer('quantity_reserved')->default(0); // Reserved for work orders
            $table->integer('reorder_point')->default(5); // Minimum quantity before reorder
            $table->integer('reorder_quantity')->default(10); // Quantity to order
            $table->decimal('unit_price', 15, 2)->default(0); // Price per unit
            $table->decimal('total_value', 15, 2)->default(0); // quantity_on_hand * unit_price
            $table->string('supplier_id')->nullable();
            $table->string('location')->nullable(); // Storage location
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
