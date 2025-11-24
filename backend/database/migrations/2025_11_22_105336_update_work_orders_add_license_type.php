<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            // Update type enum to include license
            DB::statement("ALTER TABLE work_orders MODIFY COLUMN type ENUM('sparepart', 'vendor', 'license') NOT NULL");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            DB::statement("ALTER TABLE work_orders MODIFY COLUMN type ENUM('sparepart', 'vendor') NOT NULL");
        });
    }
};
