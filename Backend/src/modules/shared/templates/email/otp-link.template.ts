export const getOtpEmailTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
        .header { background: #000000; padding: 32px; text-align: center; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 48px 40px; text-align: center; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #111827; }
        p { color: #4b5563; margin-bottom: 32px; font-size: 16px; }
        .otp-container { background: #f3f4f6; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 32px; border: 1px solid #e5e7eb; }
        .otp-code { font-family: 'Monaco', monospace; font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: 8px; margin: 0; }
        .footer { padding: 32px; text-align: center; background: #f9fafb; border-top: 1px solid #f0f0f0; }
        .footer-text { font-size: 12px; color: #9ca3af; margin: 0; }
        .highlight { color: #2563eb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CLUAIZ</div>
        </div>
        <div class="content">
            <h1>Link Secondary Account</h1>
            <p>Use the verification code below to securely link your secondary email address to your <span class="highlight">Cluaiz Business Profile</span>.</p>
            <div class="otp-container">
                <div class="otp-code">${otp}</div>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p class="footer-text">&copy; ${new Date().getFullYear()} Cluaiz Inc. All rights reserved.</p>
            <p class="footer-text">Building the future of AI-driven business intelligence.</p>
        </div>
    </div>
</body>
</html>
`;
