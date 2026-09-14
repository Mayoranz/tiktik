<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Anda</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background-color: #0046d5;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .otp-box {
            background-color: #f8f9fa;
            border: 2px dashed #0046d5;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #0046d5;
            letter-spacing: 4px;
            margin: 0;
        }
        .warning-text {
            font-size: 14px;
            color: #e53e3e;
            font-weight: 600;
            margin-top: 32px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }
        .footer p {
            font-size: 13px;
            color: #777777;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
        </div>
        
        <div class="content">
            <p>Halo,</p>
            <p>Terima kasih telah menggunakan layanan kami. Berikut adalah kode verifikasi (OTP) Anda untuk melanjutkan proses:</p>
            
            <div class="otp-box">
                <p class="otp-code">{{ $otp_code }}</p>
            </div>
            
            <p style="font-size: 14px; color: #555;">Kode ini hanya berlaku selama <strong>5 menit</strong>.</p>
            
            <p class="warning-text">PENTING: Jangan bagikan kode ini kepada siapa pun, termasuk pihak admin.</p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Hak Cipta Dilindungi.</p>
        </div>
    </div>
</body>
</html>
