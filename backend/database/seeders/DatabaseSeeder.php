<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\CategoryField;
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

        // ===== CATEGORIES =====
        $categoryPerbaikan = Category::create([
            'name' => 'Perbaikan Komputer',
            'type' => 'perbaikan',
            'description' => 'Layanan perbaikan perangkat keras dan lunak komputer',
            'assigned_roles' => json_encode(['admin_layanan', 'teknisi']),
            'is_active' => true,
        ]);

        // Add fields untuk perbaikan
        $fieldsData = [
            [
                'category_id' => $categoryPerbaikan->id,
                'name' => 'jenis_kerusakan',
                'label' => 'Jenis Kerusakan',
                'type' => 'select',
                'required' => true,
                'options' => json_encode(['Hardware', 'Software', 'Lainnya']),
                'order' => 1,
            ],
            [
                'category_id' => $categoryPerbaikan->id,
                'name' => 'deskripsi_kerusakan',
                'label' => 'Deskripsi Kerusakan',
                'type' => 'textarea',
                'required' => true,
                'order' => 2,
            ],
            [
                'category_id' => $categoryPerbaikan->id,
                'name' => 'data_penting',
                'label' => 'Ada Data Penting?',
                'type' => 'checkbox',
                'required' => false,
                'order' => 3,
            ],
        ];
        foreach ($fieldsData as $fieldData) {
            CategoryField::create($fieldData);
        }

        $categoryZoom = Category::create([
            'name' => 'Booking Zoom',
            'type' => 'zoom_meeting',
            'description' => 'Pemesanan meeting/konferensi video via Zoom',
            'assigned_roles' => json_encode(['admin_layanan']),
            'is_active' => true,
        ]);

        // Add fields untuk zoom
        $zoomFieldsData = [
            [
                'category_id' => $categoryZoom->id,
                'name' => 'topik_meeting',
                'label' => 'Topik Meeting',
                'type' => 'text',
                'required' => true,
                'order' => 1,
            ],
            [
                'category_id' => $categoryZoom->id,
                'name' => 'jumlah_peserta',
                'label' => 'Estimasi Jumlah Peserta',
                'type' => 'number',
                'required' => true,
                'order' => 2,
            ],
        ];
        foreach ($zoomFieldsData as $fieldData) {
            CategoryField::create($fieldData);
        }

        // ===== TICKETS =====
        $pegawai = $users->where('email', 'pegawai@example.com')->first();
        $teknisi = $users->where('email', 'teknisi@example.com')->first();
        $admin = $users->where('email', 'admin.layanan@example.com')->first();

        // Perbaikan Ticket
        $ticket1 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber('perbaikan'),
            'type' => 'perbaikan',
            'title' => 'Laptop tidak menyala',
            'description' => 'Laptop Dell Inspiron tidak bisa dinyalakan, sudah dicoba hard reset tapi tetap tidak menyala',
            'category_id' => $categoryPerbaikan->id,
            'user_id' => $pegawai->id,
            'user_name' => $pegawai->name,
            'user_email' => $pegawai->email,
            'user_phone' => $pegawai->phone,
            'unit_kerja' => $pegawai->unit_kerja,
            'assigned_to' => $teknisi->id,
            'asset_code' => 'DELL-001',
            'asset_nup' => '2020-001',
            'asset_location' => 'Ruang Statistik',
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

        // Zoom Ticket
        $ticket2 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber('zoom_meeting'),
            'type' => 'zoom_meeting',
            'title' => 'Rapat Koordinasi Tim',
            'description' => 'Rapat koordinasi dengan semua bagian untuk evaluasi kuartal III',
            'category_id' => $categoryZoom->id,
            'user_id' => $pegawai->id,
            'user_name' => $pegawai->name,
            'user_email' => $pegawai->email,
            'user_phone' => $pegawai->phone,
            'unit_kerja' => $pegawai->unit_kerja,
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
    }
}
