<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only seed default users
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password'),
                'roles' => ['super_admin'],
                'nip' => '199001011990101001',
                'jabatan' => 'Kepala Sistem IT',
                'unit_kerja' => 'IT & Sistem',
                'phone' => '081234567890',
                'is_active' => true,
            ],
            [
                'name' => 'Admin Layanan',
                'email' => 'admin.layanan@example.com',
                'password' => Hash::make('password'),
                'roles' => ['admin_layanan'],
                'nip' => '199102021991021001',
                'jabatan' => 'Admin Layanan',
                'unit_kerja' => 'Bagian Layanan',
                'phone' => '081234567891',
                'is_active' => true,
            ],
            [
                'name' => 'Admin Penyedia',
                'email' => 'admin.penyedia@example.com',
                'password' => Hash::make('password'),
                'roles' => ['admin_penyedia'],
                'nip' => '199103031991031001',
                'jabatan' => 'Admin Penyedia',
                'unit_kerja' => 'Bagian Penyedia',
                'phone' => '081234567892',
                'is_active' => true,
            ],
            [
                'name' => 'Teknisi',
                'email' => 'teknisi@example.com',
                'password' => Hash::make('password'),
                'roles' => ['teknisi'],
                'nip' => '199104041991041001',
                'jabatan' => 'Teknisi Maintenance',
                'unit_kerja' => 'IT & Sistem',
                'phone' => '081234567893',
                'is_active' => true,
            ],
            [
                'name' => 'Pegawai Biasa',
                'email' => 'pegawai@example.com',
                'password' => Hash::make('password'),
                'roles' => ['pegawai'],
                'nip' => '199105051991051001',
                'jabatan' => 'Pegawai Statistik',
                'unit_kerja' => 'Statistik Produksi',
                'phone' => '081234567894',
                'is_active' => true,
            ],
            [
                'name' => 'Multi Role User',
                'email' => 'multirole@example.com',
                'password' => Hash::make('password'),
                'roles' => ['admin_penyedia', 'teknisi'],
                'nip' => '199106061991061001',
                'jabatan' => 'Admin Penyedia & Teknisi',
                'unit_kerja' => 'IT & Penyedia',
                'phone' => '081234567895',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            // Set role (single) dari roles dengan priority logic
            // Untuk multi-role, ambil role pertama yang paling tinggi prioritasnya
            // Priority: super_admin > admin_layanan > admin_penyedia > teknisi > pegawai
            $rolePriority = ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'pegawai'];
            $primaryRole = 'pegawai'; // default fallback
            
            foreach ($rolePriority as $role) {
                if (in_array($role, $userData['roles'])) {
                    $primaryRole = $role;
                    break; // Ambil yang pertama ketemu (prioritas tertinggi)
                }
            }
            $userData['role'] = $primaryRole;

            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
