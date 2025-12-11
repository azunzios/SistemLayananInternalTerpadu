<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ticket;
use App\Models\WorkOrder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class KartuKendaliTestSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil user yang ada
        $pegawai = User::where('role', 'pegawai')->first();
        $teknisi = User::where('role', 'teknisi')->first();
        $adminLayanan = User::where('role', 'admin_layanan')->first();

        if (!$pegawai || !$teknisi || !$adminLayanan) {
            $this->command->error('Required users not found. Run DatabaseSeeder first.');
            return;
        }

        $this->command->info('Creating 50 kartu kendali test data...');

        // Check if test data already exists
        $existingCount = Ticket::where('ticket_number', 'like', 'TKT-REP-%')->count();
        if ($existingCount > 0) {
            $this->command->warn("Found {$existingCount} existing test tickets. Deleting...");
            Ticket::where('ticket_number', 'like', 'TKT-REP-%')->delete();
            WorkOrder::whereNull('ticket_id')->orWhere('ticket_id', '<=', 0)->delete();
        }

        // Asset data untuk variasi
        $assets = [
            ['code' => 'PC-001', 'name' => 'Komputer Desktop Dell OptiPlex 7090', 'nup' => 'NUP-2023-001'],
            ['code' => 'PC-002', 'name' => 'Komputer Desktop HP ProDesk 400 G9', 'nup' => 'NUP-2023-002'],
            ['code' => 'PC-003', 'name' => 'Komputer Desktop Lenovo ThinkCentre M90s', 'nup' => 'NUP-2023-003'],
            ['code' => 'LT-001', 'name' => 'Laptop Asus VivoBook 14', 'nup' => 'NUP-2023-004'],
            ['code' => 'LT-002', 'name' => 'Laptop HP Pavilion 15', 'nup' => 'NUP-2023-005'],
            ['code' => 'LT-003', 'name' => 'Laptop Acer Aspire 5', 'nup' => 'NUP-2023-006'],
            ['code' => 'PR-001', 'name' => 'Printer HP LaserJet Pro M404dn', 'nup' => 'NUP-2023-007'],
            ['code' => 'PR-002', 'name' => 'Printer Canon imageCLASS LBP223dw', 'nup' => 'NUP-2023-008'],
            ['code' => 'SC-001', 'name' => 'Scanner Epson WorkForce DS-530', 'nup' => 'NUP-2023-009'],
            ['code' => 'PR-003', 'name' => 'Printer Brother HL-L2395DW', 'nup' => 'NUP-2023-010'],
        ];

        $problems = [
            'Komputer tidak bisa menyala',
            'Laptop layar bergaris',
            'Printer tidak bisa print',
            'Scanner tidak terdeteksi',
            'Keyboard tidak berfungsi',
            'Mouse wireless mati',
            'Harddisk bunyi aneh',
            'RAM error',
            'Motherboard rusak',
            'Power supply mati',
            'Layar monitor blank',
            'USB port tidak berfungsi',
            'WiFi tidak konek',
            'Bluetooth error',
            'Audio tidak keluar suara',
        ];

        $statuses = ['in_progress', 'on_hold', 'closed', 'waiting_for_submitter'];
        $statusWeights = [3, 1, 5, 1]; // Lebih banyak in_progress dan closed

        // Generate 50 tiket dengan work order completed
        for ($i = 1; $i <= 50; $i++) {
            $asset = $assets[array_rand($assets)];
            $problem = $problems[array_rand($problems)];
            $status = $this->weightedRandom($statuses, $statusWeights);
            
            // Random date dalam 6 bulan terakhir
            $createdAt = Carbon::now()->subDays(rand(1, 180));
            
            // Buat tiket perbaikan
            $ticket = Ticket::create([
                'ticket_number' => 'TKT-REP-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'title' => $problem . ' - ' . $asset['name'],
                'description' => "Deskripsi: {$problem}\nLokasi: Ruang Kerja Lantai " . rand(1, 3),
                'type' => 'perbaikan',
                'status' => $status,
                'user_id' => $pegawai->id,
                'kode_barang' => $asset['code'],
                'nup' => $asset['nup'],
                'form_data' => [
                    'assetCode' => $asset['code'],
                    'assetName' => $asset['name'],
                    'assetNUP' => $asset['nup'],
                    'location' => 'Ruang Kerja Lantai ' . rand(1, 3),
                    'problem' => $problem,
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(rand(1, 7)),
            ]);

            // Buat work order COMPLETED (ini yang penting untuk kartu kendali)
            $workOrder = WorkOrder::create([
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'type' => ['sparepart', 'vendor', 'license'][array_rand(['sparepart', 'vendor', 'license'])],
                'status' => 'completed', // Status completed wajib
                'created_by' => $teknisi->id,
                'items' => json_encode([['item' => $asset['name'], 'problem' => $problem]]),
                'completion_notes' => "Perbaikan selesai untuk: {$problem}",
                'completed_at' => $createdAt->copy()->addDays(rand(3, 10)),
                'created_at' => $createdAt->copy()->addDays(1),
                'updated_at' => $createdAt->copy()->addDays(rand(3, 10)),
            ]);

            if ($i % 10 === 0) {
                $this->command->info("Created {$i}/50 kartu kendali...");
            }
        }

        // Buat beberapa tiket TANPA work order completed (untuk test filter)
        $this->command->info('Creating 10 tickets without completed work orders (should NOT appear in kartu kendali)...');
        
        for ($i = 51; $i <= 60; $i++) {
            $asset = $assets[array_rand($assets)];
            $problem = $problems[array_rand($problems)];
            $createdAt = Carbon::now()->subDays(rand(1, 180));
            
            $ticket = Ticket::create([
                'ticket_number' => 'TKT-REP-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'title' => $problem . ' - ' . $asset['name'] . ' (No WO)',
                'description' => "Tiket ini TIDAK punya work order completed",
                'type' => 'perbaikan',
                'status' => 'in_progress',
                'user_id' => $pegawai->id,
                'kode_barang' => $asset['code'],
                'nup' => $asset['nup'],
                'form_data' => [
                    'assetCode' => $asset['code'],
                    'assetName' => $asset['name'],
                    'assetNUP' => $asset['nup'],
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(1),
            ]);

            // Work order dengan status requested/in_procurement (BUKAN completed)
            if (rand(0, 1)) {
                WorkOrder::create([
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'type' => 'sparepart',
                    'status' => ['requested', 'in_procurement'][array_rand(['requested', 'in_procurement'])],
                    'created_by' => $teknisi->id,
                    'items' => json_encode([['item' => 'Pending item']]),
                    'created_at' => $createdAt->copy()->addDays(1),
                ]);
            }
        }

        $this->command->info('✅ Seeder completed!');
        $this->command->info('Created 50 kartu kendali entries (with completed work orders)');
        $this->command->info('Created 10 tickets that should NOT appear in kartu kendali');
        $this->command->newLine();
        $this->command->warn('Test pagination: Should have 4 pages (15 items per page)');
        $this->command->warn('Test filter: 10 tickets without completed WO should be excluded');
    }

    // Helper untuk random dengan bobot
    private function weightedRandom(array $values, array $weights): mixed
    {
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);
        
        $currentWeight = 0;
        foreach ($values as $index => $value) {
            $currentWeight += $weights[$index];
            if ($random <= $currentWeight) {
                return $value;
            }
        }
        
        return $values[0];
    }
}
