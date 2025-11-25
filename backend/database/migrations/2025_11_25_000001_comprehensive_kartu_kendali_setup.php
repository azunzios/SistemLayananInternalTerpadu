<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Comprehensive setup untuk kartu_kendali tables
     * - Handles table creation if not exists
     * - Safely adds/drops columns
     * - Manages unique constraints
     * - Cleans up duplicate data
     */
    public function up(): void
    {
        // 1. Ensure kartu_kendali table exists with all needed columns
        if (!Schema::hasTable('kartu_kendali')) {
            Schema::create('kartu_kendali', function (Blueprint $table) {
                $table->id();
                $table->string('asset_code')->unique();
                $table->string('asset_nup')->nullable();
                $table->string('asset_name');
                $table->string('asset_merk')->nullable();
                $table->string('condition')->default('baik');
                $table->string('location')->nullable();
                $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // 2. Ensure kartu_kendali_entries table exists with all needed columns
        if (!Schema::hasTable('kartu_kendali_entries')) {
            Schema::create('kartu_kendali_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kartu_kendali_id')->constrained('kartu_kendali')->cascadeOnDelete();
                $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
                $table->foreignId('work_order_id')->constrained('work_orders')->cascadeOnDelete();
                $table->date('maintenance_date');
                $table->string('maintenance_type')->default('corrective');
                
                $table->string('vendor_name')->nullable();
                $table->string('vendor_reference')->nullable();
                $table->string('license_name')->nullable();
                $table->text('license_description')->nullable();
                $table->string('vendor_contact')->nullable();
                $table->text('vendor_description')->nullable();
                
                $table->json('spareparts')->nullable();
                
                $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('technician_name')->nullable();
                
                $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
                
                $table->string('asset_condition_after')->nullable();
                
                $table->timestamps();
            });
        } else {
            // Table exists, ensure it has necessary columns
            Schema::table('kartu_kendali_entries', function (Blueprint $table) {
                // Add license fields if not exist
                if (!Schema::hasColumn('kartu_kendali_entries', 'license_name')) {
                    $table->string('license_name')->nullable()->after('vendor_reference');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'license_description')) {
                    $table->text('license_description')->nullable()->after('license_name');
                }
                
                // Add vendor contact fields if not exist
                if (!Schema::hasColumn('kartu_kendali_entries', 'vendor_contact')) {
                    $table->string('vendor_contact')->nullable()->after('vendor_name');
                }
                if (!Schema::hasColumn('kartu_kendali_entries', 'vendor_description')) {
                    $table->text('vendor_description')->nullable()->after('vendor_contact');
                }
            });

            // 3. Remove duplicates for work_order_id if table exists and has data
            if (Schema::hasColumn('kartu_kendali_entries', 'work_order_id')) {
                try {
                    DB::statement('
                        DELETE t1 FROM kartu_kendali_entries t1
                        INNER JOIN kartu_kendali_entries t2
                        WHERE t1.id > t2.id
                        AND t1.work_order_id = t2.work_order_id
                    ');
                } catch (\Exception $e) {
                    // Silently ignore if delete fails (e.g., no duplicates)
                    \Log::warning('Could not remove duplicates from kartu_kendali_entries: ' . $e->getMessage());
                }
            }

            // 4. Add unique constraint to work_order_id if not exists
            if (Schema::hasColumn('kartu_kendali_entries', 'work_order_id')) {
                try {
                    // Check if unique constraint already exists
                    $indexes = DB::select("SHOW INDEXES FROM kartu_kendali_entries WHERE Column_name = 'work_order_id' AND Seq_in_index = 1");
                    $hasUnique = false;
                    foreach ($indexes as $index) {
                        if ($index->Non_unique === 0) {
                            $hasUnique = true;
                            break;
                        }
                    }
                    
                    if (!$hasUnique) {
                        Schema::table('kartu_kendali_entries', function (Blueprint $table) {
                            $table->unique('work_order_id');
                        });
                    }
                } catch (\Exception $e) {
                    \Log::warning('Could not add unique constraint to work_order_id: ' . $e->getMessage());
                }
            }

            // 5. Drop unnecessary columns if they exist
            Schema::table('kartu_kendali_entries', function (Blueprint $table) {
                $columnsToRemove = ['description', 'findings', 'actions_taken', 'total_cost', 'attachments'];
                
                foreach ($columnsToRemove as $column) {
                    if (Schema::hasColumn('kartu_kendali_entries', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        // 6. Clean up kartu_kendali table
        if (Schema::hasTable('kartu_kendali')) {
            Schema::table('kartu_kendali', function (Blueprint $table) {
                $columnsToRemove = ['asset_description', 'condition_notes', 'metadata'];
                
                foreach ($columnsToRemove as $column) {
                    if (Schema::hasColumn('kartu_kendali', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a comprehensive setup migration, reversing it would drop entire tables
        // So we just log that this migration cannot be simply reversed
        \Log::warning('comprehensive_kartu_kendali_setup migration cannot be safely reversed - it would drop tables');
    }
};
