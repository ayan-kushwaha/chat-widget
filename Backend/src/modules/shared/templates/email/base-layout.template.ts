export const baseEmailLayout = (content: string, title: string = "Notification") => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 40px; margin-bottom: 40px; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #ffffff; text-decoration: none; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .btn:hover { background-color: #4338ca; }
        h1, h2, h3 { color: #1e293b; margin-top: 0; }
        strong { color: #0f172a; }
        a { color: #4f46e5; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <a href="https://cluaiz.com" class="logo">CLUAIZ</a>
        </div>

        <!-- Main Content -->
        <div class="content">
            ${content}
        </div>

        <!-- Footer -->
        <div class="footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; color: #888888; font-size: 12px;">
            <p>
                &copy; ${new Date().getFullYear()} <strong>Cluaiz Inc.</strong><br>
                123 Startup Hub, Tech Park, India.
            </p>
            <p>
                <a href="https://cluaiz.com/privacy" style="color: #888888; text-decoration: underline;">Privacy Policy</a> | 
                <a href="https://cluaiz.com/terms" style="color: #888888; text-decoration: underline;">Terms of Service</a>
            </p>
            <p>
                Don't want these emails? <a href="#" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
};
