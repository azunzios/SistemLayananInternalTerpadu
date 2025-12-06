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
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->after('roles')->nullable();
        });

        // Migrate existing data: Set default role from first item in roles array
        // We do this using raw SQL for performance and simplicity
        // If roles is ['admin', 'pegawai'], role becomes 'admin'
        // If roles is invalid or empty, default to 'pegawai'
        
        $users = \Illuminate\Support\Facades\DB::table('users')->get();
        
        foreach ($users as $user) {
            $roles = json_decode($user->roles ?? '[]', true);
            
            // Handle case where roles might not be an array (if manually messed up)
            if (!is_array($roles)) {
                 $roles = [];
            }
            
            $defaultRole = !empty($roles) ? $roles[0] : 'pegawai';
            
            \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $user->id)
                ->update(['role' => $defaultRole]);
        }
        
        // Make it non-nullable after population
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable(false)->default('pegawai')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
