'use client';

import React from 'react';
/* @ts-ignore */
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// 1. Font Registration (Bold aur Regular taaki Rupee symbol aur text fat na jaye)
// 1. Font Registration (Using CDN to ensure reliable loading)
try {
    Font.register({
        family: 'Roboto',
        fonts: [
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
        ]
    });
} catch (e) {
    console.warn("Font registration failed", e);
}

// 2. Helper to format Currency correctly (Fixes the ¹2396 and $ issue)
const formatCurrency = (amount: number, currency: string) => {
    try {
        const cleanCurrency = currency?.trim().toUpperCase() || 'INR';
        const formattedNumber = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);

        if (cleanCurrency === 'INR') {
            return `Rs. ${formattedNumber}`;
        }

        return `${cleanCurrency} ${formattedNumber}`;
    } catch (e) {
        return `${currency} ${amount}`;
    }
};

// ... (Styles remain same)

// ...

// 3. STYLING (PDF ke liye CSS alag hoti hai)
const styles = StyleSheet.create({
    page: { backgroundColor: '#FFFFFF', fontFamily: 'Roboto', padding: 40, color: '#1a1a1a' },

    // Header Section
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#6D28D9', paddingBottom: 20 },
    logoSection: { flexDirection: 'row', alignItems: 'center' },
    logoImage: { width: 30, height: 30, marginRight: 10, marginTop: -10 },
    textContainer: { flexDirection: 'column' },
    logoText: { fontSize: 28, fontWeight: 'bold', color: '#000000', letterSpacing: 1 },
    brandSub: { fontSize: 9, color: '#6D28D9', marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },

    // Invoice Meta (Right Side)
    invoiceDetails: { textAlign: 'right' },
    label: { fontSize: 8, color: '#666', marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 11, marginBottom: 8, fontWeight: 'bold' },

    // Billing Info Grid
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    sectionTitle: { fontSize: 9, color: '#666', marginBottom: 6, textTransform: 'uppercase', fontWeight: 'bold' },
    addressText: { fontSize: 10, lineHeight: 1.4, color: '#333' },

    // Table
    tableHeader: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', padding: 8, marginTop: 10 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F9FAFB', padding: 10 },

    // Columns
    colDesc: { width: '50%', fontSize: 10 },
    colQty: { width: '15%', textAlign: 'center', fontSize: 10 },
    colRate: { width: '15%', textAlign: 'right', fontSize: 10 },
    colTotal: { width: '20%', textAlign: 'right', fontSize: 10, fontWeight: 'bold' },



    // Strikethrough for Markup Price
    struckThrough: { textDecoration: 'line-through', color: '#9CA3AF', marginRight: 5 },

    // Item Details (Token/Validity)
    itemSubDetail: { fontSize: 8, color: '#666', marginTop: 4 },

    // Totals
    totalSection: { marginTop: 15, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 3, width: '50%' },
    totalLabel: { fontSize: 10, color: '#666', marginRight: 15 },
    totalValue: { fontSize: 10, fontWeight: 'bold', textAlign: 'right', width: 80 },

    grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#6D28D9' },
    grandValue: { fontSize: 14, color: '#6D28D9', fontWeight: 'bold', textAlign: 'right', width: 100 },

    // Footer
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 15 },
    footerText: { fontSize: 8, color: '#9CA3AF' }
});

// 4. TYPES
interface InvoiceItem {
    name: string;
    tokens: string; // e.g. "2 Million Tokens"
    validity: string; // e.g. "Valid till 14 Feb 2026"
    qty: number;
    rate: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    customerAddress: string;  // address_line1
    customerCity?: string;
    customerState?: string;
    customerCountry?: string;
    customerPincode?: string;
    customerTaxId?: string; // GSTIN/Tax ID for B2B invoices
    customerPhone?: string; // Optional phone number
    items: InvoiceItem[];
    currency: string;
    couponCode?: string;     // e.g. "EARLY33"

    // Detailed Breakdown Fields
    marketPrice: number;       // Original "Market Value" (1.5x)
    planDiscount: number;      // 33% Plan Discount
    dealPrice: number;         // Standard deal price
    durationDiscount?: number; // 5%, 10%, 15% savings
    couponDiscount?: number;   // Extra coupon savings

    // Payment Meta (Proof)
    paymentMethod?: string;    // e.g. "UPI", "Credit Card"
    paymentId?: string;        // e.g. "pay_N9..."

