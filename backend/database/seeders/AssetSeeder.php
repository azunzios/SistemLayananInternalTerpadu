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
        // Sample data BMN sesuai struktur gambar
        $assets = [
            [
                'kode_satker' => '0540123004292690',
                'nama_satker' => 'BPS Provinsi NTB',
                'kode_barang' => '3100101007',
                'nama_barang' => 'PC Workstation',
                'nup' => '1',
                'kondisi' => 'Baik',
                'merek' => 'HP Z4 G4 Workstation',
                'ruangan' => null,
            ],
            [
                'kode_satker' => '0540123004292690',
                'nama_satker' => 'BPS Provinsi NTB',
                'kode_barang' => '3100102001',
                'nama_barang' => 'P C Unit',
                'nup' => '114',
                'kondisi' => 'Rusak Ringan',
                'merek' => 'Dell Optiplex 3010 DT',
                'ruangan' => 'Rusak Ringan',
            ],
            [
                'kode_satker' => '0540123004292690',
                'nama_satker' => 'BPS Provinsi NTB',
                'kode_barang' => '3100102001',
                'nama_barang' => 'P C Unit',
                'nup' => '115',
                'kondisi' => 'Rusak Ringan',
                'merek' => 'Dell Optiplex 3010 DT',
                'ruangan' => 'Rusak Ringan',
            ],
            [
                'kode_satker' => '0540123004292690',
                'nama_satker' => 'BPS Provinsi NTB',
                'kode_barang' => '3100102001',
                'nama_barang' => 'P C Unit',
                'nup' => '116',
                'kondisi' => 'Rusak Ringan',
                'merek' => 'Dell Optiplex 3010 DT',
                'ruangan' => 'Rusak Ringan',
            ],
            [
                'kode_satker' => '0540123004292690',
                'nama_satker' => 'BPS Provinsi NTB',
                'kode_barang' => '3100102001',
                'nama_barang' => 'P C Unit',
                'nup' => '117',
                'kondisi' => 'Rusak Ringan',
                'merek' => 'Dell Optiplex 3010 DT',
                'ruangan' => 'Rusak Ringan',
            ],
        ];

        foreach ($assets as $assetData) {
            Asset::create($assetData);
        }
    }
}
