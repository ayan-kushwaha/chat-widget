import nodemailer from 'nodemailer';

type SenderIdentity = 'noreply' | 'sales';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    sender?: SenderIdentity;
}

export const sendEmail = async (to: string, subject: string, text: string, html?: string, sender: SenderIdentity = 'noreply') => {
    try {
        let user: string | undefined;
        let pass: string | undefined;
        let fromName: string;

        // Select Credentials based on Sender Identity
        if (sender === 'sales') {
            user = process.env.MAIL_SALES_USER;
            pass = process.env.MAIL_SALES_PASS;
            fromName = "Cluaiz Sales";
        } else {
            // Default to NoReply (System)
            user = process.env.MAIL_NOREPLY_USER;
            pass = process.env.MAIL_NOREPLY_PASS;
            fromName = "Cluaiz Team";
        }

        if (!user || !pass) {
            throw new Error(`❌ Credentials Missing for sender: ${sender}`);
        }

        // Clean password (remove spaces if any)
        const cleanPass = pass.replace(/\s+/g, '');

        // Create Transporter (Zoho SMTP)
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.in', // Using .in for India (safest bet based on location), or use .com
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: user,
                pass: cleanPass
            }
        });

        const mailOptions = {
            from: `"${fromName}" <${user}>`,
            to,
            subject,
            text,
            html,
        };

        console.log(`📧 Sending email from ${user} to: ${to}`);

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email Sent! Message ID: ${info.messageId}`);
        return info;

    } catch (error: any) {
        console.error('❌ Email Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error(`👉 Hint: Check App Password for ${sender} account.`);
        }
        throw error;
    }
};