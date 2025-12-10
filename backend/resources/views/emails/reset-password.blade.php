<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - SIGAP-TI</title>
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
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
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
        .reset-button:hover {
            background-color: #0052a3;
            border-color: #0052a3;
        }
        .alternative-link {
            background-color: #f8f9fa;
            border: 2px solid #dee2e6;
            padding: 20px;
            margin: 25px 0;
            word-break: break-all;
        }
        .alternative-text {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }
        .link-text {
            font-size: 12px;
            color: #0066cc;
        }
        .warning {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-left: 5px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
        }
        .warning-text {
            color: #856404;
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
        .expiry-info {
            background-color: #e7f3ff;
            border: 2px solid #0066cc;
            border-left: 5px solid #0066cc;
            padding: 20px;
            margin: 25px 0;
        }
        .expiry-text {
            color: #004085;
            font-size: 14px;
            margin: 0;
            line-height: 1.6;
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
                <p>Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda.</p>
                <p>Klik tombol di bawah ini untuk mereset password Anda:</p>
            </div>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="reset-button">RESET PASSWORD</a>
            </div>

            <div class="expiry-info">
                <p class="expiry-text">
                    <strong>PERHATIAN:</strong> Link reset password ini akan <strong>kadaluarsa dalam 1 jam</strong> setelah email ini dikirim.
                </p>
            </div>

            <div class="alternative-link">
                <p class="alternative-text">Jika tombol di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
                <p class="link-text">{{ $resetUrl }}</p>
            </div>

            <div class="warning">
                <p class="warning-text">
                    <strong>PENTING:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman dan tidak ada perubahan yang akan dilakukan.
                </p>
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
