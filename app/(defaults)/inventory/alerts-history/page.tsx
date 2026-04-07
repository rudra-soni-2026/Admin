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

    useEffect(() => {
        fetchAlertHistory();

        // 📡 REAL-TIME SOCKET LISTENER for this page
        subscribeToOrders((err: any, data: any) => {
            if (err) return;
            if (data.type === 'STOCK_ALERT') {
                const newAlert = {
                    id: data.notificationId || Date.now(),
                    message: data.message, // 🔥 Full Message
                    product_name: data.productName || 'New Product Alert',
                    variant_label: data.variantLabel || '',
                    location_name: data.locationName || (data.locationType === 'STORE' ? 'Store' : 'Warehouse'),
                    current_stock: data.currentStock ?? 0,
                    threshold: data.threshold || 2,
                    type: data.alertType || (data.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'),
                    createdAt: new Date().toISOString()
                };
                setAlerts(prev => [newAlert, ...prev].slice(0, 50));
            }
        });

        return () => {
             // unsubscribeFromOrders(); // Be careful if other listeners need it
        };
    }, []);

    const fetchAlertHistory = async () => {
        try {
            setLoading(true);
            const storedRole = localStorage.getItem('role')?.toLowerCase() || '';
            const userDataString = localStorage.getItem('userData');
            let query = '/management/admin/stock-alerts/history?limit=100';

            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    const assignedId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id;
                    if (assignedId && assignedId !== 'all') {
                        if (storedRole.includes('store_manager')) query += `&store_id=${assignedId}`;
                        else if (storedRole.includes('warehouse_manager')) query += `&warehouse_id=${assignedId}`;
                    }
                } catch (e) {}
            }

            const response = await callApi(query, 'GET');
            if (response && response.data) {
                // Map the Notification model (SQL) to our UI fields
                const mappedAlerts = response.data.map((n: any) => {
                    let meta = n.metadata;
                    if (typeof meta === 'string') {
                        try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
                    }
                    
                    return {
                        id: n.id,
                        message: n.message, // 🔥 Full Message
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

            <div className="panel flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center text-danger">
                        <IconBell className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="text-lg font-black uppercase tracking-tight">Stock Alert History</h5>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-widest">History of sent push notifications for low/out of stock</p>
                    </div>
                </div>
                <button onClick={fetchAlertHistory} className="btn btn-outline-primary btn-sm uppercase font-bold tracking-tighter">Refresh Log</button>
            </div>

            <div className="panel p-0 border-none shadow-xl rounded-[32px] overflow-hidden">
                <div className="table-responsive">
                    <table className="table-hover w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800">
                                <th className="py-4 px-6 text-[10px] uppercase font-black text-gray-400">Timestamp</th>
                                <th className="py-4 px-6 text-[10px] uppercase font-black text-gray-400">Product Alert Message</th>
                                <th className="py-4 px-6 text-[10px] uppercase font-black text-gray-400">Location</th>
                                <th className="py-4 px-6 text-[10px] uppercase font-black text-gray-400">Alert Type</th>
                                <th className="py-4 px-6 text-[10px] uppercase font-black text-gray-400">Stock Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20">
                                        <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8 inline-block"></span>
                                    </td>
                                </tr>
                            ) : alerts.length > 0 ? (
                                alerts.map((alert) => (
                                    <tr key={alert.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                                        <td className="py-4 px-6">
                                            <div className="text-[11px] font-bold text-gray-500 uppercase">{moment(alert.createdAt).format('DD MMM YYYY')}</div>
                                            <div className="text-[10px] font-black text-primary">{moment(alert.createdAt).format('hh:mm A')}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-gray-800 dark:text-gray-200 leading-tight block max-w-sm whitespace-normal">{alert.message}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">
                                                {alert.location_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {alert.type === 'OUT_OF_STOCK' || alert.current_stock === 0 ? (
                                                <div className="flex items-center gap-1.5 text-danger animate-pulse">
                                                    <IconXCircle className="w-4 h-4" />
                                                    <span className="text-[10px] font-extrabold uppercase">Out of Stock</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-warning">
                                                    <IconInfoCircle className="w-4 h-4" />
                                                    <span className="text-[10px] font-extrabold uppercase">Low Stock Alert</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-sm font-black ${alert.current_stock === 0 ? 'text-danger' : 'text-warning'}`}>{alert.current_stock}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">/ Threshold {alert.threshold || 2}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest italic text-xs">
                                        ✨ No stock alerts in history
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockAlertsHistory;