    // Deprecated helpers (optional for migration)
    subtotal?: number;
    discountAmount?: number;
    total: number;
}

// 5. PDF DOCUMENT
const InvoiceDocument = ({ data }: { data: InvoiceData }) => {
    // Construct absolute URL for the logo to ensure PDF engine can fetch it
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Image src={logoUrl} style={styles.logoImage} />

                        <View style={styles.textContainer}>
                            <Text style={styles.logoText}>CLUAIZ</Text>
                            <Text style={styles.brandSub}>Neural Intelligence Systems</Text>
                        </View>
                    </View>
                    <View style={styles.invoiceDetails}>
                        <Text style={styles.label}>INVOICE ID</Text>
                        <Text style={styles.value}>#{data.invoiceNumber}</Text>
                        <Text style={styles.label}>ISSUE DATE</Text>
                        <Text style={styles.value}>{data.date}</Text>
                    </View>
                </View>

                {/* Billing Info */}
                <View style={styles.gridContainer}>
                    <View>
                        <Text style={styles.sectionTitle}>Billed To</Text>
                        <Text style={[styles.addressText, { fontWeight: 'bold' }]}>{data.customerName}</Text>
                        {data.customerTaxId && (
                            <Text style={[styles.addressText, { fontWeight: 'bold', marginTop: 2 }]}>GSTIN: {data.customerTaxId}</Text>
                        )}
                        {data.customerPhone && (
                            <Text style={styles.addressText}>Phone: {data.customerPhone}</Text>
                        )}
                        <Text style={styles.addressText}>{data.customerEmail}</Text>
                        {/* 🟢 FIXED: Structured address display */}
                        {data.customerAddress && (
                            <Text style={styles.addressText}>{data.customerAddress}</Text>
                        )}

                        {data.customerCity && data.customerState && (
                            <Text style={styles.addressText}>{data.customerCity}, {data.customerState}</Text>
                        )}
                        {data.customerCountry && data.customerPincode && (
                            <Text style={styles.addressText}>{data.customerCountry} - {data.customerPincode}</Text>
                        )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.sectionTitle}>SOLD BY</Text>

                        {/* Company Name */}
                        <Text style={[styles.addressText, { fontWeight: 'bold', fontSize: 11 }]}>
                            Cluaiz Technologies
                        </Text>

                        {/* "MSME Registered" Tag (Trust Badge) */}
                        <Text style={{ fontSize: 9, color: '#6D28D9', marginBottom: 2, fontWeight: 'bold' }}>
                            (MSME Registered Entity)
                        </Text>

                        {/* Address */}
                        <Text style={styles.addressText}>Prayagraj, Uttar Pradesh, India - 221508</Text>

                        {/* UDYAM Number instead of PAN (Safe & Professional) */}
                        <Text style={[styles.addressText, { marginTop: 5, fontWeight: 'bold' }]}>
                            Reg No: UDYAM-UP-03-0131764
                        </Text>

                        {/* Contact */}
                        <Text style={styles.addressText}>support@cluaiz.com</Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>PLAN DETAILS</Text>
                    <Text style={styles.colQty}>QTY</Text>
                    <Text style={styles.colRate}>PRICE</Text>
                    <Text style={styles.colTotal}>TOTAL</Text>
                </View>

                {/* Table Rows */}
                {data.items.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <View style={styles.colDesc}>
                            <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{item.name}</Text>
                            <Text style={styles.itemSubDetail}>• Capacity: {item.tokens}</Text>
                            <Text style={styles.itemSubDetail}>• {item.validity}</Text>
                        </View>
                        <Text style={styles.colQty}>{item.qty}</Text>
                        <View style={[styles.colRate, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
                            {/* Show Market Price Strikethrough in Row? User said 'Description me nhi ayega... detail only price me hai' */}
                            {/* Let's show the high market price here as the base rate anchor */}
                            <Text style={styles.struckThrough}>{formatCurrency((data.marketPrice / item.qty), data.currency)}</Text>
                        </View>
                        <View style={[styles.colTotal, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
                            <Text style={styles.struckThrough}>{formatCurrency(data.marketPrice, data.currency)}</Text>
                        </View>
                    </View>
                ))}

                {/* TOTALS SECTION - 6 Step Hierarchy */}
                <View style={styles.totalSection}>

                    {/* 1. Plan Price (Market Value) - Only show if different from Deal Price */}
                    {(data.marketPrice > data.dealPrice) && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Plan Price</Text>
                            <Text style={[styles.totalValue, styles.struckThrough]}>{formatCurrency(data.marketPrice, data.currency)}</Text>
                        </View>
                    )}

                    {/* 2. Plan Discount */}
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Plan Discount (33% OFF)</Text>
                        <Text style={[styles.totalValue, { color: '#16a34a' }]}>- {formatCurrency(data.planDiscount, data.currency)}</Text>
                    </View>

                    {/* 3. Deal Price */}
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#333' }]}>Deal Price</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.dealPrice, data.currency)}</Text>
                    </View>

                    {/* 4. Duration Discount */}
                    {data.durationDiscount && data.durationDiscount > 0 ? (
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Duration Discount</Text>
                            <Text style={[styles.totalValue, { color: '#16a34a' }]}>- {formatCurrency(data.durationDiscount, data.currency)}</Text>
                        </View>
                    ) : null}

                    {/* 5. Coupon Discount */}
                    {data.couponDiscount && data.couponDiscount > 0 ? (
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: '#16a34a' }]}>
                                Coupon {data.couponCode ? `(${data.couponCode})` : ''}
                            </Text>
                            <Text style={[styles.totalValue, { color: '#16a34a' }]}>- {formatCurrency(data.couponDiscount, data.currency)}</Text>
                        </View>
                    ) : null}

                    {/* 6. TOTAL PAID */}
                    <View style={styles.grandTotal}>
                        <Text style={[styles.totalLabel, { fontSize: 12, color: '#000', marginTop: 3 }]}>TOTAL PAID</Text>
                        <Text style={styles.grandValue}>{formatCurrency(data.total, data.currency)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for trusting Cluaiz. This invoice is system generated.</Text>
                    <Text style={styles.footerText}>Support: support@cluaiz.com | Web: cluaiz.com</Text>
                    <Text style={styles.footerText}>this is a test invoice, Not Real, It's just for testing</Text>
                </View>
            </Page>
        </Document>
    );
};

