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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            <h1>🔔 SIGAP-TI BPS NTB</h1>
            <p>Sistem Informasi Gangguan & Layanan Internal Terpadu</p>
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
