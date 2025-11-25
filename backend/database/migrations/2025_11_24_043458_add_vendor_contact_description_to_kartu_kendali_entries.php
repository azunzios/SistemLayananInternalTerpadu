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
            if (!Schema::hasColumn('kartu_kendali_entries', 'vendor_contact')) {
                $table->string('vendor_contact')->nullable()->after('vendor_name');
            }
            if (!Schema::hasColumn('kartu_kendali_entries', 'vendor_description')) {
                $table->text('vendor_description')->nullable()->after('vendor_contact');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            $table->dropColumn(['vendor_contact', 'vendor_description']);
        });
    }
};
