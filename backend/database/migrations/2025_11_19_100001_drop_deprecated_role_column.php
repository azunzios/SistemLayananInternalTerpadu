<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration removes the deprecated 'role' column if it exists
     * and ensures we only use the 'roles' JSON array column.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            // First, migrate any data from 'role' to 'roles' if needed
            $users = DB::table('users')->whereNull('roles')->orWhere('roles', '')->get();
            
            foreach ($users as $user) {
                $role = $user->role ?? 'pegawai';
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['roles' => json_encode([$role])]);
            }
            
            // Now drop the deprecated column
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('pegawai')->after('avatar');
            });
        }
    }
};
