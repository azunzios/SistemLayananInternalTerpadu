<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop unnecessary columns from kartu_kendali_entries if table exists
        if (Schema::hasTable('kartu_kendali_entries')) {
            Schema::table('kartu_kendali_entries', function (Blueprint $table) {
                $columns = [
                    'description',
                    'findings',
                    'actions_taken',
                    'total_cost',
                    'attachments'
                ];
                
                // Only drop columns that exist
                foreach ($columns as $column) {
                    if (Schema::hasColumn('kartu_kendali_entries', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        // Drop unnecessary columns from kartu_kendali if table exists
        if (Schema::hasTable('kartu_kendali')) {
            Schema::table('kartu_kendali', function (Blueprint $table) {
                $columns = [
                    'asset_description',
                    'condition_notes',
                    'metadata'
                ];
                
                // Only drop columns that exist
                foreach ($columns as $column) {
                    if (Schema::hasColumn('kartu_kendali', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        // Restore columns if needed
        if (Schema::hasTable('kartu_kendali_entries')) {
            Schema::table('kartu_kendali_entries', function (Blueprint $table) {
                if (!Schema::hasColumn('kartu_kendali_entries', 'description')) {
                    $table->text('description')->nullable()->after('recorded_by');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'findings')) {
                    $table->text('findings')->nullable()->after('description');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'actions_taken')) {
                    $table->text('actions_taken')->nullable()->after('findings');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'total_cost')) {
                    $table->decimal('total_cost', 15, 2)->default(0)->after('asset_condition_after');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'attachments')) {
                    $table->json('attachments')->nullable()->after('total_cost');
                }
            });
        }

        if (Schema::hasTable('kartu_kendali')) {
            Schema::table('kartu_kendali', function (Blueprint $table) {
                if (!Schema::hasColumn('kartu_kendali', 'asset_description')) {
                    $table->text('asset_description')->nullable()->after('asset_merk');
                }
                if (!Schema::hasColumn('kartu_kendali', 'condition_notes')) {
                    $table->text('condition_notes')->nullable()->after('condition');
                }
                if (!Schema::hasColumn('kartu_kendali', 'metadata')) {
                    $table->json('metadata')->nullable()->after('responsible_user_id');
                }
            });
        }
    }
};
