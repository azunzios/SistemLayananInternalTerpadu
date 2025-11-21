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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['perbaikan', 'zoom_meeting']);
            $table->text('description')->nullable();
            $table->json('assigned_roles')->nullable(); // Roles yang menangani kategori ini
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('category_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('name');
            $table->string('label');
            $table->enum('type', ['text', 'textarea', 'number', 'select', 'file', 'date', 'email', 'checkbox', 'radio']);
            $table->boolean('required')->default(false);
            $table->json('options')->nullable(); // For select, radio, checkbox types
            $table->text('help_text')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_fields');
        Schema::dropIfExists('categories');
    }
};
