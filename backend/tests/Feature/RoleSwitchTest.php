<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RoleSwitchTest extends TestCase
{
    // usage of RefreshDatabase might wipe existing data which is annoying in this environment if not configured for sqlite :memory:
    // So I will just manually create and cleanup or rely on standard transaction content if available.
    // For safety in this agentic environment where I don't know the DB config fully (it might be a shared dev DB),
    // I will try to be non-destructive or use a random user.

    public function test_user_can_switch_role()
    {
        // 1. Create User with multiple roles
        $user = User::factory()->create([
            'roles' => ['pegawai', 'teknisi'],
            'role' => 'pegawai' // Default
        ]);

        $this->actingAs($user);

        // 2. Check initial state
        $this->assertEquals('pegawai', $user->role);

        // 3. Attempt to switch to 'teknisi'
        $response = $this->postJson('/api/change-role', [
            'role' => 'teknisi'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.role', 'teknisi');

        // 4. Verify DB change
        $this->assertEquals('teknisi', $user->fresh()->role);
        
        // Cleanup
        $user->delete();
    }

    public function test_user_cannot_switch_to_unassigned_role()
    {
        $user = User::factory()->create([
            'roles' => ['pegawai'],
            'role' => 'pegawai'
        ]);

        $this->actingAs($user);

        $response = $this->postJson('/api/change-role', [
            'role' => 'super_admin' // Not in their roles
        ]);

        $response->assertStatus(422); // Validation error
        
        $user->delete();
    }

    public function test_update_roles_resets_active_role_if_invalid()
    {
        // 1. Create a user with [pegawai, teknisi], active=teknisi
        $user = User::factory()->create([
            'roles' => ['pegawai', 'teknisi'],
            'role' => 'teknisi'
        ]);
        
        $admin = User::factory()->create([
             'roles' => ['super_admin'],
             'role' => 'super_admin'
        ]);
        
        $this->actingAs($admin);

        // 2. Update roles to ONLY [pegawai] (removing teknisi)
        // Note: route needs to be added or we assume the controller logic is used by existing update endpoints
        // Assuming we are testing the logic in UserController::update or similar
        // Let's use the updateRoles endpoint if available or the generic update
        
        // Using generic update endpoint for testing logic integration
        $response = $this->putJson("/api/users/{$user->id}", [
            'roles' => ['pegawai'],
            'name' => 'Test User',
            'email' => $user->email,
            'nip' => '123456789012345678', // Ensure 18 digits or string
            'jabatan' => 'Staff',
            'unit_kerja' => 'TI',
            'phone' => '08123456789',
            'is_active' => true 
        ]);

        $response->assertStatus(200);

        // 3. Verify active role is reset to 'pegawai'
        $this->assertEquals('pegawai', $user->fresh()->role);
        
        // Cleanup
        $user->delete();
        $admin->delete();
    }
}
