'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import { subscribeToOrders, joinStore, unsubscribeFromOrders, getOrders } from '@/utils/socket';
import { useRef } from 'react';


const OrderList = () => {
    const router = useRouter();
    const [orderData, setOrderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
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

    // Refs for stable socket callback values
    const pageRef = useRef(1);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);


    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const mapOrderData = (orders: any[]) => {
        return orders.map((order: any) => ({
            ...order,
            id: order.id || order._id,
            originalId: order.id || order._id,
            order_id: order.order_id || order.id || order._id || order.shortId || 'N/A',
            orderTime: (order.createdAt || order.created_at) ? new Date(order.createdAt || order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
            deliveryTime: order.delivery_at ? new Date(order.delivery_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--',
            duration: order.delivery_duration || '--',
            customerName: order.user?.name || 'Unknown',
            customerPhone: order.user?.phone || 'N/A',
            isNewCustomer: order.isNewCustomer || false,
            rider: order.rider?.name || '-',
            pay: order.paymentMethod || 'COD',
            amount: `₹${order.totalAmount || 0}`,
            status: order.status || 'Pending',
            storeName: order.store?.name || 'N/A'
        }));
    };

    const fetchOrders = (currentPage: number) => {
        try {
            setLoading(true);
            
            // Determine storeId based on role
            const storedRole = localStorage.getItem('role');
            const userDataString = localStorage.getItem('userData');
            let storeId = 'all';
            
            if (storedRole === 'store_manager' && userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    storeId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || 'all';
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }

            const params: any = {
                storeId: storeId,
                page: currentPage,
                limit: pageSize,
                search: debouncedSearch,
            }

            if (status !== 'all') params.status = status;

            if (dateRange && dateRange.length === 2) {
                // Formatting dates to YYYY-MM-DD as requested
                const start = new Date(dateRange[0]);
                const end = new Date(dateRange[1]);
                params.startDate = start.toISOString().split('T')[0];
                params.endDate = end.toISOString().split('T')[0];
            }

            // Emit the get_orders event via socket
            getOrders(params);
        } catch (error) {
            console.error('Error initiating socket fetch:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(page);
    }, [page, debouncedSearch, status, dateRange]);

    // Socket Listener
    useEffect(() => {
        // 1️⃣ First attach the listener for data updates only
        subscribeToOrders((err, data) => {
            if (err) {
                setLoading(false);
                return;
            }

            if (data.type === 'NEW_ORDER') {
                fetchOrders(pageRef.current); // Refresh table for new order
            } else if (data.type === 'STATUS_CHANGE' || data.type === 'ORDER_STATUS_CHANGED' || data.type === 'ORDER_CANCELLED') {
                fetchOrders(pageRef.current); // Refresh table for status change
            } else if (data.eventType === 'INITIAL_BATCH' || data.type === 'INITIAL_BATCH') {
                const orders = data.orders || data.data || [];
                const mappedData = mapOrderData(orders);
                setOrderData(mappedData);
                setTotalRecords(data.totalCount || orders.length);

                if (data.stats) {
                    setTotalOrders(data.stats.totalOrder || 0);
                    setTodayOrders(data.stats.todayOrder || 0);
                    setTodayRevenue(data.stats.todayRevenue || 0);
                    setQrRevenue(data.stats.qrRevenue || 0);
                    setCashRevenue(data.stats.cashRevenue || 0);
                    setPgRevenue(data.stats.pgRevenue || 0);
                }
                setLoading(false);
            }
        });

        // 2️⃣ Then join/fetch initial data
        const storedRole = localStorage.getItem('role');
        const userDataString = localStorage.getItem('userData');
        let joinId = 'all';
        if (storedRole === 'store_manager' && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                joinId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || 'all';
            } catch(e) {}
        }
        joinStore(joinId);
        fetchOrders(pageRef.current);

        // Fetch Riders
        callApi('/management/admin/riders', 'GET').then((res: any) => {
            if (res && res.data) setRiders(res.data);
        });

        return () => {
            // Only unsubscribe locally if we want, but App.tsx also has a sub
            // Note: unsubscribeFromOrders removes ALL listeners for those events
            // So if multiple components use it, they might interfere.
            // In a better design, we'd use separate event names or a publisher-subscriber pattern.
            // For now, let's just leave it to keep the table updated.
        };
    }, []);


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
        let addr = typeof order.order_address === 'string' ? JSON.parse(order.order_address) : (order.order_address || order.address || {});

        const finalDateTime = order.orderTime && order.orderTime !== 'N/A' ? order.orderTime : 'N/A';

        let itemsHtml = '';
        const itemsList = order.items || order.products || order.orderItems || [];
        if (itemsList.length > 0) {
            itemsHtml = itemsList.map((item: any) => {
                const name = item.product_name || item.Product_name || item.item_name || item.productName || item.name || item.product?.name || item.item?.name || 'Product';
                const price = Number(item.unit_amount || item.price || item.unit_price || item.product_price || item.product?.price || item.amount || item.selling_price || 0);
                const quantity = Number(item.quantity || 1);
                const total = Number(item.total_item_amount || item.total || item.product_total || (price * quantity) || 0);

                return `
                    <div class="item">
                        <div class="item-left">
                            ${name} (${price.toFixed(2)} x ${quantity})
                        </div>
                        <div class="item-right">
                            ${total.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        const formattedAddress = addr ? `
            ${addr.house_no || addr.address_line_1 || ''} ${addr.street || addr.address_line_2 || ''}<br/>
            ${addr.landmark ? 'Landmark: ' + addr.landmark : ''}
        ` : 'Address Not Provided';

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

    const columns = [
        { key: 'order_id', label: 'ORDER ID' },
        { key: 'order_timing', label: 'TIMING' },
        { key: 'customer_info', label: 'CUSTOMER' },
        { key: 'amount', label: 'AMOUNT' },
        { key: 'rider', label: 'RIDER' },
        { key: 'pay', label: 'PAY' },
        { key: 'actions', label: 'ACTION' },
        { key: 'order_status', label: 'STATUS' },
        { key: 'storeName', label: 'STORE' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
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

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Orders"
                    data={orderData}
                    columns={columns}
                    userType="Order"
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p: number) => setPage(p)}
                    totalUsers={totalOrders}
                    todayUsers={todayOrders}
                    todayRevenue={todayRevenue}
                    qrRevenue={qrRevenue}
                    cashRevenue={cashRevenue}
                    pgRevenue={pgRevenue}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusUpdate={handleStatusUpdate}
                    onRiderAssign={handleRiderAssign}
                    onPrint={handlePrint}
                    onViewClick={handleViewOrder}
                    riders={riders}
                    addButtonLabel="Create New Order"
                />
            )}
        </div>
    );
};

export default OrderList;