// 6. CLIENT COMPONENT BUTTON (On-Demand Generation)
// 6. CLIENT COMPONENT BUTTON (On-Demand Generation)
import { formatInvoiceFromTransaction } from '@/utils/billingUtils';

const InvoiceDownloadButton = ({ transaction, className }: { transaction: any, className?: string }) => {
    const [loading, setLoading] = React.useState(false);

    // 🟢 Safeguard: If transaction is missing (e.g. active plan but log not synced), render disabled
    if (!transaction) {
        return (
            <button
                disabled
                className={(className || "flex items-center justify-center gap-2 border border-white/10 bg-black/20 text-slate-500 px-3 py-2 rounded-lg text-xs") + " opacity-50 cursor-not-allowed"}
                title="Invoice synchronization in progress"
            >
                <Download size={14} />
            </button>
        );
    }

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();

        // 🟢 Robustness Check: Prevent null pointer if called unexpectedly
        if (!transaction) {
            console.warn("Invoice download blocked: No transaction data");
            return;
        }

        try {
            setLoading(true);

            // 🟢 Prepare Data (Pure DB Logic - No external injection)
            const invoiceData = formatInvoiceFromTransaction(transaction);

            // 🟢 Generate Custom Filename
            const planName = (transaction.planName || "plan").split('_')[0]; // Simplify 'starter_123' -> 'starter'
            const dateStr = new Date(transaction.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
            const filename = `cluaiz_invoice_${planName}_${dateStr}.pdf`;

            // Dynamically import pdf to avoid server-side issues
            const { pdf } = await import('@react-pdf/renderer');

            const blob = await pdf(<InvoiceDocument data={invoiceData} />).toBlob();
            const url = URL.createObjectURL(blob);

            // Trigger Download with Name
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("PDF Generation Failed", error);
            alert("Failed to generate invoice. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className={className || "flex items-center justify-center gap-2 border border-white/10 bg-black/20 hover:bg-white/10 text-slate-300 px-3 py-2 rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-wait"}
            title="Download Invoice"
        >
            {loading ? (
                <Loader2 size={12} className="animate-spin text-indigo-500" />
            ) : (
                <Download size={18} />
            )}
        </button>
    );
};

export default InvoiceDownloadButton;
