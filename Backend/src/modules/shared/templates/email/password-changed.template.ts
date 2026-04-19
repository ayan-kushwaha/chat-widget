/**
 * 📧 Professional Email Template for Password Change Notification
 */
export const getPasswordChangedTemplate = (email: string) => `
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
        p { color: #4b5563; margin-bottom: 24px; font-size: 16px; }
        .security-badge { background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 24px; display: inline-block; }
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
            <div class="security-badge">Security Update</div>
            <h1>Password Changed</h1>
            <p>The password for your secondary linked account <span class="highlight">${email}</span> has been successfully updated.</p>
            <p style="font-size: 14px; color: #6b7280; padding: 20px; background: #f8fafc; border-radius: 8px;">
                If you did not perform this action, please contact our security team immediately at <a href="mailto:security@cluaiz.com" style="color: #2563eb; text-decoration: none;">security@cluaiz.com</a>
            </p>
        </div>
        <div class="footer">
            <p class="footer-text">&copy; ${new Date().getFullYear()} Cluaiz Inc. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
