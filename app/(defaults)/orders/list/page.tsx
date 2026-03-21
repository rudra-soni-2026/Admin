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
            id: order.id || order._id,
            originalId: order.id || order._id,
            order_id: order.order_id || order.id || order._id,
            orderTime: order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
            deliveryTime: order.delivery_at ? new Date(order.delivery_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--',
            duration: order.delivery_duration || '--',
            customerName: order.user?.name || 'Unknown',
            customerPhone: order.user?.phone || 'N/A',
            isNewCustomer: order.isNewCustomer || false,
            rider: order.rider?.name || '-',
            pay: order.paymentMethod || 'COD',
            amount: `₹${order.totalAmount || 0}`,
            status: order.status || 'Pending',
            store: order.store?.name || 'N/A'
        }));
    };

    const fetchOrders = (currentPage: number) => {
        try {
            setLoading(true);
            const params: any = {
                storeId: 'all',
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
        joinStore('all');
        fetchOrders(pageRef.current);

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
            const response = await callApi(`/management/admin/orders/${orderId}/status`, 'PATCH', {
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

    const handleRiderAssign = async (orderId: any, riderId: string) => {
        try {
            const response = await callApi(`/management/admin/orders/${orderId}/assign-rider`, 'POST', {
                riderId: riderId
            });
            if (response) {
                fetchOrders(page);
                Swal.fire({ icon: 'success', title: 'Rider Assigned', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        } catch (error) {
             console.error('Error assigning rider:', error);
        }
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
        { key: 'store', label: 'STORE' },
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
                    title="Today's Orders"
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
                    onStatusToggle={handleStatusUpdate}
                    onRiderAssign={handleRiderAssign}
                    addButtonLabel="Create New Order"
                />
            )}
        </div>
    );
};

export default OrderList;
