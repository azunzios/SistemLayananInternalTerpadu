<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop unnecessary columns from kartu_kendali_entries
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'findings',
                'actions_taken',
                'total_cost',
                'attachments'
            ]);
        });

        // Drop unnecessary columns from kartu_kendali
        Schema::table('kartu_kendali', function (Blueprint $table) {
            $table->dropColumn([
                'asset_description',
                'condition_notes',
                'metadata'
            ]);
        });
    }

    public function down(): void
    {
        // Restore columns if needed
        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
            $table->text('description')->nullable()->after('recorded_by');
            $table->text('findings')->nullable()->after('description');
            $table->text('actions_taken')->nullable()->after('findings');
            $table->decimal('total_cost', 15, 2)->default(0)->after('asset_condition_after');
            $table->json('attachments')->nullable()->after('total_cost');
        });

        Schema::table('kartu_kendali', function (Blueprint $table) {
            $table->text('asset_description')->nullable()->after('asset_merk');
            $table->text('condition_notes')->nullable()->after('condition');
            $table->json('metadata')->nullable()->after('responsible_user_id');
        });
    }
};
