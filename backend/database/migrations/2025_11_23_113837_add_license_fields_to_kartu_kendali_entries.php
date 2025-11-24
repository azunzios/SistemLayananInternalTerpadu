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
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            // License/software info
            $table->string('license_name')->nullable()->after('vendor_reference');
            $table->text('license_description')->nullable()->after('license_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            $table->dropColumn(['license_name', 'license_description']);
        });
    }
};
