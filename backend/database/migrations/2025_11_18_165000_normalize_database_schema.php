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
        // First, modify tickets table - remove foreign key and columns before dropping categories
        Schema::table('tickets', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['category_id']);
            
            // Drop columns
            $table->dropColumn([
                'category_id',
                'user_name',
                'user_email',
                'user_phone',
                'unit_kerja',
            ]);
        });

        // Drop category_fields table
        Schema::dropIfExists('category_fields');

        // Drop categories table
        Schema::dropIfExists('categories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore tickets table columns
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('category_id')->nullable()->after('description');
            $table->string('user_name')->nullable()->after('user_id');
            $table->string('user_email')->nullable()->after('user_name');
            $table->string('user_phone')->nullable()->after('user_email');
            $table->string('unit_kerja')->nullable()->after('user_phone');
        });

        // Recreate categories table (basic structure)
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Recreate category_fields table (basic structure)
        Schema::create('category_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('field_name');
            $table->string('field_type');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }
};
