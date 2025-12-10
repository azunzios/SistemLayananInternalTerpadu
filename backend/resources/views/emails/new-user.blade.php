<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akun Baru - SIGAP-TI</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 0;
            border: 2px solid #0066cc;
        }
        .header {
            background-color: #0066cc;
            color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #004d99;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 13px;
            line-height: 1.5;
            opacity: 0.95;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #0066cc;
        }
        .message {
            margin-bottom: 25px;
            color: #555;
            line-height: 1.7;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #dee2e6;
            padding: 20px;
            margin: 25px 0;
        }
        .credentials-title {
            font-size: 14px;
            font-weight: 600;
            color: #0066cc;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .credential-item {
            margin-bottom: 15px;
        }
        .credential-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .credential-value {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 10px;
            border: 1px solid #dee2e6;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .login-button {
            display: inline-block;
            padding: 14px 40px;
            background-color: #0066cc;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            border: 2px solid #0066cc;
            transition: all 0.3s;
        }
        .login-button:hover {
            background-color: #0052a3;
            border-color: #0052a3;
        }
        .instructions-box {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-left: 5px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
        }
        .instructions-title {
            font-size: 14px;
            font-weight: 600;
            color: #856404;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .instructions-list {
            margin: 0;
            padding-left: 20px;
            color: #856404;
        }
        .instructions-list li {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        .security-notice {
            background-color: #e7f3ff;
            border: 2px solid #0066cc;
            border-left: 5px solid #0066cc;
            padding: 20px;
            margin: 25px 0;
        }
        .security-title {
            font-size: 14px;
            font-weight: 600;
            color: #004085;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .security-text {
            color: #004085;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px;
            border-top: 3px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer p {
            margin: 5px 0;
        }
        .divider {
            height: 2px;
            background-color: #dee2e6;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SIGAP-TI</div>
            <div class="subtitle">
                Sistem Layanan Internal Terpadu<br>
                Badan Pusat Statistik Provinsi Nusa Tenggara Barat
            </div>
        </div>

        <div class="content">
            <div class="greeting">Halo, {{ $user->name }}</div>
            
            <div class="message">
                <p>Akun Anda telah berhasil dibuat di sistem SIGAP-TI BPS Provinsi NTB. Berikut adalah informasi login Anda:</p>
            </div>

            <div class="credentials-box">
                <div class="credentials-title">Informasi Akun</div>
                
                <div class="credential-item">
                    <div class="credential-label">Email</div>
                    <div class="credential-value">{{ $user->email }}</div>
                </div>

                <div class="credential-item">
                    <div class="credential-label">Password Default</div>
                    <div class="credential-value">{{ $plainPassword }}</div>
                </div>
            </div>

            <div class="button-container">
                <a href="{{ $loginUrl }}" class="login-button">LOGIN KE SISTEM</a>
            </div>

            <div class="divider"></div>

            <div class="instructions-box">
                <div class="instructions-title">Wajib Ganti Password</div>
                <div class="security-text">
                    <p style="margin-top: 0;">Untuk keamanan akun Anda, harap segera mengganti password default dengan mengikuti langkah berikut:</p>
                </div>
                <ol class="instructions-list">
                    <li>Login ke sistem menggunakan email dan password default di atas</li>
                    <li>Klik avatar/foto profil Anda di pojok kanan atas</li>
                    <li>Pilih menu "Profil Saya"</li>
                    <li>Klik tombol "Ubah Password"</li>
                    <li>Masukkan password baru yang kuat dan mudah diingat</li>
                </ol>
            </div>

            <div class="security-notice">
                <div class="security-title">Keamanan Akun</div>
                <p class="security-text">
                    Jangan bagikan password Anda kepada siapapun. Administrator tidak akan pernah meminta password Anda melalui email atau telepon. Pastikan Anda mengganti password default ini sesegera mungkin.
                </p>
            </div>

            <div class="message">
                <p style="margin-bottom: 0;">Jika Anda mengalami kendala dalam mengakses akun atau memiliki pertanyaan, silakan hubungi administrator sistem.</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>SIGAP-TI BPS Provinsi Nusa Tenggara Barat</strong></p>
            <p style="margin-top: 10px;">Email ini dikirim secara otomatis oleh sistem.</p>
            <p>Mohon tidak membalas email ini.</p>
            <p style="margin-top: 10px;">&copy; {{ date('Y') }} BPS Provinsi Nusa Tenggara Barat. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
