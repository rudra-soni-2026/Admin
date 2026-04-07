'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import { subscribeToOrders, joinStore, unsubscribeFromOrders, getOrders, getSocket } from '@/utils/socket';
import { useRef } from 'react';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const OrderList = () => {
    const router = useRouter();
    const [storedRole, setStoredRole] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('role') : null);
    const [orderData, setOrderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Stats
    const [totalOrders, setTotalOrders] = useState(0);
    const [todayOrders, setTodayOrders] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [qrRevenue, setQrRevenue] = useState(0);
    const [cashRevenue, setCashRevenue] = useState(0);
    const [pgRevenue, setPgRevenue] = useState(0);

    const [riders, setRiders] = useState<any[]>([]);

    // Filter States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState<any>('');
    const [allStores, setAllStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState('all');

    // 🍟 UNIFIED TOAST (SNACKBAR) SYSTEM
    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    // Refs for stable socket callback values
    const pageRef = useRef(1);
    const searchRef = useRef('');
    const statusRef = useRef('all');
    const dateRangeRef = useRef<any>('');

    const pageSizeRef = useRef(10);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    useEffect(() => {
        pageSizeRef.current = pageSize;
    }, [pageSize]);

    useEffect(() => {
        searchRef.current = debouncedSearch;
    }, [debouncedSearch]);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        dateRangeRef.current = dateRange;
    }, [dateRange]);

    useEffect(() => {
        const role = localStorage.getItem('role');
        setStoredRole(role);

        if (role === 'admin' || role === 'super_admin') {
            callApi('/management/admin/stores?limit=50', 'GET').then(res => {
                if (res && res.data) setAllStores(res.data);
            });
        }
    }, []);


    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (debouncedSearch !== search) {
                setDebouncedSearch(search);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [search, debouncedSearch]);

    const mapOrderData = (orders: any[]) => {
        return orders.map((order: any) => {
            let calc = {};
            try {
                calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {});
            } catch (e) { }

            // 👤 CUSTOMER: Prioritize address name/phone from the DB record if it exists
            const addr = typeof order.order_address === 'string' ? JSON.parse(order.order_address) : (order.order_address || {});
            const customerName = order.customerName || addr.name || addr.receiverName || addr.receiver_name || (order.user?.name) || 'Guest User';
            const customerPhone = order.customerPhone || addr.phone || addr.mobile || addr.receiverPhone || (order.user?.phone) || 'N/A';
            const total = (calc as any).total || order.totalAmount || order.total_amount || 0;

            return {
                ...order,
                id: order.id || order._id,
                originalId: order.id || order._id,
                order_id: order.order_id || order.id || order._id || order.shortId || 'N/A',
                orderTime: (order.createdAt || order.created_at) ? new Date(order.createdAt || order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                deliveryTime: order.delivery_at ? new Date(order.delivery_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                duration: order.delivery_duration || '--',
                customerName: customerName,
                customerPhone: customerPhone,
                isNewCustomer: order.isFirstOrder || order.isNewCustomer || false,
                userOrderCount: order.userOrderCount || 0,
                // 🛵 RIDER: Robust Detection (Matches Backend associations)
                rider: order.rider?.user?.name || order.rider?.name || order.rider_name || order.Rider?.name || order.riderName || '-',
                pay: (order.pay || order.payment_method || order.paymentMethod || 'COD').toUpperCase(),
                amount: `₹${total}`,
                status: order.status || 'Pending',
                storeName: (order.store?.name || order.Store?.name) || 'N/A'
            };
        });
    };

    const fetchOrders = (currentPage: number) => {
        const socketObj = getSocket();

        // 🔥 If socket not ready, retry in 500ms or just log it
        if (!socketObj || !socketObj.connected) {
            console.log("⏳ Socket not ready, will retry fetch...");
            setTimeout(() => fetchOrders(currentPage), 500);
            return;
        }

        try {
            setLoading(true);

            // Determine storeId based on role
            const storedRole = localStorage.getItem('role');
            const userDataString = localStorage.getItem('userData');
            let storeId = 'all';

            // Managers (Store or Warehouse) only see their assigned store
            if ((storedRole === 'store_manager' || storedRole === 'warehouse_manager') && userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    storeId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id || 'all';
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }

            const currentSearch = searchRef.current;
            const currentStatus = statusRef.current;
            const currentDateRange = dateRangeRef.current;
            const currentPageSize = pageSizeRef.current;

            const params: any = {
                storeId: selectedStoreId || storeId,
                page: currentPage,
                limit: currentPageSize,
                search: currentSearch,
            }

            if (currentStatus !== 'all') params.status = currentStatus;

            // 📍 DEFAULT: Today's orders if no date range selected for ALL ROLES
            if (currentDateRange && currentDateRange.length > 0) {
                // If Admin/Role has selection
                params.startDate = moment(currentDateRange[0]).format('YYYY-MM-DD');
                params.endDate = moment(currentDateRange[currentDateRange.length - 1]).format('YYYY-MM-DD');
            } else {
                // Default to Today for EVERYONE (Super Admin, Admin, Manager)
                const localToday = moment().format('YYYY-MM-DD');
                params.startDate = localToday;
                params.endDate = localToday;
            }

            getOrders(params);
        } catch (error) {
            console.error('Error initiating socket fetch:', error);
            setLoading(false);
        }
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        // 🎯 RESTORE LOGIC FROM HISTORY PAGE
        const resDate = searchParams.get('restoreDate');
        const resStore = searchParams.get('restoreStore');

        if (resDate) setDateRange([moment(resDate).toDate()]);
        if (resStore) setSelectedStoreId(resStore);

        // 👮🏽‍♂️ ROLE-BASED DATE RESTRICTION: Allow Today & Yesterday ONLY for Managers
        if (storedRole === 'store_manager' && dateRange && dateRange[0]) {
            const selectedDate = moment(dateRange[0]).startOf('day');
            const today = moment().startOf('day');
            const diff = today.diff(selectedDate, 'days');
            
            if (diff > 1 || diff < 0) {
                Swal.fire('Restricted', 'Managers can only view reports for Today and Yesterday.', 'warning');
                setDateRange('');
                return;
            }
        }
        fetchOrders(page);
    }, [page, pageSize, debouncedSearch, status, dateRange, selectedStoreId]);

    // Socket Listener
    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        const role = localStorage.getItem('role');
        const userDString = localStorage.getItem('userData');
        let cStoreId = 'all';

        if ((role === 'store_manager' || role === 'warehouse_manager') && userDString) {
            try {
                const userData = JSON.parse(userDString);
                cStoreId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id || 'all';
            } catch (e) { }
        }

        // 1️⃣ First attach the listener for data updates only
        subscribeToOrders((err, data) => {
            if (err) {
                setLoading(false);
                return;
            }

            const orderInfo = data.order || data;
            const orderStoreId = orderInfo.storeId || orderInfo.store_id || orderInfo.warehouseId || orderInfo.warehouse_id;

            // Check if the update is for this store
            const isRelevant = cStoreId === 'all' || (orderStoreId && String(orderStoreId) === String(cStoreId));

            if (data.type === 'NEW_ORDER') {
                if (isRelevant) fetchOrders(pageRef.current); // Refresh table for new order
            } else if (data.type === 'STATUS_CHANGE' || data.type === 'ORDER_STATUS_CHANGED' || data.type === 'ORDER_CANCELLED') {
                if (isRelevant) fetchOrders(pageRef.current); // Refresh table for status change
            } else if (data.eventType === 'INITIAL_BATCH' || data.type === 'INITIAL_BATCH') {
                const orders = data.orders || data.data || [];
                const mappedData = mapOrderData(orders);
                setOrderData(mappedData);
                setTotalRecords(data.totalCount || orders.length);

                if (data.stats) {
                    setTotalOrders(data.stats.totalOrder || 0);
                    setTodayOrders(data.stats.periodOrder || 0);
                    setTodayRevenue(data.stats.periodRevenue || 0);
                    setQrRevenue(data.stats.qrRevenue || 0);
                    setCashRevenue(data.stats.cashRevenue || 0);
                    setPgRevenue(data.stats.pgRevenue || 0);
                }
                setLoading(false);
            }
        });

        // 2️⃣ Then join/fetch initial data
        joinStore(selectedStoreId || cStoreId);
        fetchOrders(pageRef.current);

        // Fetch active Riders with store_id filtering if supported by active endpoint
        const ridersUrl = cStoreId !== 'all' ? `/management/admin/riders/active?store_id=${cStoreId}` : '/management/admin/riders/active';
        callApi(ridersUrl, 'GET')
            .then((res: any) => {
                if (res && res.data) setRiders(res.data);
            })
            .catch((err) => {
                console.error('Failed to fetch riders:', err);
                setRiders([]);
            });

        return () => {
            // Only unsubscribe locally if we want, but App.tsx also has a sub
            // Note: unsubscribeFromOrders removes ALL listeners for those events
            // So if multiple components use it, they might interfere.
            // In a better design, we'd use separate event names or a publisher-subscriber pattern.
            // For now, let's just leave it to keep the table updated.
        };
    }, []);


    const handlePaymentUpdate = async (orderId: any, paymentMethod: string, breakdown?: any) => {
        try {
            const response = await callApi('/management/store-manager/order-payment', 'PATCH', {
                orderId,
                paymentMethod,
                breakdown
            });

            if (response.status === 'success') {
                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    showCloseButton: true,
                    customClass: {
                        popup: 'color-success',
                    },
                });
                toast.fire({
                    icon: 'success',
                    title: 'Payment method updated',
                    padding: '10px 20px',
                });
                fetchOrders(page);
            }
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Failed to update payment', 'error');
        }
    };

    const handleStatusUpdate = async (orderId: any, newStatus: string) => {
        try {
            const response = await callApi(`/management/store-manager/order-status`, 'PATCH', {
                orderId: orderId,
                status: newStatus
            });
            if (response) {
                fetchOrders(page);
                Swal.fire({ icon: 'success', title: 'Status Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        if (selectedStoreId === 'all') {
            showMessage('Please select a specific Dark Store to finalize the report', 'warning');
            return;
        }

        const reportDate = (dateRange && dateRange.length > 0) 
            ? moment(dateRange[0]).format('YYYY-MM-DD') 
            : moment().format('YYYY-MM-DD');

        if (storedRole === 'store_manager' || storedRole === 'warehouse_manager') {
            const daysDiff = moment().diff(moment(reportDate), 'days');
            if (daysDiff > 1 || daysDiff < 0) {
                showMessage('Managers can only finalize reports for Today or Yesterday.', 'error');
                return;
            }
        }

        setLoading(true);
        try {
            const checkUrl = `/management/admin/reports/check?reportDate=${reportDate}&storeId=${selectedStoreId}`;
            const checkRes: any = await callApi(checkUrl, 'GET');
            if (checkRes && checkRes.data?.exists) {
                showMessage(`Report for ${reportDate} is already closed and archived.`, 'info');
                setLoading(false);
                return;
            }

            const ordersToReport = orderData.filter((o: any) => {
                const oDate = moment(o.createdAt).format('YYYY-MM-DD');
                return oDate === reportDate && o.status?.toLowerCase() === 'delivered';
            });

            if (!ordersToReport || ordersToReport.length === 0) {
                showMessage(`No delivered orders found in the current list for ${reportDate}!`, 'error');
                setLoading(false);
                return;
            }

            // 💰 PAYMENT INTEGRITY GUARD: Block if any payments are unconfirmed
            const unconfirmed = ordersToReport.filter(o => !o.payment_confirmed);
            if (unconfirmed.length > 0) {
                showMessage(`Blocked: ${unconfirmed.length} orders have PENDING payments. Confirm them first!`, 'error');
                setLoading(false);
                return;
            }

            let totalCash = 0; let totalUPI = 0; let grandTotal = 0;
            const tableRows = ordersToReport.map((order: any, index: number) => {
                let calc: any = {};
                try { calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {}); } catch (e) { }
                const rowTotal = parseFloat(calc.total || order.totalAmount || 0);
                const breakdown = calc.payment_breakdown || {};
                const pMethod = (order.pay || order.paymentMethod || '').toUpperCase();
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
                
                // 🛵 ROBUST RIDER NAME RESOLUTION (Sync with screen list & backend)
                const rName = order.rider?.user?.name || order.rider?.name || order.rider_name || order.Rider?.name || order.riderName || (typeof order.rider === 'string' ? order.rider : 'N/A');

                return [
                    index + 1, order.order_id || 'N/A', moment(order.createdAt).format('HH:mm'),
                    rowTotal.toFixed(2), rName, pMethod, cash.toFixed(2), upi.toFixed(2),
                    order.payment_confirmed ? 'Confirmed' : 'Pending', order.status?.toUpperCase(),
                    `${handoverMin} Min`, `${deliveryMin} Min`
                ];
            });

            if (format === 'pdf') {
                const doc = new jsPDF('l', 'mm', 'a4');
                
                // 📝 HEADER (Image 2 Style)
                doc.setFont('courier', 'bold');
                doc.setFontSize(20);
                doc.text("Daily Transaction Report", 148.5, 20, { align: 'center' });
                
                doc.setFont('courier', 'normal');
                doc.setFontSize(12);
                doc.text(`Date: ${reportDate} 00:00:00`, 148.5, 28, { align: 'center' });
                
                const storeName = allStores.find(s => s.id === selectedStoreId)?.name || selectedStoreId;
                doc.setFont('courier', 'bold');
                doc.text(`Store: ${storeName}`, 148.5, 35, { align: 'center' });

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

                // 💰 TOTALS SUMMARY (Image 2 Style)
                const finalY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(11);
                doc.setFont('courier', 'bold');
                doc.text(`Total Cash Amount ${totalCash.toFixed(2)}`, 14, finalY);
                doc.text(`Total UPI Amount ${totalUPI.toFixed(2)}`, 14, finalY + 6);
                
                doc.setLineWidth(0.5);
                doc.line(14, finalY + 10, 150, finalY + 10);
                
                doc.setFontSize(14);
                doc.text(`Total Amount ${grandTotal.toFixed(2)}`, 14, finalY + 18);

                doc.save(`Kuiklo_Daily_Report_${storeName}_${reportDate}.pdf`);
            }

            await callApi('/management/admin/reports', 'POST', {
                storeId: selectedStoreId, reportDate: reportDate,
                totalOrders: ordersToReport.length, totalCash: totalCash,
                totalUpi: totalUPI, grandTotal: grandTotal,
                metadata: { generated_at: new Date().toISOString() }
            });

            showMessage(`Report for ${reportDate} Finalized & Saved!`, 'success');
        } catch (e) {
            console.error(e);
            showMessage('Action Failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRiderAssign = async (orderId: any, riderId: string | null, status: string | null = null) => {
        try {
            const payload: { orderId: any; riderId?: string | null; status?: string | null } = {
                orderId: orderId,
            };

            if (riderId !== null) {
                payload.riderId = riderId;
            }
            if (status !== null) {
                payload.status = status;
            }

            const response = await callApi(`/management/store-manager/assign-rider`, 'POST', payload);
            if (response) {
                fetchOrders(page);
                Swal.fire({ icon: 'success', title: 'Rider Assigned', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        } catch (error) {
            console.error('Error assigning rider:', error);
        }
    };

    const handleViewOrder = (order: any) => {
        localStorage.setItem(`view_order_${order.originalId || order.id || order._id}`, JSON.stringify(order));
        router.push(`/orders/view/${order.originalId || order.id || order._id}`);
    };

    const handlePrint = (order: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Parse JSON strings if they are strings
        let calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {});

        const finalDateTime = order.orderTime && order.orderTime !== 'N/A' ? order.orderTime : 'N/A';

        let itemsHtml = '';
        const itemsList = order.items || order.products || order.orderItems || [];
        if (itemsList.length > 0) {
            // 🏷️ Group items by Category
            const groups: { [key: string]: any[] } = itemsList.reduce((acc: any, item: any) => {
                const cat = item.categoryName || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {});

            itemsHtml = Object.entries(groups).map(([catName, groupItems]) => {
                const groupHtml = groupItems.map((item: any) => {
                    const name = item.product_name || item.Product_name || item.item_name || item.productName || item.name || item.product?.name || item.item?.name || 'Product';
                    const price = Number(item.unit_amount || item.price || item.unit_price || item.product_price || item.product?.price || item.amount || item.selling_price || 0);
                    const quantity = Number(item.quantity || 1);
                    const total = Number(item.total_item_amount || item.total || item.product_total || (price * quantity) || 0);

                    return `
                        <div class="item" style="padding-left: 8px;">
                            <div class="item-left">
                                ${name} (${price.toFixed(2)} x ${quantity})
                            </div>
                            <div class="item-right">
                                ${total.toFixed(2)}
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                    <div style="margin-top: 8px; margin-bottom: 4px;">
                        <div class="bold" style="text-decoration: underline; font-size: 11px;">${catName.toUpperCase()}</div>
                        ${groupHtml}
                    </div>
                `;
            }).join('');
        }

        const formattedAddress = order.formatted_address ? `
            <div class="bold small">${order.formatted_address}</div>
        ` : (order.order_address ? `<div class="bold small">${typeof order.order_address === 'string' ? order.order_address : JSON.stringify(order.order_address)}</div>` : '<div class="center">Address Not Provided</div>');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Receipt # ${order.order_id}</title>
                <style>
                    body { font-family: monospace; background: #fff; margin: 0; padding: 0; }
                    .receipt { width: 260px; margin: auto; padding: 10px; color: #000; font-size: 11px; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .small { font-size: 10px; }
                    .line { border-top: 1px dashed #000; margin: 6px 0; }
                    .item { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; }
                    .item-left { width: 75%; word-break: break-word; }
                    .item-right { width: 25%; text-align: right; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="center bold">Kuiklo Dark Store</div>
                    <div class="center small">ORDER • QUALITY CHECK • PAY</div>
                    <div class="line"></div>
                    <div class="center bold">Order #${order.order_id}</div>
                    <div class="row">
                        <span class="bold">Date/Time:</span>
                        <span>${finalDateTime}</span>
                    </div>
                    <div class="line"></div>
                    <div>Delivery Partner: ${(typeof order.rider === 'object' ? order.rider?.name : (order.rider !== '-' ? order.rider : null)) ||
            order.riderName ||
            'N/A'
            }</div>
                    <div class="line"></div>
                    <div class="bold">Customer Details</div>
                    <div class="row">
                        <span>Name: ${order.customerName || order.user?.name || 'Guest'}</span>
                        <span>Phone: ${order.customerPhone || order.user?.phone || 'N/A'}</span>
                    </div>
                    <div>${formattedAddress}</div>
                    <div class="line"></div>
                    <div class="bold">ITEMS</div>
                    ${itemsHtml || '<div class="center">No items listed</div>'}
                    <div class="line"></div>
                    <div class="row">
                        <span>Sub-total</span>
                        <span>₹${calc.subtotal || order.subTotal || 0}</span>
                    </div>
                    ${calc.discount ? `<div class="row text-danger"><span>Discount</span><span>-₹${calc.discount}</span></div>` : ''}
                    <div class="row">
                        <span>Delivery Fee</span>
                        <span>₹${calc.delivery_fee || 0}</span>
                    </div>
                    <div class="row">
                        <span>Handling Fee</span>
                        <span>₹${calc.handling_fee || 0}</span>
                    </div>
                    ${calc.small_cart_fee ? `<div class="row"><span>Small Cart Fee</span><span>₹${calc.small_cart_fee}</span></div>` : ''}
                    ${calc.platform_fee ? `<div class="row"><span>Platform Fee</span><span>₹${calc.platform_fee}</span></div>` : ''}
                    <div class="row bold">
                        <span>AMOUNT</span>
                        <span>₹${calc.total || order.totalAmount || 0}</span>
                    </div>
                    <div class="line"></div>
                    <div class="center font-bold">Payment Method: ${order.pay || order.paymentMethod || 'COD'}</div>
                    <div class="line"></div>
                    <div class="center small">
                        Need help? ${order.store?.email || 'support@kuiklo.com'} / ${order.store?.phone || '7050014684'}<br/>
                        Thank you for shopping with Kuiklo ❤️<br/>
                        We hope to serve you again soon.
                    </div>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 100);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        // Don't automatically return true for store_manager/admin anymore
        // Only roles like customer or guest (not present in this dashboard usually) would bypass
        if (uRole !== 'admin' && uRole !== 'store_manager' && uRole !== 'warehouse_manager') return true;
        
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };


    const columns = [
        { key: 'order_id', label: 'ORDER ID' },
        { key: 'order_timing', label: 'TIMING' },
        { key: 'customer_info', label: 'CUSTOMER' },
        { key: 'address', label: 'ADDRESS' },
        { key: 'amount', label: 'AMOUNT' },
        { key: 'rider', label: 'RIDER' },
        { key: 'pay', label: 'PAY' },
        { key: 'actions', label: 'ACTION' },
        { key: 'order_status', label: 'STATUS' },
        { key: 'storeName', label: 'STORE' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                    </li>
                    <li>
                        <span className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">Orders</span>
                    </li>
                    <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>Order List</span>
                    </li>
                </ul>

                <div className="flex items-center gap-3 ml-auto">
                    {(storedRole === 'admin' || storedRole === 'super_admin') && (
                        <div className="bg-white dark:bg-[#1b2e4b] rounded-lg border border-gray-100 dark:border-none shadow-sm h-[36px] flex items-center px-1">
                            <select
                                className="form-select py-1 text-xs font-black border-none focus:ring-0 w-[140px] appearance-none cursor-pointer uppercase tracking-tight text-gray-700 dark:text-gray-200"
                                value={selectedStoreId}
                                onChange={(e) => {
                                    setSelectedStoreId(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">GLOBAL VIEW</option>
                                {allStores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Link
                        href="/orders/reports"
                        className="btn btn-outline-dark btn-sm flex items-center gap-2 px-3 py-1.5 font-bold uppercase transition-all shadow-sm h-[36px]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary"><path d="M12 8V12L15 15" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9"/></svg>
                        History
                    </Link>

                    <button
                        onClick={() => handleExport('pdf')}
                        className="btn btn-primary btn-sm flex items-center gap-2 px-4 py-1.5 font-bold uppercase shadow-lg transform active:scale-95 transition-all text-[11px] bg-gradient-to-r from-primary to-blue-600 border-none h-[36px]"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20m10-10H2" /></svg>
                        Finalize Report
                    </button>
                </div>
            </div>

            <UserManagerTable
                title="Orders"
                data={orderData}
                columns={columns}
                userType="Order"
                totalRecords={totalRecords}
                page={page}
                pageSize={pageSize}
                onPageChange={(p: number) => setPage(p)}
                onPageSizeChange={(val: number) => { setPageSize(val); setPage(1); }}
                totalUsers={totalOrders}
                todayUsers={todayOrders}
                todayRevenue={todayRevenue}
                qrRevenue={qrRevenue}
                cashRevenue={cashRevenue}
                pgRevenue={pgRevenue}
                search={search}
                onSearchChange={setSearch}
                status={status}
                onStatusChange={(val) => { setStatus(val); setPage(1); }}
                dateRange={dateRange}
                onDateRangeChange={(val) => { setDateRange(val); setPage(1); }}
                onStatusUpdate={handleStatusUpdate}
                onRiderAssign={handleRiderAssign}
                onViewClick={handleViewOrder}
                onPrint={handlePrint}
                onPaymentUpdate={handlePaymentUpdate}
                onOrderEdit={hasPerm('orders', 'update') ? handleOrderEdit : undefined}
                riders={riders}
                addButtonLabel="Create New Order"
                hideFilter={false}
                loading={loading}
                onExportClick={handleExport}
            />
        </div>
    );
};

const handleOrderEdit = async (order: any) => {
    const items = [...(order.items || [])];
    if (items.length === 0) {
        Swal.fire('Error', 'No items found in this order to edit.', 'error');
        return;
    }

    let editedItems = items.map(it => ({ ...it, newQuantity: it.quantity }));

    const renderItems = () => {
        return editedItems.map((it, idx) => `
            <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all rounded-2xl mb-3 group" id="item-row-${it.productId}">
                <div class="flex flex-col text-left flex-1 min-w-0 pr-4">
                    <span class="text-[12px] font-black text-gray-800 dark:text-white uppercase tracking-tight truncate mb-0.5">${it.productName}</span>
                    <span class="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full w-fit">₹${it.unit_amount} / unit</span>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                    <div class="flex items-center bg-gray-50 dark:bg-gray-900 rounded-xl p-1 border border-gray-100 dark:border-gray-700 h-10">
                        <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 text-gray-400 hover:text-danger transition-all qty-minus active:scale-90" data-idx="${idx}">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        <input type="number" class="w-10 text-center text-sm font-black border-none bg-transparent focus:ring-0 qty-input p-0 dark:text-white" value="${it.newQuantity}" readonly id="qty-val-${idx}">
                        <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-success/10 text-gray-400 hover:text-success transition-all qty-plus active:scale-90" data-idx="${idx}">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>
                    <button type="button" class="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-danger hover:bg-danger/5 rounded-full transition-all item-remove active:scale-75" data-idx="${idx}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');
    };

    const result = await Swal.fire({
        title: `
            <div class="flex flex-col items-center gap-2 pt-1 border-b border-gray-100 pb-4 mb-2">
                <div class="w-14 h-14 rounded-3xl bg-warning/10 flex items-center justify-center relative shadow-inner">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning border-2 border-white animate-pulse"></div>
                </div>
                <div class="text-center mt-2">
                    <h2 class="text-lg font-black uppercase tracking-tighter text-gray-800 dark:text-white leading-tight">Edit Order</h2>
                    <p class="text-[10px] font-black text-primary/60 tracking-[0.2em] uppercase mt-1">ID: #${order.order_id?.toString().slice(-6)}</p>
                </div>
            </div>
        `,
        html: `
            <div class="max-h-[400px] overflow-y-auto px-1 pt-2 custom-scrollbar" id="items-container" style="scrollbar-width: thin;">
                ${renderItems()}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'CONFIRM CHANGES 🚀',
        cancelButtonText: 'DISCARD',
        confirmButtonColor: '#4361ee',
        focusConfirm: false,
        width: '420px',
        customClass: {
            popup: 'rounded-[2rem] border-none shadow-2xl p-6 bg-white dark:bg-gray-900',
            confirmButton: 'rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest w-full mt-4 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all',
            cancelButton: 'rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest w-full mt-2 border-none bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 transition-all'
        },
        didOpen: (popup) => {
            const container = popup.querySelector('#items-container');
            container?.addEventListener('click', (e: any) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const idx = parseInt(btn.dataset.idx);
                if (btn.classList.contains('qty-plus')) {
                    editedItems[idx].newQuantity++;
                    (popup.querySelector(`#qty-val-${idx}`) as HTMLInputElement).value = editedItems[idx].newQuantity.toString();
                } else if (btn.classList.contains('qty-minus')) {
                    if (editedItems[idx].newQuantity > 1) {
                        editedItems[idx].newQuantity--;
                        (popup.querySelector(`#qty-val-${idx}`) as HTMLInputElement).value = editedItems[idx].newQuantity.toString();
                    }
                } else if (btn.classList.contains('item-remove')) {
                    if (editedItems.length <= 1) {
                        Swal.showValidationMessage('Cannot remove last item. Please cancel order instead.');
                        return;
                    }
                    editedItems.splice(idx, 1);
                    (popup.querySelector('#items-container') as HTMLElement).innerHTML = renderItems();
                }
                Swal.resetValidationMessage();
            });
        },
        preConfirm: async () => {
            try {
                const payload = {
                    orderId: order.originalId,
                    items: editedItems.map(it => ({ productId: it.productId, quantity: it.newQuantity }))
                };
                const { callApi } = await import('@/utils/api');
                const response = await callApi('/management/store-manager/order/edit-items', 'PATCH', payload);
                if (response.status === 'error') throw new Error(response.message);
                return response.data;
            } catch (err: any) {
                Swal.showValidationMessage(`Error: ${err.message}`);
                return false;
            }
        }
    });

    if (result.isConfirmed) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-sm uppercase font-black">Changes Applied!</span>',
            text: 'Inventory and billing have been updated successfully.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'rounded-2xl border-none shadow-xl'
            }
        });
    }
};



export default OrderList;
