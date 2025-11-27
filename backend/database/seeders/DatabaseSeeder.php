<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ticket;
use App\Models\Timeline;
use App\Models\WorkOrder;
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
        // ===== USERS =====
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
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $users = User::all();

        // ===== TICKETS =====
        $pegawai = $users->where('email', 'pegawai@example.com')->first();
        $teknisi = $users->where('email', 'teknisi@example.com')->first();
        $admin = $users->where('email', 'admin.layanan@example.com')->first();

        // Perbaikan Ticket - only store user_id, other info comes from User model via relation
        $ticket1 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber('perbaikan'),
            'type' => 'perbaikan',
            'title' => 'Laptop tidak menyala',
            'description' => 'Laptop Dell Inspiron tidak bisa dinyalakan, sudah dicoba hard reset tapi tetap tidak menyala',
            'user_id' => $pegawai->id,
            'assigned_to' => $teknisi->id,
            'asset_code' => '2060101999',
            'asset_nup' => '00001',
            'asset_location' => 'Bagian TI',
            'severity' => 'high',
            'status' => 'assigned',
            'form_data' => json_encode([
                'jenis_kerusakan' => 'Hardware',
                'deskripsi_kerusakan' => 'Laptop tidak menyala setelah dimatikan tiba-tiba',
                'data_penting' => true,
            ]),
        ]);

        Timeline::create([
            'ticket_id' => $ticket1->id,
            'user_id' => $pegawai->id,
            'action' => 'ticket_created',
            'details' => 'Ticket created',
        ]);

        Timeline::logAssignment($ticket1->id, $admin->id, $teknisi->id, $teknisi->name);

        // Zoom Ticket - only store user_id
        $ticket2 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber('zoom_meeting'),
            'type' => 'zoom_meeting',
            'title' => 'Rapat Koordinasi Tim',
            'description' => 'Rapat koordinasi dengan semua bagian untuk evaluasi kuartal III',
            'user_id' => $pegawai->id,
            'zoom_date' => now()->addDays(7)->format('Y-m-d'),
            'zoom_start_time' => '10:00:00',
            'zoom_end_time' => '11:30:00',
            'zoom_duration' => 90,
            'zoom_estimated_participants' => 25,
            'zoom_co_hosts' => json_encode([
                ['name' => 'Admin Layanan', 'email' => 'admin.layanan@example.com'],
            ]),
            'zoom_breakout_rooms' => 3,
            'status' => 'pending_review',
            'form_data' => json_encode([
                'topik_meeting' => 'Evaluasi Kuartal III',
                'jumlah_peserta' => 25,
            ]),
        ]);

        Timeline::create([
            'ticket_id' => $ticket2->id,
            'user_id' => $pegawai->id,
            'action' => 'ticket_created',
            'details' => 'Zoom booking created',
        ]);

        // Work Order
        $wo = WorkOrder::create([
            'ticket_id' => $ticket1->id,
            'ticket_number' => $ticket1->ticket_number,
            'type' => 'sparepart',
            'status' => 'requested',
            'created_by' => $teknisi->id,
            'items' => json_encode([
                [
                    'name' => 'Charger Dell',
                    'quantity' => 1,
                    'unit' => 'pcs',
                    'remarks' => 'Original Dell 90W',
                    'estimated_price' => 600000,
                ],
            ]),
            'vendor_name' => null,
            'vendor_contact' => null,
        ]);

        Timeline::create([
            'ticket_id' => $ticket1->id,
            'user_id' => $teknisi->id,
            'action' => 'work_order_created',
            'details' => 'Work order created for sparepart',
        ]);

        // Seed Assets
        $this->call(AssetSeeder::class);

        // Seed Zoom accounts for booking management
        $this->call(ZoomAccountSeeder::class);
    }
}
