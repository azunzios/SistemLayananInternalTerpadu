<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all existing user roles from 'user' to 'pegawai'
        $users = DB::table('users')->get();
        
        foreach ($users as $user) {
            $roles = json_decode($user->roles ?? '[]', true);
            $roles = array_map(function($role) {
                return $role === 'user' ? 'pegawai' : $role;
            }, $roles);
            
            // Don't json_encode - Laravel will auto-encode
            DB::table('users')
                ->where('id', $user->id)
                ->update(['roles' => json_encode($roles)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert all pegawai roles back to user
        $users = DB::table('users')->whereRaw("JSON_CONTAINS(roles, '\"pegawai\"')")->get();
        
        foreach ($users as $user) {
            $roles = json_decode($user->roles ?? '[]', true);
            $roles = array_map(function($role) {
                return $role === 'pegawai' ? 'user' : $role;
            }, $roles);
            
            DB::table('users')
                ->where('id', $user->id)
                ->update(['roles' => json_encode($roles)]);
        }
    }
};
