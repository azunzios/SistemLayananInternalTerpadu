// Demo data seeder for BPS NTB Ticketing System
import type { User, Ticket, Category, InventoryItem, SparepartRequest, ZoomBooking, AuditLog, Notification, WorkOrder } from '../types';
import { getCompletedWorkOrdersDemo, getCompletedTicketsDemo } from './demo-work-orders-completed';

// Demo Users - Password untuk semua: demo123
export const getDemoUsers = (): User[] => {
  const now = new Date().toISOString();
  
  return [
    // Super Admin
    {
      id: 'user-1',
      email: 'superadmin@bps-ntb.go.id',
      password: 'demo123',
      name: 'Dr. Ahmad Yani',
      nip: '198501012010011001',
      jabatan: 'Kepala BPS NTB',
      role: 'super_admin',
      roles: ['super_admin'],
      unitKerja: 'Bagian Umum',
      phone: '081234567890',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Admin Layanan
    {
      id: 'user-2',
      email: 'adminlayanan@bps-ntb.go.id',
      password: 'demo123',
      name: 'Siti Nurhaliza',
      nip: '198702022011012001',
      jabatan: 'Kepala Bagian Layanan',
      role: 'admin_layanan',
      roles: ['admin_layanan'],
      unitKerja: 'Bagian Layanan Internal',
      phone: '081234567891',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Admin Penyedia
    {
      id: 'user-3',
      email: 'adminpenyedia@bps-ntb.go.id',
      password: 'demo123',
      name: 'Budi Santoso',
      nip: '198803032012011001',
      jabatan: 'Kepala Bagian Pengadaan',
      role: 'admin_penyedia',
      roles: ['admin_penyedia'],
      unitKerja: 'Bagian Pengadaan',
      phone: '081234567892',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Teknisi 1
    {
      id: 'user-4',
      email: 'teknisi1@bps-ntb.go.id',
      password: 'demo123',
      name: 'Andi Wijaya',
      nip: '199004042015011001',
      jabatan: 'Teknisi IT',
      role: 'teknisi',
      roles: ['teknisi'],
      unitKerja: 'Bagian IT',
      phone: '081234567893',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Teknisi 2
    {
      id: 'user-5',
      email: 'teknisi2@bps-ntb.go.id',
      password: 'demo123',
      name: 'Rudi Hartono',
      nip: '199105052016011001',
      jabatan: 'Teknisi IT',
      role: 'teknisi',
      roles: ['teknisi'],
      unitKerja: 'Bagian IT',
      phone: '081234567894',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // User 1
    {
      id: 'user-6',
      email: 'user1@bps-ntb.go.id',
      password: 'demo123',
      name: 'Dewi Lestari',
      nip: '199206062017012001',
      jabatan: 'Statistisi Ahli Pertama',
      role: 'user',
      roles: ['user'],
      unitKerja: 'Statistik Produksi',
      phone: '081234567895',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // User 2
    {
      id: 'user-7',
      email: 'user2@bps-ntb.go.id',
      password: 'demo123',
      name: 'Joko Susilo',
      nip: '199307072018011001',
      jabatan: 'Statistisi Ahli Muda',
      role: 'user',
      roles: ['user'],
      unitKerja: 'Statistik Distribusi',
      phone: '081234567896',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // User 3
    {
      id: 'user-8',
      email: 'user3@bps-ntb.go.id',
      password: 'demo123',
      name: 'Maya Sari',
      nip: '199408082019012001',
      jabatan: 'Analis Data',
      role: 'user',
      roles: ['user'],
      unitKerja: 'Statistik Sosial',
      phone: '081234567897',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Multi-Role User: Admin Layanan + Teknisi
    {
      id: 'user-9',
      email: 'multirole1@bps-ntb.go.id',
      password: 'demo123',
      name: 'Lisa Wati',
      nip: '199509092020012001',
      jabatan: 'Kepala Bagian Layanan & Teknisi',
      role: 'admin_layanan', // Default role
      roles: ['admin_layanan', 'teknisi'],
      unitKerja: 'Bagian Layanan & IT',
      phone: '081234567898',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // Multi-Role User: Pegawai + Admin Penyedia
    {
      id: 'user-10',
      email: 'multirole2@bps-ntb.go.id',
      password: 'demo123',
      name: 'Hendra Gunawan',
      nip: '199610102021011001',
      jabatan: 'Pegawai Pengadaan',
      role: 'user', // Default role
      roles: ['user', 'admin_penyedia'],
      unitKerja: 'Statistik Produksi & Pengadaan',
      phone: '081234567899',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
    // ALL ROLES User - Master Account
    {
      id: 'user-master',
      email: 'master@bps-ntb.go.id',
      password: 'demo123',
      name: 'Master Administrator',
      nip: '199001012020011001',
      jabatan: 'Full Access Administrator',
      role: 'super_admin', // Default role
      roles: ['super_admin', 'admin_layanan', 'admin_penyedia', 'teknisi', 'user'],
      unitKerja: 'Semua Unit',
      phone: '081234567800',
      createdAt: now,
      isActive: true,
      failedLoginAttempts: 0,
    },
  ];
};

// Demo Categories
export const getDemoCategories = (): Category[] => {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'cat-2',
      name: 'Komputer/Laptop',
      type: 'perbaikan',
      fields: [
        { id: 'f1', label: 'Nama Barang', type: 'text', required: true },
        { id: 'f2', label: 'Nomor Inventaris', type: 'text', required: false },
        { id: 'f3', label: 'Deskripsi Masalah', type: 'textarea', required: true },
        { id: 'f4', label: 'Lokasi Barang', type: 'text', required: true },
      ],
      assignedRoles: ['teknisi'],
      createdAt: now,
    },
    {
      id: 'cat-3',
      name: 'Printer/Scanner',
      type: 'perbaikan',
      fields: [
        { id: 'f1', label: 'Nama Barang', type: 'text', required: true },
        { id: 'f2', label: 'Nomor Inventaris', type: 'text', required: false },
        { id: 'f3', label: 'Deskripsi Masalah', type: 'textarea', required: true },
        { id: 'f4', label: 'Lokasi Barang', type: 'text', required: true },
      ],
      assignedRoles: ['teknisi'],
      createdAt: now,
    },
  ];
};

// Demo Tickets
export const getDemoTickets = (): Ticket[] => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return [
    // Perbaikan - Submitted (Belum diassign)
    {
      id: 'ticket-0',
      ticketNumber: 'TKT-PR-20251189-3477',
      userId: 'user-6',
      userName: 'Dewi Lestari',
      userEmail: 'user1@bps-ntb.go.id',
      userPhone: '081234567895',
      unitKerja: 'Statistik Produksi',
      title: 'Monitor Mati Total',
      description: 'Monitor LED tidak menampilkan gambar sama sekali, lampu power berkedip-kedip',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'submitted',
      priority: 'P2',
      assetCode: 'MON-2022-0198',
      assetNUP: '12345678-20220198',
      assetLocation: 'Ruang Statistik Produksi Lt. 2',
      data: {
        itemName: 'Monitor LED Samsung 22 inch',
        issueDescription: 'Monitor tiba-tiba mati total saat sedang digunakan, lampu power berkedip-kedip orange. Sudah dicoba ganti kabel power tetap sama.',
      },
      attachments: [],
      timeline: [
        {
          id: 'tl-0-1',
          timestamp: now.toISOString(),
          action: 'CREATED',
          actor: 'user-6',
          details: 'Tiket perbaikan dibuat, menunggu untuk diassign ke teknisi',
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Perbaikan - Assigned (Ditugaskan ke Teknisi)
    {
      id: 'ticket-4',
      ticketNumber: 'TKT-PR-20251184-0084',
      userId: 'user-6',
      userName: 'Dewi Lestari',
      userEmail: 'user1@bps-ntb.go.id',
      userPhone: '081234567895',
      unitKerja: 'Statistik Produksi',
      title: 'Laptop Tidak Bisa Booting',
      description: 'Laptop Dell Latitude tidak mau menyala sama sekali, lampu indikator tidak menyala',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'assigned',
      priority: 'P1',
      assetCode: 'LAP-2023-0145',
      assetNUP: '12345678-20230145',
      assetLocation: 'Ruang Statistik Produksi Lt. 2',
      data: {
        itemName: 'Laptop Dell Latitude 3420',
        issueDescription: 'Laptop tidak bisa booting, lampu indikator mati, sudah dicoba ganti charger tetap tidak mau menyala',
      },
      assignedTo: 'user-4',
      attachments: [],
      timeline: [
        {
          id: 'tl-4-1',
          timestamp: now.toISOString(),
          action: 'CREATED',
          actor: 'user-6',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-4-2',
          timestamp: now.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Andi Wijaya',
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Perbaikan - In Progress (Sedang Dikerjakan Teknisi)
    {
      id: 'ticket-5',
      ticketNumber: 'TKT-PR-20251182-2825',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'Printer Error 50.4',
      description: 'Printer Canon iR2525 menampilkan error code 50.4 dan tidak bisa print',
      type: 'perbaikan',
      categoryId: 'cat-3',
      status: 'in_progress',
      priority: 'P2',
      assetCode: 'PRT-2022-0089',
      assetNUP: '12345678-20220089',
      assetLocation: 'Ruang Statistik Distribusi Lt. 3',
      finalProblemType: 'hardware',
      data: {
        itemName: 'Printer Canon imageRUNNER 2525',
        issueDescription: 'Printer error code 50.4, kertas sering macet, hasil print bergaris',
      },
      assignedTo: 'user-5',
      attachments: [],
      timeline: [
        {
          id: 'tl-5-1',
          timestamp: yesterday.toISOString(),
          action: 'CREATED',
          actor: 'user-7',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-5-2',
          timestamp: yesterday.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Rudi Hartono',
        },
        {
          id: 'tl-5-3',
          timestamp: now.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi In Progress - Teknisi sedang mengerjakan perbaikan',
        },
      ],
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Perbaikan - Resolved (Selesai Diperbaiki, Menunggu Konfirmasi User)
    {
      id: 'ticket-6',
      ticketNumber: 'TKT-PR-20251178-0087',
      userId: 'user-8',
      userName: 'Maya Sari',
      userEmail: 'user3@bps-ntb.go.id',
      userPhone: '081234567897',
      unitKerja: 'Statistik Sosial',
      title: 'Komputer Lambat dan Sering Hang',
      description: 'Komputer desktop sangat lambat, sering hang saat membuka aplikasi berat',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'resolved',
      priority: 'P3',
      assetCode: 'PC-2021-0234',
      assetNUP: '12345678-20210234',
      assetLocation: 'Ruang Statistik Sosial Lt. 2',
      finalProblemType: 'hardware',
      repairable: true,
      data: {
        itemName: 'PC Desktop HP EliteDesk 800',
        issueDescription: 'Komputer sangat lambat, RAM hanya 4GB, HDD penuh, sering hang',
      },
      assignedTo: 'user-4',
      attachments: [],
      timeline: [
        {
          id: 'tl-6-1',
          timestamp: threeDaysAgo.toISOString(),
          action: 'CREATED',
          actor: 'user-8',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-6-2',
          timestamp: threeDaysAgo.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Andi Wijaya',
        },
        {
          id: 'tl-6-3',
          timestamp: twoDaysAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-4',
          details: 'Status diubah menjadi In Progress - Sedang proses upgrade SSD dan RAM',
        },
        {
          id: 'tl-6-4',
          timestamp: now.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-4',
          details: 'Status diubah menjadi Resolved - Upgrade SSD 512GB dan RAM 16GB selesai, komputer sudah berjalan normal',
        },
      ],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Perbaikan - Closed (Selesai dan Dikonfirmasi User)
    {
      id: 'ticket-7',
      ticketNumber: 'TKT-PR-20251172-2867',
      userId: 'user-6',
      userName: 'Dewi Lestari',
      userEmail: 'user1@bps-ntb.go.id',
      userPhone: '081234567895',
      unitKerja: 'Statistik Produksi',
      title: 'Scanner Tidak Terdeteksi',
      description: 'Scanner Epson tidak terdeteksi di komputer setelah update Windows',
      type: 'perbaikan',
      categoryId: 'cat-3',
      status: 'closed',
      priority: 'P3',
      assetCode: 'SCN-2023-0067',
      assetNUP: '12345678-20230067',
      assetLocation: 'Ruang Statistik Produksi Lt. 2',
      finalProblemType: 'software',
      repairable: true,
      data: {
        itemName: 'Scanner Epson DS-530',
        issueDescription: 'Scanner tidak terdeteksi di Windows setelah update, driver error',
      },
      assignedTo: 'user-5',
      attachments: [],
      timeline: [
        {
          id: 'tl-7-1',
          timestamp: weekAgo.toISOString(),
          action: 'CREATED',
          actor: 'user-6',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-7-2',
          timestamp: weekAgo.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Rudi Hartono',
        },
        {
          id: 'tl-7-3',
          timestamp: new Date(weekAgo.getTime() + 60 * 60 * 1000).toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi In Progress - Sedang update driver scanner',
        },
        {
          id: 'tl-7-4',
          timestamp: threeDaysAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi Resolved - Driver scanner sudah diupdate, scanner berfungsi normal',
        },
        {
          id: 'tl-7-5',
          timestamp: threeDaysAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-6',
          details: 'Status diubah menjadi Closed - User mengkonfirmasi perbaikan selesai',
        },
      ],
      createdAt: weekAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString(),
    },
    // Zoom Meeting - Pending Approval
    {
      id: 'ticket-8',
      ticketNumber: 'ZM834567',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'Rapat Koordinasi Sensus Pertanian 2025',
      description: 'Koordinasi persiapan pelaksanaan Sensus Pertanian 2025 dengan seluruh Kabupaten/Kota se-NTB',
      type: 'zoom_meeting',
      status: 'menunggu_review',
      priority: 'mendesak',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data: {
        meetingDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        estimatedParticipants: 50,
        coHostName: 'Ahmad Rizki',
        breakoutRooms: 5,
      },
      timeline: [
        {
          id: 'tl-8-1',
          timestamp: now.toISOString(),
          action: 'CREATED',
          actor: 'Joko Susilo',
          details: 'Booking Zoom dibuat',
        },
      ],
    },
    // Zoom Meeting - Approved
    {
      id: 'ticket-11',
      ticketNumber: 'ZM789123',
      userId: 'user-6',
      userName: 'Dewi Lestari',
      userEmail: 'user1@bps-ntb.go.id',
      userPhone: '081234567895',
      unitKerja: 'Statistik Produksi',
      title: 'Workshop Analisis Data SPSS',
      description: 'Pelatihan penggunaan SPSS untuk analisis data statistik bagi pegawai BPS NTB',
      type: 'zoom_meeting',
      status: 'approved',
      priority: 'normal',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      data: {
        meetingDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '16:00',
        estimatedParticipants: 30,
        coHostName: 'Siti Nurhaliza',
        breakoutRooms: 3,
        meetingLink: 'https://zoom.us/j/987654321',
        meetingId: '987654321',
        passcode: 'SPSS2025',
        zoomAccount: 'zoom1',
      },
      timeline: [
        {
          id: 'tl-11-1',
          timestamp: yesterday.toISOString(),
          action: 'CREATED',
          actor: 'Dewi Lestari',
          details: 'Booking Zoom dibuat',
        },
        {
          id: 'tl-11-2',
          timestamp: yesterday.toISOString(),
          action: 'APPROVED',
          actor: 'Siti Nurhaliza',
          details: 'Booking disetujui. Link Meeting: https://zoom.us/j/987654321',
        },
      ],
    },
    // Zoom Meeting - Rejected
    {
      id: 'ticket-12',
      ticketNumber: 'ZM456789',
      userId: 'user-8',
      userName: 'Maya Sari',
      userEmail: 'user3@bps-ntb.go.id',
      userPhone: '081234567897',
      unitKerja: 'Statistik Sosial',
      title: 'Rapat Tim Internal Mingguan',
      description: 'Rapat koordinasi tim mingguan untuk evaluasi progress kerja',
      type: 'zoom_meeting',
      status: 'ditolak',
      priority: 'normal',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      data: {
        meetingDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '15:00',
        estimatedParticipants: 8,
        coHostName: 'Joko Susilo',
        breakoutRooms: 0,
        rejectionReason: 'Jadwal bentrok dengan kegiatan penting lainnya. Mohon reschedule ke minggu depan.',
      },
      timeline: [
        {
          id: 'tl-12-1',
          timestamp: twoDaysAgo.toISOString(),
          action: 'CREATED',
          actor: 'Maya Sari',
          details: 'Booking Zoom dibuat',
        },
        {
          id: 'tl-12-2',
          timestamp: yesterday.toISOString(),
          action: 'REJECTED',
          actor: 'Siti Nurhaliza',
          details: 'Booking ditolak. Alasan: Jadwal bentrok dengan kegiatan penting lainnya. Mohon reschedule ke minggu depan.',
        },
      ],
    },
    // Zoom Meeting - Pending (untuk hari ini)
    {
      id: 'ticket-13',
      ticketNumber: 'ZM234567',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'Konsultasi Data Ekspor-Impor',
      description: 'Konsultasi terkait pengolahan dan validasi data ekspor-impor NTB bulan Desember 2024',
      type: 'zoom_meeting',
      status: 'menunggu_review',
      priority: 'mendesak',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data: {
        meetingDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        estimatedParticipants: 15,
        coHostName: 'Ahmad Yani',
        breakoutRooms: 0,
      },
      timeline: [
        {
          id: 'tl-13-1',
          timestamp: now.toISOString(),
          action: 'CREATED',
          actor: 'Joko Susilo',
          details: 'Booking Zoom dibuat',
        },
      ],
    },
    // Zoom Meeting - Approved (untuk besok)
    {
      id: 'ticket-14',
      ticketNumber: 'ZM123456',
      userId: 'user-6',
      userName: 'Dewi Lestari',
      userEmail: 'user1@bps-ntb.go.id',
      userPhone: '081234567895',
      unitKerja: 'Statistik Produksi',
      title: 'Sosialisasi Form Digital Sensus',
      description: 'Sosialisasi penggunaan form digital untuk kegiatan sensus pertanian',
      type: 'zoom_meeting',
      status: 'approved',
      priority: 'mendesak',
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
      data: {
        meetingDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '10:00',
        estimatedParticipants: 40,
        coHostName: 'Budi Santoso',
        breakoutRooms: 4,
        meetingLink: 'https://zoom.us/j/456789123',
        meetingId: '456789123',
        passcode: 'SENS2025',
        zoomAccount: 'zoom2',
      },
      timeline: [
        {
          id: 'tl-14-1',
          timestamp: yesterday.toISOString(),
          action: 'CREATED',
          actor: 'Dewi Lestari',
          details: 'Booking Zoom dibuat',
        },
        {
          id: 'tl-14-2',
          timestamp: now.toISOString(),
          action: 'APPROVED',
          actor: 'Siti Nurhaliza',
          details: 'Booking disetujui. Link Meeting: https://zoom.us/j/456789123',
        },
      ],
    },
    // Perbaikan - On Hold (Menunggu Work Order Sparepart)
    {
      id: 'ticket-9',
      ticketNumber: 'TKT-PR-20251179-4512',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'Printer Canon Error 50.4 - Butuh Sparepart',
      description: 'Printer membutuhkan penggantian fuser unit',
      type: 'perbaikan',
      categoryId: 'cat-3',
      status: 'on_hold',
      priority: 'P2',
      assetCode: 'PRT-2022-0089',
      assetNUP: '12345678-20220089',
      assetLocation: 'Ruang Statistik Distribusi Lt. 3',
      finalProblemType: 'hardware',
      data: {
        itemName: 'Printer Canon imageRUNNER 2525',
        issueDescription: 'Printer error code 50.4, fuser unit rusak',
      },
      assignedTo: 'user-5',
      workOrderId: 'wo-001',
      attachments: [],
      timeline: [
        {
          id: 'tl-9-1',
          timestamp: threeDaysAgo.toISOString(),
          action: 'CREATED',
          actor: 'user-7',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-9-2',
          timestamp: threeDaysAgo.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Rudi Hartono',
        },
        {
          id: 'tl-9-3',
          timestamp: twoDaysAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi In Progress - Teknisi melakukan diagnosa',
        },
        {
          id: 'tl-9-4',
          timestamp: yesterday.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi On Hold - Menunggu sparepart dari Work Order',
        },
      ],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    // Perbaikan - Waiting for User (Menunggu Konfirmasi User)
    {
      id: 'ticket-10',
      ticketNumber: 'TKT-PR-20251180-5621',
      userId: 'user-8',
      userName: 'Maya Sari',
      userEmail: 'user3@bps-ntb.go.id',
      userPhone: '081234567897',
      unitKerja: 'Statistik Sosial',
      title: 'Keyboard dan Mouse Tidak Berfungsi',
      description: 'Keyboard dan mouse tiba-tiba tidak terdeteksi',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'waiting_for_user',
      priority: 'P3',
      assetCode: 'PC-2022-0156',
      assetNUP: '12345678-20220156',
      assetLocation: 'Ruang Statistik Sosial Lt. 2',
      finalProblemType: 'hardware',
      repairable: true,
      data: {
        itemName: 'PC Desktop HP ProDesk 400',
        issueDescription: 'Keyboard dan mouse USB tidak terdeteksi, sudah ganti port tetap sama',
      },
      assignedTo: 'user-4',
      attachments: [],
      timeline: [
        {
          id: 'tl-10-1',
          timestamp: yesterday.toISOString(),
          action: 'CREATED',
          actor: 'user-8',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-10-2',
          timestamp: yesterday.toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Andi Wijaya',
        },
        {
          id: 'tl-10-3',
          timestamp: now.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-4',
          details: 'Status diubah menjadi Waiting for User - Perbaikan selesai, menunggu konfirmasi user',
        },
      ],
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Perbaikan - Closed Unrepairable (Tidak Dapat Diperbaiki)
    {
      id: 'ticket-15',
      ticketNumber: 'TKT-PR-20251175-8934',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'laptop rusak parah',
      description: 'Laptop terkena air dan tidak bisa menyala sama sekali',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'closed_unrepairable',
      priority: 'P2',
      assetCode: 'LAP-2020-0089',
      assetNUP: '12345678-20200089',
      assetLocation: 'Ruang Statistik Distribusi Lt. 3',
      finalProblemType: 'hardware',
      repairable: false,
      unrepairableReason: 'Motherboard dan komponen internal lainnya rusak total karena terkena air. Biaya perbaikan lebih mahal dari harga laptop baru. Disarankan untuk penggantian unit baru.',
      data: {
        itemName: 'Laptop Asus VivoBook 14',
        issueDescription: 'Laptop terkena tumpahan air kopi, tidak bisa menyala, sudah dicoba dihidupkan setelah 3 hari tetap tidak bisa',
      },
      assignedTo: 'user-5',
      attachments: [],
      timeline: [
        {
          id: 'tl-15-1',
          timestamp: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'CREATED',
          actor: 'user-7',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-15-2',
          timestamp: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'ASSIGNED',
          actor: 'user-2',
          details: 'Tiket ditugaskan ke teknisi Rudi Hartono',
        },
        {
          id: 'tl-15-3',
          timestamp: weekAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi In Progress - Teknisi melakukan diagnosa menyeluruh',
        },
        {
          id: 'tl-15-4',
          timestamp: threeDaysAgo.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'user-5',
          details: 'Status diubah menjadi Closed Unrepairable - Motherboard rusak total, tidak ekonomis untuk diperbaiki',
        },
      ],
      createdAt: new Date(weekAgo.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: threeDaysAgo.toISOString(),
    },
    // Perbaikan - Approved (Disetujui, Siap untuk di-assign)
    {
      id: 'ticket-16',
      ticketNumber: 'TKT-PR-20251188-1122',
      userId: 'user-7',
      userName: 'Joko Susilo',
      userEmail: 'user2@bps-ntb.go.id',
      userPhone: '081234567896',
      unitKerja: 'Statistik Distribusi',
      title: 'Keyboard Laptop Rusak Beberapa Tombol',
      description: 'Keyboard laptop rusak, beberapa tombol tidak berfungsi (huruf A, S, D tidak bisa ditekan)',
      type: 'perbaikan',
      categoryId: 'cat-2',
      status: 'disetujui',
      priority: 'P2',
      assetCode: 'LAP-2023-0187',
      assetNUP: '12345678-20230187',
      assetLocation: 'Ruang Statistik Distribusi Lt. 3',
      data: {
        itemName: 'Laptop HP EliteBook 840',
        issueDescription: 'Keyboard rusak, tombol A S D tidak berfungsi. Sudah dicoba restart tetap sama.',
      },
      attachments: [],
      timeline: [
        {
          id: 'tl-16-1',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          action: 'CREATED',
          actor: 'user-7',
          details: 'Tiket perbaikan dibuat',
        },
        {
          id: 'tl-16-2',
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
          action: 'APPROVED',
          actor: 'user-2',
          details: 'Tiket disetujui oleh Admin Layanan',
        },
      ],
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    // Perbaikan - Assigned (Ditugaskan ke Teknisi)
    // Add completed tickets for Kartu Kendali
    ...getCompletedTicketsDemo(),
  ];
};

// Demo Inventory
export const getDemoInventory = (): InventoryItem[] => {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'inv-1',
      name: 'Kertas HVS A4 80gsm',
      category: 'Alat Tulis Kantor',
      stock: 45,
      quantity: 45,
      minimumStock: 50,
      minStock: 50,
      unitPrice: 45000,
      location: 'Gudang Lantai 1',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-2',
      name: 'Pulpen Hitam Standard',
      category: 'Alat Tulis Kantor',
      stock: 200,
      quantity: 200,
      minimumStock: 100,
      minStock: 100,
      unitPrice: 2500,
      location: 'Gudang Lantai 1',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-3',
      name: 'Toner HP CE285A (85A)',
      category: 'Consumable Printer',
      stock: 3,
      quantity: 3,
      minimumStock: 10,
      minStock: 10,
      unitPrice: 350000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-4',
      name: 'RAM DDR4 8GB',
      category: 'Sparepart Komputer',
      stock: 0,
      quantity: 0,
      minimumStock: 5,
      minStock: 5,
      unitPrice: 500000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-5',
      name: 'SSD SATA 512GB',
      category: 'Sparepart Komputer',
      stock: 2,
      quantity: 2,
      minimumStock: 5,
      minStock: 5,
      unitPrice: 750000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-6',
      name: 'Mouse Wireless Logitech',
      category: 'Perangkat Komputer',
      stock: 15,
      quantity: 15,
      minimumStock: 10,
      minStock: 10,
      unitPrice: 125000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-7',
      name: 'Keyboard USB Standard',
      category: 'Perangkat Komputer',
      stock: 12,
      quantity: 12,
      minimumStock: 10,
      minStock: 10,
      unitPrice: 85000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inv-8',
      name: 'Fuser Unit Canon iR2525',
      category: 'Sparepart Printer',
      stock: 1,
      quantity: 1,
      minimumStock: 2,
      minStock: 2,
      unitPrice: 2500000,
      location: 'Gudang IT Lantai 2',
      condition: 'baru' as const,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

// Demo Zoom Bookings
export const getDemoZoomBookings = (): ZoomBooking[] => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: 'zoom-1',
      ticketNumber: 'TKT-ZM-20250111-0001',
      userId: 'user-7',
      title: 'Rapat Koordinasi Sensus Pertanian 2025',
      description: 'Koordinasi persiapan pelaksanaan Sensus Pertanian 2025',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '12:00',
      duration: 180,
      estimatedParticipants: 50,
      coHosts: [],
      breakoutRooms: 0,
      category: 'Rapat Koordinasi',
      unitKerja: 'Statistik Distribusi',
      status: 'pending_approval',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'zoom-2',
      ticketNumber: 'TKT-ZM-20250110-0001',
      userId: 'user-8',
      title: 'Workshop SPBE BPS NTB',
      description: 'Pelatihan Sistem Pemerintahan Berbasis Elektronik',
      date: nextWeek.toISOString().split('T')[0],
      startTime: '13:00',
      endTime: '16:00',
      duration: 180,
      estimatedParticipants: 30,
      coHosts: [{ name: 'Ahmad Yani', email: 'superadmin@bps-ntb.go.id' }],
      breakoutRooms: 3,
      category: 'Workshop/Pelatihan',
      unitKerja: 'Statistik Sosial',
      status: 'approved',
      meetingLink: 'https://zoom.us/j/1234567890',
      meetingId: '1234567890',
      passcode: 'bpsntb2025',
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
};

// Demo Sparepart Requests
export const getDemoSparepartRequests = (): SparepartRequest[] => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  return [
    // Request 1: Pending - waiting for Admin Penyedia approval
    {
      id: 'spr-001',
      ticketId: 'ticket-6',
      items: [
        {
          name: 'Hard Disk SATA 500GB',
          quantity: 1,
          estimatedPrice: 750000,
          notes: 'Untuk laptop rusak tidak bisa booting',
        },
        {
          name: 'RAM DDR3 8GB',
          quantity: 1,
          estimatedPrice: 500000,
          notes: 'Upgrade RAM sekaligus',
        },
      ],
      status: 'pending',
      requestedBy: 'user-4', // Teknisi Andi
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      timeline: [
        {
          id: 'spr-001-tl-1',
          timestamp: yesterday.toISOString(),
          action: 'CREATED',
          actor: 'Andi Wijaya',
          details: 'Request sparepart dibuat untuk perbaikan laptop',
        },
      ],
    },
    // Request 2: Approved and in procurement
    {
      id: 'spr-002',
      ticketId: 'ticket-4',
      items: [
        {
          name: 'Baterai CMOS CR2032',
          quantity: 2,
          estimatedPrice: 15000,
          notes: 'Baterai CMOS lemah',
        },
        {
          name: 'Thermal Paste',
          quantity: 1,
          estimatedPrice: 50000,
          notes: 'Untuk perbaikan cooling',
        },
      ],
      status: 'in_procurement',
      requestedBy: 'user-4', // Teknisi Andi
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      estimatedDeliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          id: 'spr-002-tl-1',
          timestamp: twoDaysAgo.toISOString(),
          action: 'CREATED',
          actor: 'Andi Wijaya',
          details: 'Request sparepart dibuat',
        },
        {
          id: 'spr-002-tl-2',
          timestamp: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          action: 'APPROVED',
          actor: 'Budi Santoso',
          details: 'Request sparepart disetujui oleh Admin Penyedia',
        },
        {
          id: 'spr-002-tl-3',
          timestamp: yesterday.toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'Budi Santoso',
          details: 'Status diupdate ke Dalam Pengadaan: Sparepart sudah dipesan dari supplier (Estimasi: ' + new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID') + ')',
        },
      ],
    },
    // Request 3: Ready for pickup
    {
      id: 'spr-003',
      ticketId: 'ticket-5',
      items: [
        {
          name: 'Kabel VGA 1.5m',
          quantity: 1,
          estimatedPrice: 35000,
          notes: 'Kabel rusak putus',
        },
      ],
      status: 'ready',
      requestedBy: 'user-5', // Teknisi Rudi
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          id: 'spr-003-tl-1',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'CREATED',
          actor: 'Rudi Hartono',
          details: 'Request sparepart dibuat',
        },
        {
          id: 'spr-003-tl-2',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'APPROVED',
          actor: 'Budi Santoso',
          details: 'Request sparepart disetujui oleh Admin Penyedia',
        },
        {
          id: 'spr-003-tl-3',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'Budi Santoso',
          details: 'Status diupdate ke Dalam Pengadaan',
        },
        {
          id: 'spr-003-tl-4',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'STATUS_UPDATED',
          actor: 'Budi Santoso',
          details: 'Status diupdate ke Siap Diambil/Dikirim: Sparepart sudah tersedia di gudang',
        },
        {
          id: 'spr-003-tl-5',
          timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          action: 'COMMENT',
          actor: 'Budi Santoso',
          details: 'Sparepart sudah bisa diambil di ruang gudang bagian pengadaan.',
        },
      ],
    },
  ];
};

// Demo Audit Logs
export const getDemoAuditLogs = (): AuditLog[] => {
  const now = new Date();
  const logs: AuditLog[] = [];
  
  // Generate some recent logs
  logs.push({
    id: 'log-1',
    userId: 'user-2',
    action: 'APPROVE_TICKET',
    details: 'Menyetujui tiket TKT-2025-003',
    timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
  });
  
  logs.push({
    id: 'log-2',
    userId: 'user-4',
    action: 'UPDATE_TICKET',
    details: 'Update status tiket TKT-2025-006 ke dalam_perbaikan',
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  });
  
  logs.push({
    id: 'log-3',
    userId: 'user-6',
    action: 'CREATE_TICKET',
    details: 'Membuat tiket baru TKT-2025-001',
    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  });
  
  logs.push({
    id: 'log-4',
    userId: 'user-3',
    action: 'UPDATE_INVENTORY',
    details: 'Update stok Kertas HVS A4 80gsm',
    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
  });
  
  logs.push({
    id: 'log-5',
    userId: 'user-5',
    action: 'COMPLETE_REPAIR',
    details: 'Menyelesaikan perbaikan tiket TKT-2025-007',
    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  });
  
  return logs;
};

// Demo Notifications
export const getDemoNotifications = (): Notification[] => {
  const now = new Date();
  
  return [
    // Notifications for user-6 (Dewi Lestari)
    {
      id: 'notif-1',
      userId: 'user-6',
      title: 'Tiket Ditugaskan ke Teknisi',
      message: 'Tiket TKT-2025-004 (Laptop Tidak Bisa Booting) telah ditugaskan ke teknisi Andi Wijaya',
      type: 'info',
      read: false,
      createdAt: now.toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-6',
      title: 'Perbaikan Selesai',
      message: 'Tiket TKT-2025-007 (Scanner Tidak Terdeteksi) telah selesai diperbaiki. Silakan berikan rating.',
      type: 'success',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Notifications for user-2 (Admin Layanan)
    {
      id: 'notif-3',
      userId: 'user-2',
      title: 'Tiket Baru Menunggu Review',
      message: 'Tiket TKT-2025-001 (Permintaan Alat Tulis Kantor) menunggu review Anda',
      type: 'warning',
      read: false,
      createdAt: now.toISOString(),
    },
    {
      id: 'notif-4',
      userId: 'user-2',
      title: 'Tiket Mendesak',
      message: 'Tiket TKT-2025-002 (Permintaan Kertas A4) sangat mendesak dan perlu segera ditinjau',
      type: 'error',
      read: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    // Notifications for user-3 (Admin Penyedia)
    {
      id: 'notif-5',
      userId: 'user-3',
      title: 'Permintaan Perlu Verifikasi',
      message: 'Tiket TKT-2025-003 (Permintaan Toner Printer) menunggu verifikasi ketersediaan barang',
      type: 'warning',
      read: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-6',
      userId: 'user-3',
      title: 'Stok Rendah',
      message: 'Item Toner HP CE285A stok tinggal 3, segera lakukan restock',
      type: 'warning',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    // Notifications for user-4 (Teknisi Andi)
    {
      id: 'notif-7',
      userId: 'user-4',
      title: 'Tiket Baru Ditugaskan',
      message: 'Anda mendapat tugas baru TKT-2025-004 (Laptop Tidak Bisa Booting) - Sangat Mendesak',
      type: 'error',
      read: false,
      createdAt: now.toISOString(),
    },
    {
      id: 'notif-8',
      userId: 'user-4',
      title: 'Sparepart Request Disetujui',
      message: 'Request sparepart untuk tiket TKT-2025-006 telah disetujui',
      type: 'success',
      read: false,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
  ];
};

// Demo Work Orders
export const getDemoWorkOrders = (): WorkOrder[] => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  return [
    // Work Order 1: Sparepart - Requested (Baru dibuat)
    {
      id: 'wo-001',
      ticketId: 'ticket-9',
      type: 'sparepart',
      status: 'requested',
      createdBy: 'user-5',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      spareparts: [
        {
          name: 'Fuser Unit Canon iR2525',
          qty: 1,
          unit: 'unit',
          remarks: 'Fuser unit rusak, kode error 50.4',
        },
      ],
      timeline: [
        {
          id: 'wo-001-tl-1',
          timestamp: yesterday.toISOString(),
          action: 'WORK_ORDER_CREATED',
          actor: 'Rudi Hartono',
          details: 'Work Order sparepart dibuat untuk fuser unit printer Canon',
        },
      ],
    },
    // Work Order 2: Vendor - In Procurement
    {
      id: 'wo-002',
      ticketId: 'ticket-9',
      type: 'vendor',
      status: 'in_procurement',
      createdBy: 'user-5',
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: yesterday.toISOString(),
      vendorInfo: {
        name: 'CV Mitra Teknologi',
        contact: '081234567777',
        description: 'Perbaikan motherboard laptop yang rusak karena korsleting',
      },
      timeline: [
        {
          id: 'wo-002-tl-1',
          timestamp: twoDaysAgo.toISOString(),
          action: 'WORK_ORDER_CREATED',
          actor: 'Rudi Hartono',
          details: 'Work Order vendor dibuat untuk perbaikan motherboard',
        },
        {
          id: 'wo-002-tl-2',
          timestamp: yesterday.toISOString(),
          action: 'STATUS_CHANGED_IN_PROCUREMENT',
          actor: 'Budi Santoso',
          details: 'Status diubah menjadi In Procurement - Sedang koordinasi dengan vendor',
        },
      ],
    },
    // Work Order 3: Sparepart - Delivered (Sudah diterima)
    {
      id: 'wo-003',
      ticketId: 'ticket-5',
      type: 'sparepart',
      status: 'delivered',
      createdBy: 'user-5',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: yesterday.toISOString(),
      spareparts: [
        {
          name: 'Toner Canon NPG-67',
          qty: 2,
          unit: 'pcs',
          remarks: 'Toner hitam untuk printer Canon',
        },
        {
          name: 'Drum Unit Canon',
          qty: 1,
          unit: 'unit',
          remarks: 'Drum unit sudah aus',
        },
      ],
      receivedQty: 3,
      receivedRemarks: 'Semua sparepart diterima dalam kondisi baik',
      timeline: [
        {
          id: 'wo-003-tl-1',
          timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'WORK_ORDER_CREATED',
          actor: 'Rudi Hartono',
          details: 'Work Order sparepart dibuat untuk toner dan drum unit',
        },
        {
          id: 'wo-003-tl-2',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'STATUS_CHANGED_IN_PROCUREMENT',
          actor: 'Budi Santoso',
          details: 'Status diubah menjadi In Procurement',
        },
        {
          id: 'wo-003-tl-3',
          timestamp: yesterday.toISOString(),
          action: 'STATUS_CHANGED_DELIVERED',
          actor: 'Budi Santoso',
          details: 'Sparepart diterima. Qty: 3. Semua sparepart diterima dalam kondisi baik',
        },
      ],
    },
    // Add completed work orders for Kartu Kendali
    ...getCompletedWorkOrdersDemo(),
  ];
};

// Function to seed all demo data
export const seedDemoData = () => {
  localStorage.setItem('bps_ntb_users', JSON.stringify(getDemoUsers()));
  localStorage.setItem('bps_ntb_categories', JSON.stringify(getDemoCategories()));
  localStorage.setItem('bps_ntb_tickets', JSON.stringify(getDemoTickets()));
  localStorage.setItem('bps_ntb_inventory', JSON.stringify(getDemoInventory()));
  localStorage.setItem('bps_ntb_sparepart_requests', JSON.stringify(getDemoSparepartRequests()));
  localStorage.setItem('bps_ntb_zoom_bookings', JSON.stringify(getDemoZoomBookings()));
  localStorage.setItem('bps_ntb_audit_logs', JSON.stringify(getDemoAuditLogs()));
  localStorage.setItem('bps_ntb_notifications', JSON.stringify(getDemoNotifications()));
  localStorage.setItem('bps_ntb_reset_tokens', JSON.stringify({}));
  localStorage.setItem('bps_ntb_work_orders', JSON.stringify(getDemoWorkOrders()));
};