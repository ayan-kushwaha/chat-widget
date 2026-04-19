import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Download, CheckCircle, XCircle, Clock, RefreshCw, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useOrganization';
import { transactionsAPI, Transaction } from '@/api/transactions.api';
import { Loader2 } from 'lucide-react';
import InvoiceDownloadButton from './InvoiceGenerator';
import { formatInvoiceFromTransaction } from '@/utils/billingUtils';

interface BillingLogsProps {
    logs?: any[]; // Legacy prop, kept for compatibility but not primary
}

export const BillingLogs: React.FC = () => {
    const { organization, isLoading: isOrgLoading } = useOrganization();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async () => {
        if (isOrgLoading) return;

        const orgId = (organization as any)?._id || (organization as any)?.id;
        if (!orgId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await transactionsAPI.getHistory(orgId, page, 10);
            if (data.success) {
                setTransactions(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch billing history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [(organization as any)?._id, (organization as any)?.id, page, isOrgLoading]);

    if ((loading || isOrgLoading) && transactions.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!loading && transactions.length === 0) {
        return (
            <Card className="p-12 text-center border-dashed border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4 ring-1 ring-gray-100 dark:ring-gray-700">
                    <RefreshCw className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No billing history</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                    No transactions recorded yet. Once you make a purchase or subscribe, your invoices will appear here.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Transaction History</h3>
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900/40">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.map((log: any) => (
                        <div key={log._id} className="p-4 sm:flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group">

                            {/* LEFT: Info */}
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className={`p-2.5 rounded-lg shrink-0 ${log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {log.status === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {log.invoiceNumber || 'INV-PENDING'}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {new Date(log.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • {log.planName || 'Plan Upgrade'}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Amount & Action */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-14 sm:pl-0">
                                <div className="font-mono font-bold text-base dark:text-white">
                                    {log.currency} {log.amount.toFixed(2)}
                                </div>

                                {log.status === 'success' && log.amount > 0 ? (
                                    <InvoiceDownloadButton
                                        transaction={log}
                                        className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-indigo-500 hover:text-white dark:text-gray-400 transition-all flex items-center justify-center"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-300 cursor-not-allowed">
                                        <Clock size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
};
