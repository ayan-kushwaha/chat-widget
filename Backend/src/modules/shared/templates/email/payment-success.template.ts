import { baseEmailLayout } from "./base-layout.template.js";

export const getPaymentSuccessEmail = (orderId: string) => {
    const html = `
        <h2>Payment Successful! 🎉</h2>
        <p>Hi there,</p>
        <p>Thank you for choosing Cluaiz. We have successfully received your payment for <strong>Order #${orderId}</strong>.</p>
        <p>Your subscription is now active and ready to use. You can access all premium features immediately.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; color: #15803d;">
            <strong>Order ID:</strong> ${orderId}<br>
            <strong>Status:</strong> Paid ✅
        </div>

        <a href="https://cluaiz.com/dashboard/billing" class="btn">View Invoice</a>

        <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
        <br/>
        <p>Best Regards,<br><strong>Cluaiz Sales Team</strong></p>
    `;
    return baseEmailLayout(html, "Payment Receipt");
};
