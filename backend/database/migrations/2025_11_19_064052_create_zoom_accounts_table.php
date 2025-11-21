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
        Schema::create('zoom_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_id')->unique(); // zoom1, zoom2, zoom3
            $table->string('name'); // Akun Zoom 1, Akun Zoom 2, etc.
            $table->string('email')->unique();
            $table->string('host_key', 10);
            $table->string('plan_type')->default('Pro'); // Pro, Business
            $table->integer('max_participants')->default(100);
            $table->text('description')->nullable();
            $table->string('color', 20)->default('blue'); // UI color identifier
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zoom_accounts');
    }
};
