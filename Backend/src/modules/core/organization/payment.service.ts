import Razorpay from 'razorpay';
import crypto from 'crypto';
import { GeoService } from '../../../services/geo.service';

export class PaymentService {
    private static razorpayInstance: Razorpay | null = null;

    private static getRazorpayClient(): Razorpay {
        if (this.razorpayInstance) return this.razorpayInstance;

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_SECRET;

        if (!keyId || keyId === 'mock' || !keySecret) {
            console.warn("⚠️ Razorpay Keys missing or in 'mock' mode. Using dummy client.");
            // We return a proxy or dummy to avoid constructor crash, 
            // but real calls will still fail gracefully in try-catch
            return new Razorpay({
                key_id: 'rzp_test_placeholder',
                key_secret: 'secret_placeholder'
            });
        }

        this.razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });
        return this.razorpayInstance;
    }

    /**
     * Verifies the Razorpay signature to prevent payment spoofing
     */
    static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        // Support Mock Payments for local testing
        if (orderId.startsWith('order_mock_')) {
            console.log("⚠️ MOCK MODE: Bypass signature verification for mock order.");
            return true;
        }

        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET || 'secret_placeholder')
            .update(body.toString())
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Fetches original payment details from Razorpay API
     * (Source of Truth for Amount and Currency)
     */
    static async getPaymentDetails(paymentId: string) {
        try {
            // Support Mock Payments (If keys missing or special pay_mock_ prefix used)
            const keyId = process.env.RAZORPAY_KEY_ID;
            if (paymentId.startsWith('pay_mock_') || !keyId || keyId === 'mock') {
                console.log("⚠️ MOCK MODE: Payment verification bypassed for internal testing.");
                // Return -1 to signal to the controller that this is a mock payment
                return {
                    amount: -1,
                    currency: 'INR',
                    status: 'captured',
                    method: 'card',
                    email: 'mock@cluaiz.com',
                    contact: '9999999999'
                };
            }

            const client = this.getRazorpayClient();
            const payment = await client.payments.fetch(paymentId);
            return {
                amount: (payment.amount as number) / 100, // Convert paisa to INR
                currency: payment.currency as string,
                status: payment.status as string,
                method: (payment as any).method,
                email: (payment as any).email,
                contact: (payment as any).contact,
                international: (payment as any).international,
                card_id: (payment as any).card_id,
                bank: (payment as any).bank,
                wallet: (payment as any).wallet,
                vpa: (payment as any).vpa
            };
        } catch (error: any) {
            console.error('❌ Razorpay Fetch Error:', error);
            throw new Error(`Razorpay Verification Failed: ${error.message}`);
        }
    }

    /**
     * Strict Price-to-Token Calculation Rules
     * (Matches pricing logic on frontend)
     */
    static calculateExpectedPrice(tokens: number, cycle: string, currency: string = 'INR') {
        const geoConfig = GeoService.getCurrencyConfig(currency === 'INR' ? 'IN' : 'US');
        const ratePerToken = geoConfig.costMultiplier || 0.0004;

        console.log(`[Pricing] Using rate ${ratePerToken} for currency ${currency}`);

        let subtotal = tokens * ratePerToken;

        // Apply duration discounts (Matches CYCLE_OPTIONS in frontend)
        let discountMultiplier = 1;
        let months = 1;

        if (cycle === '3_months') {
            discountMultiplier = 0.95; // 5% off
            months = 3;
        } else if (cycle === '6_months') {
            discountMultiplier = 0.90; // 10% off
            months = 6;
        } else if (cycle === 'yearly') {
            discountMultiplier = 0.85; // 15% off
            months = 12;
        }

        let total = subtotal * months * discountMultiplier;

        // 🟢 INR Rounding Rule: Integer Only (Floor)
        if (currency === 'INR') {
            total = Math.floor(total);
        } else {
            // Precise Decimal (2 places) for USD
            total = Number(total.toFixed(2));
        }

        return total;
    }
}
