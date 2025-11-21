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
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->string('ticket_number')->nullable();
            $table->enum('type', ['sparepart', 'vendor']);
            $table->enum('status', ['requested', 'in_procurement', 'delivered', 'completed', 'failed', 'cancelled'])->default('requested');
            
            // Creator (usually teknisi)
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            
            // Sparepart items (JSON)
            $table->json('items')->nullable(); // [{name, quantity, unit, remarks, estimated_price}, ...]
            
            // Vendor details
            $table->string('vendor_name')->nullable();
            $table->string('vendor_contact')->nullable();
            $table->text('vendor_description')->nullable();
            $table->text('completion_notes')->nullable();
            
            // Delivery info
            $table->integer('received_qty')->nullable();
            $table->text('received_remarks')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->text('failure_reason')->nullable();
            
            $table->timestamps();
        });

        // Add FK from tickets to work_orders
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreign('work_order_id')->references('id')->on('work_orders')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign('tickets_work_order_id_foreign');
        });
        Schema::dropIfExists('work_orders');
    }
};
