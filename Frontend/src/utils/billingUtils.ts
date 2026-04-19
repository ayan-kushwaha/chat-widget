import { InvoiceData } from '../app/dashboard/settings/billing/components/InvoiceGenerator';

export const formatInvoiceFromTransaction = (transaction: any): InvoiceData => {
    // 0. Safety Check
    if (!transaction) throw new Error("Invoice generation failed: Transaction data is missing");

    // 1. Extract Snapshot (The source of truth)
    const snapshot = transaction.snapshot || {};
    const billingDetails = transaction.billingDetails || {};
    const orgBillingInfo = transaction.organization?.billing_info || {}; // Fallback if org is populated

    // 2. Format Dates
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // 3. Determine Prices (Prioritize Query-able fields, then Snapshot)
    // marketPrice = List Price (1.5x)
    // priceOffer = Deal Price (Paid)
    // 🟢 FIX: Prioritize strict snapshot value over calculation to match DB exactly
    // 🟢 FIX: Prioritize strict snapshot value. NO calculations.
    // 🟢 FIX: Prioritize strict snapshot value over calculation to match DB exactly
    // 🟢 FIX: Prioritize strict snapshot value. NO calculations.
    const marketPrice = (snapshot.price_market !== undefined)
        ? snapshot.price_market
        : transaction.amount; // Fallback to paid amount if market price is missing (no fake inflation)

    const priceOffer = snapshot.price_offer || transaction.amount;

    // 🟢 FIX: Use 'subtotal' as the intermediate 'Deal Price' (After Plan Discount, Before Coupon)
    // If subtotal is missing, fallback to priceOffer
    const dealPrice = snapshot.order_summary?.subtotal || priceOffer;

    // Plan Discount = Market Price - Deal Price (Subtotal)
    const planDiscount = Math.max(0, marketPrice - dealPrice);

    // 4. Determine Customer Details (Priority: Transaction Snapshot > Org Current)
    // We prefer the details captured AT TIME OF PURCHASE (transaction.billingDetails)
    const customer = {
        name: billingDetails.customerName || billingDetails.companyName || startCase(orgBillingInfo.company_name) || 'Valued Customer',
        email: billingDetails.email || snapshot.billingDetails?.email || orgBillingInfo.email || '',
        phone: billingDetails.phone || snapshot.billingDetails?.phone || orgBillingInfo.phone || '',
        address: billingDetails.addressLine1 || billingDetails.address || billingDetails.address_line1 || snapshot.billingDetails?.address || orgBillingInfo.address_line1 || '', // 🟢 FIX: Added address_line1
        city: billingDetails.city || snapshot.billingDetails?.city || orgBillingInfo.city || '',
        state: getFullStateName(billingDetails.stateName || billingDetails.state || billingDetails.state_name || snapshot.billingDetails?.state || orgBillingInfo.state_name || ''),
        country: getFullCountryName(billingDetails.countryName || billingDetails.country || billingDetails.country_name || snapshot.billingDetails?.country || orgBillingInfo.country_name || ''),
        pincode: billingDetails.pincode || snapshot.billingDetails?.pincode || orgBillingInfo.pincode || '',
        taxId: billingDetails.taxId || snapshot.billingDetails?.taxId || orgBillingInfo.tax_id || ''
    };

    // 5. Build Items List
    const planName = snapshot.plan_name || transaction.planName || 'Cluaiz Subscription';
    const isTopUp = transaction.type === 'topup' || planName.toLowerCase().includes('top-up');

    // 🟢 FIX: Handle Capacity (Top-up vs Subscription)
    let tokensDisplay = 'Standard Limit';
    if (isTopUp && snapshot.tokens) {
        tokensDisplay = `${Number(snapshot.tokens).toLocaleString()} Tokens`;
    } else if (snapshot.limits?.max_tokens) {
        tokensDisplay = `${Number(snapshot.limits.max_tokens).toLocaleString()} Tokens / month`;
    }

    // Duration Label
    let durationLabel = '';
    const interval = transaction.interval || snapshot.billing_cycle;
    if (interval === 'year' || interval === 'yearly') durationLabel = '(Yearly)';
    else if (interval === 'month' || interval === 'monthly') durationLabel = '(Monthly)';
    else if (interval === '3_months') durationLabel = '(Quarterly)';

    const periodStart = transaction.billingPeriod?.start || transaction.createdAt;
    const periodEnd = transaction.billingPeriod?.end || calculateEndDate(periodStart, interval);

    // 🟢 FIX: Validity Logic
    let validityText = `Service Period: ${formatDate(periodStart)} - ${formatDate(periodEnd)} ${durationLabel}`;
    if (isTopUp) {
        validityText = "Service Period: Never Expires (Usage Based)";
    }

    const items = [{
        name: formatPlanName(planName),
        tokens: tokensDisplay,
        validity: validityText,
        qty: 1,
        rate: marketPrice // Shown as unit price (struck through if discounted)
    }];

    // 6. Return Final Object
    return {
        invoiceNumber: transaction.invoiceNumber || `INV-${transaction._id.slice(-6).toUpperCase()}`,
        date: formatDate(transaction.createdAt),

        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerCity: customer.city,
        customerState: customer.state,
        customerCountry: customer.country,
        customerPincode: customer.pincode,
        customerTaxId: customer.taxId,
        customerPhone: customer.phone,

        currency: transaction.currency || 'INR',
        couponCode: snapshot.order_summary?.coupon_code || '',

        // Financials
        marketPrice: marketPrice,
        planDiscount: planDiscount,
        dealPrice: dealPrice,

        durationDiscount: snapshot.order_summary?.duration_discount || 0,
        couponDiscount: snapshot.order_summary?.coupon_discount || 0,

        total: transaction.amount,

        items: items,
        paymentMethod: transaction.paymentMethod || 'Online',
        paymentId: transaction.razorpay_payment_id || transaction.paymentGatewayId
    };
};

// --- Helpers ---

function formatPlanName(name: string) {
    if (!name) return 'Subscription';
    // Clean up "starter_8374" -> "Starter Plan"
    const base = name.split('_')[0];
    return base.charAt(0).toUpperCase() + base.slice(1) + ' Plan';
}

function startCase(str: string) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function calculateEndDate(startDate: string, interval: string) {
    if (!startDate) return null;
    const d = new Date(startDate);
    if (interval === 'year' || interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else if (interval === '3_months') d.setMonth(d.getMonth() + 3);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString();
}

// 🟢 FIX: Map Codes to Full Names (Add more as needed)
function getFullStateName(code: string) {
    if (!code) return '';
    const map: Record<string, string> = {
        'UP': 'Uttar Pradesh',
        'DL': 'Delhi',
        'MH': 'Maharashtra',
        'KA': 'Karnataka',
        'TN': 'Tamil Nadu',
        'WB': 'West Bengal',
        'GJ': 'Gujarat',
        'RJ': 'Rajasthan',
        'MP': 'Madhya Pradesh',
        'BA': 'Bihar',
        'PB': 'Punjab',
        'HR': 'Haryana',
        // Add more as needed or use a library
    };
    return map[code.toUpperCase()] || code;
}

function getFullCountryName(code: string) {
    if (!code) return '';
    const map: Record<string, string> = {
        'IN': 'India',
        'US': 'United States',
        'UK': 'United Kingdom',
        'CA': 'Canada',
        'AU': 'Australia',
        'PK': 'Pakistan',
        'BD': 'Bangladesh'
    };
    return map[code.toUpperCase()] || code;
}
