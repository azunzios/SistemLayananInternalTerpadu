<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration ensures all users have a valid JSON array in the roles column.
     * It fixes NULL, empty strings, and ensures all users have at least one role.
     */
    public function up(): void
    {
        $users = DB::table('users')->get();
        
        foreach ($users as $user) {
            $roles = null;
            
            // Try to decode the existing roles
            if (!empty($user->roles)) {
                $decoded = json_decode($user->roles, true);
                if (is_array($decoded) && !empty($decoded)) {
                    $roles = $decoded;
                }
            }
            
            // If roles is still null or empty, assign default role 'pegawai'
            if (empty($roles)) {
                $roles = ['pegawai'];
            }
            
            // Update the user with properly formatted JSON
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
        // This migration is data-fixing, no need to reverse
        // We don't want to corrupt the data by reversing
    }
};
