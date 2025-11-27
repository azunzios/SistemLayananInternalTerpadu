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
        // Skip if table doesn't exist or columns already added
        if (!Schema::hasTable('kartu_kendali_entries')) {
            return;
        }

        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // License/software info
            if (!Schema::hasColumn('kartu_kendali_entries', 'license_name')) {
                $table->string('license_name')->nullable()->after('vendor_reference');
            }
            if (!Schema::hasColumn('kartu_kendali_entries', 'license_description')) {
                $table->text('license_description')->nullable()->after('license_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('kartu_kendali_entries')) {
            return;
        }

        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('kartu_kendali_entries', 'license_name')) {
                $columns[] = 'license_name';
            }
            if (Schema::hasColumn('kartu_kendali_entries', 'license_description')) {
                $columns[] = 'license_description';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
