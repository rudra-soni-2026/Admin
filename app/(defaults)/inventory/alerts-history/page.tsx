'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import IconBell from '@/components/icon/icon-bell';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconXCircle from '@/components/icon/icon-x-circle';
import moment from 'moment';
import { subscribeToOrders, unsubscribeFromOrders } from '@/utils/socket';

const StockAlertsHistory = () => {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [locationType, setLocationType] = useState<string>('ALL'); // ALL, STORE, WAREHOUSE

    // 📄 Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAlertHistory();

        // (Existing Socket Subscribe Logic)
    }, [locationType, page, pageSize]);

    const fetchAlertHistory = async () => {
        try {
            setLoading(true);
            const storedRole = localStorage.getItem('role')?.toLowerCase() || '';
            const userDataString = localStorage.getItem('userData');
            let query = `/management/admin/stock-alerts/history?limit=${pageSize}&page=${page}&location_type=${locationType === 'ALL' ? '' : locationType}`;

            if (userDataString) {
                // ...
            }

            const response = await callApi(query, 'GET');
            if (response && response.data) {
                const mappedAlerts = response.data.map((n: any) => {
                    let meta = n.metadata || n.meta;
                    if (typeof meta === 'string') try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
                    
                    return {
                        id: n.id,
                        message: n.message,
                        product_name: meta?.productName || 'Unknown Product',
                        variant_label: meta?.variantLabel || '',
                        location_name: meta?.locationName || (meta?.locationType === 'STORE' ? 'Store' : 'Warehouse'),
                        current_stock: meta?.currentStock ?? (meta?.stockCount ?? 0),
                        threshold: meta?.threshold || 2,
                        type: meta?.alertType || (meta?.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'),
                        createdAt: n.createdAt
                    };
                });
                setAlerts(mappedAlerts);
                // 📊 Update Pagination Data from Backend
                setTotalCount(response.totalCount || mappedAlerts.length);
                setTotalPages(response.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching alert history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-sm">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Inventory</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Stock Alert History</span></li>
            </ul>

            <div className="panel flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center text-danger">
                        <IconBell className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="text-lg font-black uppercase tracking-tight">Stock Alert History</h5>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-widest leading-none">Context-aware inventory alerts</p>
                    </div>
                </div>

                {/* 🛡️ Only Admins/Super-Admins can switch filters */}
                {localStorage.getItem('role')?.match(/admin|super_admin/i) && (
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
                        <button 
                            onClick={() => setLocationType('ALL')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${locationType === 'ALL' ? 'bg-white shadow-sm text-primary scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            🌎 All
                        </button>
                        <button 
                            onClick={() => setLocationType('STORE')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${locationType === 'STORE' ? 'bg-white shadow-sm text-primary scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            🏪 Stores
                        </button>
                        <button 
                            onClick={() => setLocationType('WAREHOUSE')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${locationType === 'WAREHOUSE' ? 'bg-white shadow-sm text-primary scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            🏭 Warehouse
                        </button>
                    </div>
                )}

                <button onClick={fetchAlertHistory} className="btn btn-outline-primary btn-sm uppercase font-bold tracking-tighter">Refresh Log</button>
            </div>

            <div className="panel p-0 border-none shadow-xl rounded-2xl overflow-hidden">
                <div className="table-responsive">
                    <table className="table-hover w-full text-sm">
                        {/* Table Header & Body */}
                        {/* ... existing code ... */}
                    </table>
                </div>

                {/* 📄 Pagination Footer */}
                <div className="p-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <select 
                            className="form-select text-xs font-black w-20 py-1 rounded-lg border-gray-200"
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Showing Page {page} of {totalPages}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg bg-white border border-gray-100 hover:bg-primary/5 disabled:opacity-30 transition-all font-black"
                        >
                            PREV
                        </button>
                        
                        <div className="flex items-center px-4 py-2 bg-white rounded-lg border border-gray-100 font-black text-xs text-primary shadow-inner">
                            {page}
                        </div>

                        <button 
                            disabled={page === totalPages || alerts.length < pageSize}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg bg-white border border-gray-100 hover:bg-primary/5 disabled:opacity-30 transition-all font-black"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAlertsHistory;
