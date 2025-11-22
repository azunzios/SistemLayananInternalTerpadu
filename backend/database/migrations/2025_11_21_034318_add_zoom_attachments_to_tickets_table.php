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
        Schema::table('tickets', function (Blueprint $table) {
            // Column already exists in base tickets migration; add only if missing to avoid duplicate error
            if (!Schema::hasColumn('tickets', 'zoom_attachments')) {
                $table->json('zoom_attachments')->nullable()->after('zoom_rejection_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'zoom_attachments')) {
                $table->dropColumn('zoom_attachments');
            }
        });
    }
};
