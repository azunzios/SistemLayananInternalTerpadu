<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 20px;
        }
        .notification-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .badge-info { background-color: #e3f2fd; color: #1976d2; }
        .badge-success { background-color: #e8f5e9; color: #388e3c; }
        .badge-warning { background-color: #fff3e0; color: #f57c00; }
        .badge-error { background-color: #ffebee; color: #d32f2f; }
        .notification-title {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 15px 0;
        }
        .notification-message {
            font-size: 16px;
            color: #555;
            margin: 0 0 25px 0;
            line-height: 1.8;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e0e0e0, transparent);
            margin: 25px 0;
        }
        .ticket-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #2196F3;
        }
        .ticket-info-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 15px 0;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table tr {
            border-bottom: 1px solid #e0e0e0;
        }
        .info-table tr:last-child {
            border-bottom: none;
        }
        .info-table td {
            padding: 10px 5px;
            font-size: 14px;
        }
        .info-table td.label {
            color: #666;
            width: 35%;
            font-weight: 500;
        }
        .info-table td.value {
            color: #1a1a1a;
            font-weight: 400;
        }
        .priority-badge, .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-low { background-color: #e3f2fd; color: #1976d2; }
        .priority-normal { background-color: #fff3e0; color: #f57c00; }
        .priority-high { background-color: #ffebee; color: #d32f2f; }
        .status-open { background-color: #e3f2fd; color: #1976d2; }
        .status-assigned { background-color: #e1f5fe; color: #0288d1; }
        .status-in-progress { background-color: #fff3e0; color: #f57c00; }
        .status-pending-diagnosis { background-color: #fce4ec; color: #c2185b; }
        .status-on-hold { background-color: #f3e5f5; color: #7b1fa2; }
        .status-waiting-for-submitter { background-color: #fff9c4; color: #f57f17; }
        .status-waiting-for-parts { background-color: #ffecb3; color: #ff6f00; }
        .status-resolved { background-color: #e8f5e9; color: #388e3c; }
        .status-closed { background-color: #f1f8e9; color: #689f38; }
        .status-approved { background-color: #e8f5e9; color: #388e3c; }
        .status-rejected { background-color: #ffebee; color: #d32f2f; }
        .description-text {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SIGAP-TI BPS NTB</h1>
            <p>Sistem Layanan Internal Terpadu BPS Provinsi Nusa Tenggara Barat</p>
        </div>
        
        <div class="content">
            <span class="notification-badge badge-{{ $notification->type }}">
                {{ strtoupper($notification->type) }}
            </span>
            
            <h2 class="notification-title">{{ $notification->title }}</h2>
            
            <p class="notification-message">
                Halo <strong>{{ $user->name }}</strong>,<br><br>
                {{ $notification->message }}
            </p>

            @if($ticket)
            <div class="ticket-info">
                <h3 class="ticket-info-title">Informasi Tiket</h3>
                
                <table class="info-table">
                    <tr>
                        <td class="label">Nomor Tiket:</td>
                        <td class="value"><strong>{{ $ticket->ticket_number }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Judul:</td>
                        <td class="value">{{ $ticket->title }}</td>
                    </tr>
                    @if($ticket->type === 'perbaikan')
                    <tr>
                        <td class="label">Prioritas:</td>
                        <td class="value">
                            <span class="priority-badge priority-{{ $ticket->severity }}">
                                {{ strtoupper($ticket->severity) }}
                            </span>
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td class="label">Status:</td>
                        <td class="value">
                            <span class="status-badge status-{{ str_replace('_', '-', $ticket->status) }}">
                                {{ ucwords(str_replace('_', ' ', $ticket->status)) }}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Dibuat:</td>
                        <td class="value">{{ $ticket->created_at->format('d/m/Y H:i') }} WIB</td>
                    </tr>
                    @if($ticket->user)
                    <tr>
                        <td class="label">Pelapor:</td>
                        <td class="value">{{ $ticket->user->name }}</td>
                    </tr>
                    @endif
                    @if($ticket->assignedUser)
                    <tr>
                        <td class="label">Teknisi:</td>
                        <td class="value">{{ $ticket->assignedUser->name }}</td>
                    </tr>
                    @endif
                </table>

                @if($ticket->type === 'perbaikan' && $asset)
                <h3 class="ticket-info-title" style="margin-top: 20px;">Informasi Barang</h3>
                <table class="info-table">
                    <tr>
                        <td class="label">Kode Barang:</td>
                        <td class="value">{{ $asset->kode_barang }}</td>
                    </tr>
                    <tr>
                        <td class="label">NUP:</td>
                        <td class="value">{{ $asset->nup }}</td>
                    </tr>
                    <tr>
                        <td class="label">Nama Barang:</td>
                        <td class="value">{{ $asset->nama_barang }}</td>
                    </tr>
                    @if($asset->merek)
                    <tr>
                        <td class="label">Merek/Tipe:</td>
                        <td class="value">{{ $asset->merek }}</td>
                    </tr>
                    @endif
                    @if($asset->ruangan)
                    <tr>
                        <td class="label">Lokasi:</td>
                        <td class="value">{{ $asset->ruangan }}</td>
                    </tr>
                    @endif
                </table>
                @endif

                @if($ticket->description)
                <h3 class="ticket-info-title" style="margin-top: 20px;">Deskripsi</h3>
                <p class="description-text">{{ $ticket->description }}</p>
                @endif
            </div>
            @endif
            
            @if($actionUrl)
            <a href="{{ $actionUrl }}" class="btn">Lihat Detail</a>
            @endif
            
            <div class="divider"></div>
            
            <p style="font-size: 12px; color: #999; margin: 0;">
                Notifikasi diterima pada {{ $notification->created_at->format('d/m/Y H:i') }} WIB
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Badan Pusat Statistik Provinsi NTB</strong></p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
            <p>Jika ada pertanyaan, silakan hubungi tim IT BPS NTB.</p>
            <p style="margin-top: 15px;">
                <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}">Buka Aplikasi</a>
            </p>
        </div>
    </div>
</body>
</html>
