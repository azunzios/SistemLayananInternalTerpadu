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
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #0066cc;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 20px;
            color: #555;
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
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .reset-button:hover {
            background-color: #0052a3;
        }
        .alternative-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
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
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-text {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        .expiry-info {
            background-color: #e7f3ff;
            border-left: 4px solid #0066cc;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .expiry-text {
            color: #004085;
            font-size: 13px;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SIGAP-TI</div>
            <div class="subtitle">Sistem Layanan Internal Terpadu<br>BPS Provinsi NTB</div>
        </div>

        <div class="content">
            <div class="greeting">Halo, {{ $user->name }}</div>
            
            <div class="message">
                <p>Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda.</p>
                <p>Klik tombol di bawah ini untuk mereset password Anda:</p>
            </div>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="reset-button">Reset Password</a>
            </div>

            <div class="expiry-info">
                <p class="expiry-text">
                    <strong>⏰ Perhatian:</strong> Link reset password ini akan <strong>kadaluarsa dalam 1 jam</strong> setelah email ini dikirim.
                </p>
            </div>

            <div class="alternative-link">
                <p class="alternative-text">Jika tombol di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
                <p class="link-text">{{ $resetUrl }}</p>
            </div>

            <div class="warning">
                <p class="warning-text">
                    <strong>⚠️ Penting:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman dan tidak ada perubahan yang akan dilakukan.
                </p>
            </div>
        </div>

        <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem SIGAPTI.</p>
            <p>Mohon tidak membalas email ini.</p>
            <p>&copy; {{ date('Y') }} BPS Provinsi Nusa Tenggara Barat</p>
        </div>
    </div>
</body>
</html>
