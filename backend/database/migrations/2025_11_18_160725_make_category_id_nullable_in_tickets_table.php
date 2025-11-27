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
        // Skip if category_id column doesn't exist (dropped in normalize_database_schema migration)
        if (!Schema::hasColumn('tickets', 'category_id')) {
            return;
        }

        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip if category_id column doesn't exist or will be dropped by later migration
        if (!Schema::hasColumn('tickets', 'category_id')) {
            return;
        }

        try {
            Schema::table('tickets', function (Blueprint $table) {
                // Only change if there's no null data that would violate NOT NULL constraint
                $table->unsignedBigInteger('category_id')->nullable(false)->change();
            });
        } catch (\Exception $e) {
            // Ignore errors during rollback - this column will be removed by normalize_database_schema
            \Log::warning('Could not modify category_id during rollback: ' . $e->getMessage());
        }
    }
};
