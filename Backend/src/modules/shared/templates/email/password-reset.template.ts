import { baseEmailLayout } from "./base-layout.template.js";

export const getPasswordResetEmail = (resetLink: string) => {
    const html = `
        <h2>Reset Your Password 🔒</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Cluaiz account. Click the button below to set a new password:</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="btn">Reset Password</a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="word-break: break-all;">${resetLink}</a>
        </p>

        <p style="margin-top: 20px; font-size: 13px; color: #94a3b8;">
            ⚠️ If you didn't ask for this, you can safely ignore this email. Your password will not be changed.
        </p>
        <br/>
        <p>Best,<br><strong>Cluaiz Security Team</strong></p>
    `;
    return baseEmailLayout(html, "Reset Password");
};
