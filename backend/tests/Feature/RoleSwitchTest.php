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
            'role' => 'teknisi',
            'nip' => '123456789012345678',
            'jabatan' => 'Staff',
            'unit_kerja' => 'TI',
            'phone' => '08123456789'
        ]);
        
        $admin = User::factory()->create([
             'roles' => ['super_admin'],
             'role' => 'super_admin',
             'nip' => '123456789012349999',
             'jabatan' => 'Admin',
             'unit_kerja' => 'TI',
             'phone' => '08123456799'
        ]);
        
        $this->actingAs($admin);

        // Using generic update endpoint
        $response = $this->putJson("/api/users/{$user->id}", [
            'roles' => ['pegawai'],
            'name' => 'Test User',
            'email' => $user->email,
            'nip' => (string) (123456789012340000 + rand(1, 9999)), 
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

    public function test_new_user_gets_correct_initial_active_role()
    {
        $admin = User::factory()->create([
            'roles' => ['super_admin'], 
            'role' => 'super_admin',
            'nip' => '123456789012348888',
             'jabatan' => 'Admin',
             'unit_kerja' => 'TI',
             'phone' => '08123456788'
        ]);
        $this->actingAs($admin);
        
        $email = 'admin.layanan.' . time() . '@test.com';
        $nip = (string) (123456789012340000 + rand(1, 9999));

        $response = $this->postJson('/api/users', [
            'name' => 'Admin Layanan Test',
            'email' => $email,
            'password' => 'Password123!',
            'nip' => $nip,
            'jabatan' => 'Admin',
            'unit_kerja' => 'Layanan',
            'phone' => '081234567890',
            'roles' => ['admin_layanan'], // Should become the active role
            'is_active' => true
        ]);

        if ($response->status() !== 201) {
            $response->dump();
        }
        $response->assertStatus(201);
        
        $json = $response->json();
        // dump($json); // Debug output
        
        $response->assertJsonPath('role', 'admin_layanan');
        
        $userId = $response->json('id');
        $user = User::find($userId);
        
        $this->assertEquals('admin_layanan', $user->role);
        
        $user->delete();
        $admin->delete();
    }
}
