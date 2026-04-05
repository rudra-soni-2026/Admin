"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import Swal from 'sweetalert2';
import { callApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

const ReportsHistoryPage = () => {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [storedRole, setStoredRole] = useState<string | null>(null);
    const [allStores, setAllStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState('all');
    const [dateFilter, setDateFilter] = useState<any>(null);
    const [exportingSuper, setExportingSuper] = useState(false);
    const [showSuperModal, setShowSuperModal] = useState(false);
    const [modalDate, setModalDate] = useState<any>(null);
    const [modalStoreId, setModalStoreId] = useState('all');
    
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('role');
        setStoredRole(role);
        
        if (role === 'admin' || role === 'super_admin') {
            callApi('/management/admin/stores?limit=50', 'GET').then(res => {
                if (res && res.data) setAllStores(res.data);
            });
        }
        fetchHistory();
    }, [selectedStoreId, dateFilter]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let url = `/management/admin/reports?storeId=${selectedStoreId}`;
            if (dateFilter && dateFilter.length > 0) {
                const start = moment(dateFilter[0]).format('YYYY-MM-DD');
                const end = moment(dateFilter[dateFilter.length-1]).format('YYYY-MM-DD');
                url += `&startDate=${start}&endDate=${end}`;
            }
            const res: any = await callApi(url, 'GET');
            if (res && res.data) {
                setHistoryData(res.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
        setLoading(false);
    };

    const handleQuickExport = async (report: any, format: 'excel' | 'pdf') => {
        setDownloading(`${report.id}_${format}`);
        try {
            // 🎯 CORRECT ENDPOINT: Fetching historical orders from the dedicated store-manager route
            const res: any = await callApi(`/management/store-manager/${report.store_id}/orders?startDate=${report.report_date}&endDate=${report.report_date}&limit=1000`, 'GET');
            
            // Note: The response structure might have orders in .data or .data.orders depending on management route logic
            const orders = res.data?.orders || res.data || [];

            if (!orders || orders.length === 0 || (Array.isArray(orders) && orders.length === 0)) {
                Swal.fire('Error', 'Could not find original order data for this report.', 'error');
                setDownloading(null);
                return;
            }
            const filteredForReport = orders.filter((o: any) => o.status?.toLowerCase() === 'delivered');

            if (format === 'excel') {
                const exportData = filteredForReport.map((order: any) => {
                    let calc = {};
                    try { calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {}); } catch (e) { }
                    const breakdown = (calc as any).payment_breakdown || {};
                    return {
                        'Order ID': order.order_id,
                        'Customer': order.customerName || order.user?.name || 'Guest',
                        'Phone': order.customerPhone || order.user?.phone || 'N/A',
                        'Total Amount': order.totalAmount || (calc as any).total || 0,
                        'Pay Mode': (order.paymentMethod || 'COD').toUpperCase(),
                        'Cash': breakdown.cash || 0,
                        'UPI': breakdown.online || 0,
                        'Status': order.status.toUpperCase()
                    };
                });
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
                XLSX.writeFile(workbook, `Kuiklo_History_${report.report_date}_${report.store?.name || 'All'}.xlsx`);
            } else {
                const doc = new jsPDF('l', 'mm', 'a4');
                const pageWidth = 297;
                
                // 📝 HEADER (Image 2 Style Sync)
                doc.setFont('courier', 'bold');
                doc.setFontSize(20);
                doc.text("Daily Transaction Report", pageWidth / 2, 20, { align: 'center' });
                
                doc.setFont('courier', 'normal');
                doc.setFontSize(12);
                doc.text(`Date: ${report.report_date} 00:00:00`, pageWidth / 2, 28, { align: 'center' });
                
                const sName = report.store?.name || 'All Stores';
                doc.setFont('courier', 'bold');
                doc.text(`Store: ${sName}`, pageWidth / 2, 35, { align: 'center' });

                let totalCash = 0; let totalUPI = 0; let grandTotal = 0;

                const tableRows = filteredForReport.map((order: any, index: number) => {
                    let calc: any = {};
                    try { calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {}); } catch (e) { }
                    
                    const rowTotal = parseFloat(calc.total || order.totalAmount || 0);
                    const breakdown = calc.payment_breakdown || {};
                    
                    // 💸 SMART PAYMENT RESOLUTION
                    const pMethod = (order.pay || order.payment_method || order.paymentMethod || 'COD').toUpperCase();
                    
                    let cash = 0; let upi = 0;
                    if (pMethod === 'CASH') { cash = rowTotal; } 
                    else if (pMethod === 'MULTI') { cash = parseFloat(breakdown.cash || 0); upi = rowTotal - cash; } 
                    else { upi = rowTotal; }
                    
                    totalCash += cash; totalUPI += upi; grandTotal += rowTotal;

                    const handoverAt = order.rider_assigned_at ? moment(order.rider_assigned_at) : null;
                    const created = moment(order.createdAt);
                    const updated = moment(order.updatedAt || order.finished_at);
                    const handoverMin = handoverAt ? Math.max(0, handoverAt.diff(created, 'minutes')) : 'N/A';
                    const deliveryMin = handoverAt ? Math.max(0, updated.diff(handoverAt, 'minutes')) : 'N/A';

                    // 🛵 ROBUST RIDER NAME RESOLUTION (Supporting the new Backend associations)
                    const rName = order.rider?.user?.name || order.Rider?.name || order.rider?.name || order.rider_name || order.riderName || order.RiderName || 'N/A';
                    
                    // 🆔 ORDER ID FALLBACKS (Handling long UUIDs for cleaner look)
                    let oId = order.order_id || order.originalId || order.id || 'N/A';
                    if (oId.length > 20) oId = oId.split('-')[0].toUpperCase();

                    return [
                        index + 1,
                        oId,
                        moment(order.createdAt).format('HH:mm'),
                        rowTotal.toFixed(2),
                        rName,
                        pMethod,
                        cash.toFixed(2),
                        upi.toFixed(2),
                        order.payment_confirmed ? 'Confirmed' : 'Pending',
                        order.status?.toUpperCase(),
                        `${handoverMin} Min`,
                        `${deliveryMin} Min`
                    ];
                });

                autoTable(doc, {
                    startY: 45,
                    head: [['S.No', 'Order ID', 'Order Time', 'Total Amount', 'Delivery Partner Name', 'Payment Mode', 'Cash Amount', 'UPI Amount', 'Payment Status', 'Order Status', 'Handover', 'Delivery']],
                    body: tableRows,
                    theme: 'grid',
                    styles: { 
                        font: 'courier', 
                        fontSize: 8, 
                        lineColor: [0, 0, 0], 
                        lineWidth: 0.1,
                        textColor: [0, 0, 0]
                    },
                    headStyles: { 
                        fillColor: [255, 255, 255], 
                        textColor: [0, 0, 0], 
                        fontStyle: 'bold',
                        lineWidth: 0.2
                    }
                });

                // 💰 FOOTER TOTALS (Image 2 Style Sync)
                const finalY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(11);
                doc.setFont('courier', 'bold');
                doc.text(`Total Cash Amount ${totalCash.toFixed(2)}`, 14, finalY);
                doc.text(`Total UPI Amount ${totalUPI.toFixed(2)}`, 14, finalY + 6);
                
                doc.setLineWidth(0.5);
                doc.line(14, finalY + 10, 150, finalY + 10);
                
                doc.setFontSize(14);
                doc.text(`Total Amount ${grandTotal.toFixed(2)}`, 14, finalY + 18);

                doc.save(`Kuiklo_Daily_Report_${sName}_${report.report_date}.pdf`);
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to recover report data.', 'error');
        }
        setDownloading(null);
    };

    const handleSuperExport = async () => {
        if (!dateFilter || dateFilter.length === 0) {
            Swal.fire('Requirement', 'Please select a date range first.', 'info');
            return;
        }
        setExportingSuper(true);
        try {
            const start = moment(dateFilter[0]).format('YYYY-MM-DD');
            const end = moment(dateFilter[dateFilter.length - 1]).format('YYYY-MM-DD');
            const res: any = await callApi(`/management/admin/reports/detailed-sales?startDate=${start}&endDate=${end}&storeId=${selectedStoreId}`, 'GET');
            
            if (res && res.data && res.data.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(res.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Sales');
                
                // Set column widths for better Excel UI (Adjusted for 24+ columns)
                const wscols = [
                    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
                    { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
                    { wch: 12 }, { wch: 12 }, { wch: 9 }, { wch: 12 }, { wch: 9 },
                    { wch: 12 }, { wch: 9 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
                    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
                ];
                worksheet['!cols'] = wscols;

                XLSX.writeFile(workbook, `Kuiklo_Detailed_Sales_${start}_to_${end}.xlsx`);
                Swal.fire('Success', 'Detailed report generated!', 'success');
            } else {
                Swal.fire('Empty', 'No sales data found for this range.', 'warning');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to generate super report.', 'error');
        }
        setExportingSuper(false);
    };

    return (
        <div className="p-6 bg-[#f6f8fb] dark:bg-[#060818] min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-800 dark:text-white mb-1">Reports Archive</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Financial Transparency Control Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/orders/list" className="btn btn-dark btn-sm flex items-center gap-2 px-4 py-2 font-bold uppercase transition-all transform hover:translate-x-[-4px]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Exit History
                    </Link>
                    {storedRole === 'super_admin' && (
                        <button 
                            onClick={() => setShowSuperModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-2 px-6 py-2 font-bold uppercase shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-105"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Sale Detail Report (Excel)
                        </button>
                    )}
                </div>
            </div>

            {/* 🎯 SIMPLE SUPER REPORT MODAL */}
            {showSuperModal && (
                <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-[2px] animate__animated animate__fadeIn">
                    <div className="bg-white dark:bg-[#0e1726] w-full max-w-md rounded-xl shadow-xl border border-gray-200 dark:border-gray-800">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Export Detail Report</h3>
                                <button onClick={() => setShowSuperModal(false)} className="text-gray-400 hover:text-danger">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Date Range</label>
                                    <Flatpickr 
                                        options={{ mode: 'range', dateFormat: 'Y-m-d' }}
                                        className="form-input font-medium"
                                        placeholder="Select Dates"
                                        onChange={(date) => setModalDate(date)}
                                        value={modalDate}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Store Selection</label>
                                    <select 
                                        className="form-select font-medium"
                                        value={modalStoreId}
                                        onChange={(e) => setModalStoreId(e.target.value)}
                                    >
                                        <option value="all">All Dark Stores</option>
                                        {allStores.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button onClick={() => setShowSuperModal(false)} className="btn btn-outline-danger flex-1 py-2 font-bold uppercase text-xs">Cancel</button>
                                    <button 
                                        disabled={exportingSuper || !modalDate || modalDate.length === 0}
                                        onClick={async () => {
                                            setExportingSuper(true);
                                            try {
                                                const start = moment(modalDate[0]).format('YYYY-MM-DD');
                                                const end = moment(modalDate[modalDate.length - 1]).format('YYYY-MM-DD');
                                                const res: any = await callApi(`/management/admin/reports/detailed-sales?startDate=${start}&endDate=${end}&storeId=${modalStoreId}`, 'GET');
                                                
                                                if (res && res.data && res.data.length > 0) {
                                                    const worksheet = XLSX.utils.json_to_sheet(res.data);
                                                    const workbook = XLSX.utils.book_new();
                                                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Sales');
                                                    XLSX.writeFile(workbook, `Kuiklo_Detailed_Sales_${start}_to_${end}.xlsx`);
                                                    setShowSuperModal(false);
                                                    Swal.fire('Success', 'Detailed report generated!', 'success');
                                                } else {
                                                    Swal.fire('Empty', 'No sales data found for this range.', 'warning');
                                                }
                                            } catch (e) {
                                                Swal.fire('Error', 'Failed to generate report.', 'error');
                                            }
                                            setExportingSuper(false);
                                        }}
                                        className="btn btn-primary flex-1 py-2 font-bold uppercase text-xs"
                                    >
                                        {exportingSuper ? 'Exporting...' : 'Export Excel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🛠️ CONTROLS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(storedRole === 'admin' || storedRole === 'super_admin') && (
                    <div className="panel p-4 shadow-sm border-none flex flex-col gap-1.5 dark:bg-[#0e1726]">
                        <label className="text-[10px] font-black uppercase text-gray-400">Filter By Location</label>
                        <select 
                            className="form-select font-bold text-xs py-2 bg-gray-50 dark:bg-[#1b2e4b] border-none focus:ring-2 focus:ring-primary/20"
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value)}
                        >
                            <option value="all">ALL DARK STORES</option>
                            {allStores.map(s => (
                                <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="panel p-4 shadow-sm border-none flex flex-col gap-1.5 dark:bg-[#0e1726] col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Search by Date Range</label>
                    <Flatpickr 
                        options={{ mode: 'range', dateFormat: 'Y-m-d' }}
                        className="form-input font-bold text-xs py-2 bg-gray-50 dark:bg-[#1b2e4b] border-none focus:ring-2 focus:ring-primary/20"
                        placeholder="SELECT DATES TO SEARCH ARCHIVE"
                        onChange={(date) => setDateFilter(date)}
                        value={dateFilter}
                    />
                </div>
            </div>

            <div className="panel border-none shadow-md overflow-hidden dark:bg-[#0e1726]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <span className="animate-spin h-12 w-12 border-4 border-primary border-l-transparent rounded-full shadow-lg"></span>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Archive Database...</p>
                    </div>
                ) : historyData.length === 0 ? (
                    <div className="text-center py-32">
                        <h5 className="text-xl font-black text-gray-300 uppercase italic">No Records Found</h5>
                        <p className="text-gray-400 text-xs mt-2 uppercase font-bold">Try adjusting your store or date filters</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-black/20 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-200 dark:border-gray-800">
                                    <th className="px-6 py-5">Date Reference</th>
                                    <th className="px-6 py-5">Location</th>
                                    <th className="px-6 py-5 text-center">Orders</th>
                                    <th className="px-6 py-5">Cash In</th>
                                    <th className="px-4 py-5">UPI In</th>
                                    <th className="px-4 py-5">Gross Revenue</th>
                                    <th className="px-6 py-5 text-right">Instant Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/10">
                                {historyData.map((report) => (
                                    <tr key={report.id} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-l-4 border-transparent hover:border-primary">
                                        <td className="px-6 py-5">
                                            <span className="font-black text-gray-800 dark:text-white block">{moment(report.report_date).format('DD MMM YYYY')}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">ID: {report.id.split('-')[0].toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-[10px] tracking-tight text-indigo-500 uppercase">{report.store?.name || 'All Stores'}</td>
                                        <td className="px-6 py-5 text-center font-black text-gray-600 dark:text-gray-400">{report.total_orders}</td>
                                        <td className="px-6 py-5 text-success font-black tracking-tight">₹{parseFloat(report.total_cash).toFixed(2)}</td>
                                        <td className="px-4 py-5 text-primary font-black tracking-tight">₹{parseFloat(report.total_upi).toFixed(2)}</td>
                                        <td className="px-4 py-5 font-black text-gray-800 dark:text-white">₹{parseFloat(report.grand_total).toFixed(2)}</td>
                                        <td className="px-6 py-5 text-right space-x-1.5 flex items-center justify-end">
                                            <button 
                                                disabled={!!downloading}
                                                onClick={() => handleQuickExport(report, 'excel')}
                                                className="btn btn-xs btn-outline-success font-black text-[9px] uppercase tracking-tighter px-3 h-8 shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                                            >
                                                {downloading === `${report.id}_excel` ? '⏳...' : 'Excel'}
                                            </button>
                                            <button 
                                                disabled={!!downloading}
                                                onClick={() => handleQuickExport(report, 'pdf')}
                                                className="btn btn-xs btn-danger font-black text-[9px] uppercase tracking-tighter px-3 h-8 shadow-md hover:scale-110 active:scale-95 disabled:opacity-50"
                                            >
                                                {downloading === `${report.id}_pdf` ? '⏳...' : 'PDF'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <footer className="mt-12 mb-8 text-center border-t border-gray-100 dark:border-gray-800 pt-8">
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-2">Secure Financial Archive</div>
                <p className="text-[9px] text-gray-400 font-bold max-w-md mx-auto leading-relaxed">
                    THIS PORTAL PROVIDES READ-ONLY ACCESS TO PREVIOUSLY FINALIZED FINANCIAL STATEMENTS. 
                    ALL DOWNLOADS ARE RECONSTRUCTED FROM HISTORICAL TRANSACTION LOGS.
                </p>
            </footer>
        </div>
    );
};

export default ReportsHistoryPage;
