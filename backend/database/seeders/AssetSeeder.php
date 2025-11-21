<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Asset;
use App\Models\User;

class AssetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get test users - check if users exist, if not just create assets without user_id
        $pegawaiUsers = [];
        if (User::exists()) {
            $pegawaiUsers = User::limit(3)->get()->toArray();
        }

        $assets = [
            [
                'asset_code' => 'KB-2024-001',
                'asset_nup' => '000001',
                'asset_name' => 'Laptop Dell XPS 13',
                'description' => 'Laptop untuk kegiatan administrasi',
                'asset_type' => 'Elektronik',
                'manufacturer' => 'Dell',
                'model' => 'XPS 13 9370',
                'serial_number' => 'DELL-XPS-12345',
                'location' => 'Ruang TU, Lantai 2',
                'condition' => 'baik',
                'is_active' => true,
                'acquisition_date' => '2022-01-15',
                'warranty_end_date' => '2025-01-15',
                'acquisition_cost' => 15000000,
                'current_value' => 10000000,
            ],
            [
                'asset_code' => 'KB-2024-002',
                'asset_nup' => '000002',
                'asset_name' => 'Printer HP LaserJet Pro',
                'description' => 'Printer untuk departemen',
                'asset_type' => 'Elektronik',
                'manufacturer' => 'HP',
                'model' => 'M404n',
                'serial_number' => 'HP-LASER-54321',
                'location' => 'Ruang TU, Lantai 1',
                'condition' => 'baik',
                'is_active' => true,
                'acquisition_date' => '2021-06-10',
                'warranty_end_date' => '2024-06-10',
                'acquisition_cost' => 5000000,
                'current_value' => 2500000,
            ],
            [
                'asset_code' => 'KB-2024-003',
                'asset_nup' => '000003',
                'asset_name' => 'Monitor LG 27 inch',
                'description' => 'Monitor untuk workstation',
                'asset_type' => 'Elektronik',
                'manufacturer' => 'LG',
                'model' => '27UK850',
                'serial_number' => 'LG-MONITOR-99999',
                'location' => 'Ruang Server',
                'condition' => 'baik',
                'is_active' => true,
                'acquisition_date' => '2023-03-20',
                'warranty_end_date' => '2026-03-20',
                'acquisition_cost' => 4000000,
                'current_value' => 3500000,
            ],
            [
                'asset_code' => 'KB-2024-004',
                'asset_nup' => '000004',
                'asset_name' => 'Meja Kerja Kayu',
                'description' => 'Meja kerja untuk pegawai',
                'asset_type' => 'Furniture',
                'manufacturer' => 'Lokal',
                'model' => 'Standard',
                'serial_number' => 'MEJA-001',
                'location' => 'Ruang Kerja B',
                'condition' => 'kurang_baik',
                'is_active' => true,
                'acquisition_date' => '2020-08-01',
                'warranty_end_date' => null,
                'acquisition_cost' => 2000000,
                'current_value' => 800000,
            ],
            [
                'asset_code' => 'KB-2024-005',
                'asset_nup' => '000005',
                'asset_name' => 'Keyboard Mekanik RGB',
                'description' => 'Keyboard untuk penggunaan umum',
                'asset_type' => 'Elektronik',
                'manufacturer' => 'Corsair',
                'model' => 'K95 Platinum',
                'serial_number' => 'CORSAIR-KB-777',
                'location' => 'Ruang Kerja A',
                'condition' => 'baru',
                'is_active' => true,
                'acquisition_date' => '2024-10-01',
                'warranty_end_date' => '2026-10-01',
                'acquisition_cost' => 1500000,
                'current_value' => 1400000,
            ],
        ];

        foreach ($assets as $assetData) {
            // Assign random pegawai user (optional)
            if (!empty($pegawaiUsers)) {
                $randomUser = $pegawaiUsers[array_rand($pegawaiUsers)];
                $assetData['user_id'] = $randomUser['id'];
                $assetData['unit_kerja'] = 'Bagian Umum';
            }

            Asset::create($assetData);
        }
    }
}
