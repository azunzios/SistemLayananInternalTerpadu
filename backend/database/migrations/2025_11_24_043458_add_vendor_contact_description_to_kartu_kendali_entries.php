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
            $table->string('vendor_contact')->nullable()->after('vendor_name');
            $table->text('vendor_description')->nullable()->after('vendor_contact');
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
