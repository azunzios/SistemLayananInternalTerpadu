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
                'asset_code' => '2060101999',
                'asset_nup' => '00001',
                'asset_name' => 'Laptop Dell Latitude 5440',
                'merk_tipe' => 'Dell Latitude 5440',
                'spesifikasi' => 'i5-1345U, 16GB RAM, 512GB SSD, 14"',
                'tahun_perolehan' => 2023,
                'tanggal_perolehan' => '2023-06-20',
                'sumber_dana' => 'dipa',
                'nomor_bukti_perolehan' => 'BAST-2023/06/5440',
                'nilai_perolehan' => 18000000,
                'nilai_buku' => 15000000,
                'satuan' => 'unit',
                'jumlah' => 1,
                'location' => 'Bagian TI',
                'unit_pengguna' => 'Bagian TI',
                'condition' => 'baik',
                'status_penggunaan' => 'digunakan',
                'is_active' => true,
                'keterangan' => 'BMN laptop untuk staf TI',
            ],
            [
                'asset_code' => '2100102999',
                'asset_nup' => '00002',
                'asset_name' => 'Printer HP LaserJet M404n',
                'merk_tipe' => 'HP LaserJet M404n',
                'spesifikasi' => 'Mono, LAN, duty cycle 80k pages',
                'tahun_perolehan' => 2022,
                'tanggal_perolehan' => '2022-04-15',
                'sumber_dana' => 'dipa',
                'nomor_bukti_perolehan' => 'SP2D-2022/04/PRN02',
                'nilai_perolehan' => 5000000,
                'nilai_buku' => 3500000,
                'satuan' => 'unit',
                'jumlah' => 1,
                'location' => 'Subbag Umum',
                'unit_pengguna' => 'Subbag Umum',
                'condition' => 'baik',
                'status_penggunaan' => 'digunakan',
                'is_active' => true,
                'keterangan' => 'Printer layanan umum',
            ],
            [
                'asset_code' => '3050101999',
                'asset_nup' => '00003',
                'asset_name' => 'Meja Kerja Modera',
                'merk_tipe' => 'Modera 120x60',
                'spesifikasi' => 'Kayu lapis, rangka besi',
                'tahun_perolehan' => 2020,
                'tanggal_perolehan' => '2020-08-01',
                'sumber_dana' => 'dipa',
                'nomor_bukti_perolehan' => 'BAST-2020/08/MEJA03',
                'nilai_perolehan' => 2000000,
                'nilai_buku' => 800000,
                'satuan' => 'unit',
                'jumlah' => 1,
                'location' => 'Bagian TI',
                'unit_pengguna' => 'Bagian TI',
                'condition' => 'rusak_ringan',
                'status_penggunaan' => 'digunakan',
                'is_active' => true,
                'keterangan' => 'Permukaan terkelupas, perlu perbaikan ringan',
            ],
        ];

        foreach ($assets as $assetData) {
            // Assign random pegawai user (optional)
            if (!empty($pegawaiUsers)) {
                $randomUser = $pegawaiUsers[array_rand($pegawaiUsers)];
                $assetData['penanggung_jawab_user_id'] = $randomUser['id'];
                $assetData['unit_pengguna'] = $assetData['unit_pengguna'] ?? 'Bagian Umum';
            }

            Asset::create($assetData);
        }
    }
}
