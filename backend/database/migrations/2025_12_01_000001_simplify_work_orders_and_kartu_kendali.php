<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Simplify work_orders and kartu_kendali tables
     * 
     * Work Order status: requested -> in_procurement -> completed/unsuccessful
     * KartuKendaliEntry: simplified fields, maintenance_type only 'corrective'
     */
    public function up(): void
    {
        // 1. Update existing work_orders statuses
        // Map old statuses to new ones
        DB::table('work_orders')->where('status', 'delivered')->update(['status' => 'completed']);
        DB::table('work_orders')->where('status', 'failed')->update(['status' => 'unsuccessful']);
        DB::table('work_orders')->where('status', 'cancelled')->update(['status' => 'unsuccessful']);

        // 2. Modify work_orders table - change enum
        // MySQL workaround: drop and recreate column with new enum
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE work_orders MODIFY COLUMN status ENUM('requested', 'in_procurement', 'completed', 'unsuccessful') DEFAULT 'requested'");
        }

        // 3. Update kartu_kendali_entries - simplify maintenance_type
        // Map old types to 'corrective' (semua dari tiket adalah corrective maintenance)
        DB::table('kartu_kendali_entries')
            ->whereIn('maintenance_type', ['inspection', 'maintenance', 'repair', 'spare_part_replacement', 'upgrade', 'removal'])
            ->update(['maintenance_type' => 'corrective']);

        // 4. Simplify kartu_kendali table - remove unused columns
        Schema::table('kartu_kendali', function (Blueprint $table) {
            // Add columns if not exist
            if (!Schema::hasColumn('kartu_kendali', 'asset_description')) {
                $table->text('asset_description')->nullable()->after('asset_merk');
            }
            if (!Schema::hasColumn('kartu_kendali', 'condition_notes')) {
                $table->text('condition_notes')->nullable()->after('condition');
            }
        });

        // 5. Simplify kartu_kendali_entries - ensure we have description field
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('kartu_kendali_entries', 'description')) {
                $table->text('description')->nullable()->after('spareparts');
            }
        });
    }

    public function down(): void
    {
        // Revert work_orders status enum
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE work_orders MODIFY COLUMN status ENUM('requested', 'in_procurement', 'delivered', 'completed', 'failed', 'cancelled') DEFAULT 'requested'");
        }

        // Map back
        DB::table('work_orders')->where('status', 'unsuccessful')->update(['status' => 'failed']);
    }
};
