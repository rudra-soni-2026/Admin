'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const OrderList = () => {
    const router = useRouter();
    const [orderData, setOrderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [todayOrders, setTodayOrders] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [qrRevenue, setQrRevenue] = useState(0);
    const [cashRevenue, setCashRevenue] = useState(0);
    const [pgRevenue, setPgRevenue] = useState(0);

    // Filter States
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState<any>('');

    // Dummy Data matching the screenshot requirements
    const fetchDummyOrders = () => {
        setLoading(true);
        setTimeout(() => {
            const dummyData = [
                {
                    id: '1',
                    originalId: '1',
                    order_id: '69B1515D0DAE6',
                    orderTime: '11 Mar, 16:56',
                    deliveryTime: '17:10',
                    duration: '14 min',
                    customerName: 'Guriya singh',
                    customerPhone: '7857899468',
                    isNewCustomer: true,
                    rider: 'Pradeep',
                    pay: 'COD',
                    amount: '₹47.00',
                    status: 'In_transit',
                    store: 'Pat-4'
                },
                {
                    id: '2',
                    originalId: '2',
                    order_id: '69B150EACF637',
                    orderTime: '11 Mar, 16:54',
                    deliveryTime: '17:05',
                    duration: '11 min',
                    customerName: 'Prashant Kumar Acha',
                    customerPhone: '7667908461',
                    isNewCustomer: true,
                    rider: 'Krishna',
                    pay: 'UPI',
                    amount: '₹62.00',
                    status: 'Delivered',
                    store: 'PAT-2'
                },
                {
                    id: '3',
                    originalId: '3',
                    order_id: '69B14E5B1F7AC',
                    orderTime: '11 Mar, 16:43',
                    deliveryTime: '17:03',
                    duration: '20 min',
                    customerName: 'Alka Mishra',
                    customerPhone: '7654664961',
                    isNewCustomer: true,
                    rider: 'Rajnish',
                    pay: 'PAYU',
                    amount: '₹121.00',
                    status: 'In_transit',
                    store: 'PAT-1'
                },
                {
                    id: '4',
                    originalId: '4',
                    order_id: '69B14DBF4DFA1',
                    orderTime: '11 Mar, 16:40',
                    deliveryTime: '17:20',
                    duration: '40 min',
                    customerName: 'Umesh Kumar',
                    customerPhone: '9308845286',
                    isNewCustomer: false,
                    rider: 'Niket Kumar',
                    pay: 'COD',
                    amount: '₹999.00',
                    status: 'In_transit',
                    store: 'PAT-1'
                },
                {
                    id: '5',
                    originalId: '5',
                    order_id: '69B14D2D65D97',
                    orderTime: '11 Mar, 16:38',
                    deliveryTime: '16:50',
                    duration: '12 min',
                    customerName: 'Kalpana Sahni',
                    customerPhone: '7033970263',
                    isNewCustomer: false,
                    rider: 'Nitish Kumar',
                    pay: 'QR',
                    amount: '₹124.00',
                    status: 'Delivered',
                    store: 'PAT-3'
                },
                {
                    id: '6',
                    originalId: '6',
                    order_id: '69B14BB759473',
                    orderTime: '11 Mar, 16:32',
                    deliveryTime: '16:45',
                    duration: '13 min',
                    customerName: 'Vijay Prakash',
                    customerPhone: '7004754809',
                    isNewCustomer: false,
                    rider: 'Shravan',
                    pay: 'Multi',
                    amount: '₹273.00',
                    status: 'Delivered',
                    store: 'PAT-1'
                },
                {
                    id: '7',
                    originalId: '7',
                    order_id: '69B14B6B0D4ED',
                    orderTime: '11 Mar, 16:30',
                    deliveryTime: '--:--',
                    duration: '--',
                    customerName: 'Utkarsh Singh',
                    customerPhone: '7488297438',
                    isNewCustomer: true,
                    rider: '-',
                    pay: 'COD',
                    amount: '₹143.00',
                    status: 'Cancelled',
                    store: 'PAT-2'
                }
            ];
            
            setOrderData(dummyData);
            setTotalRecords(dummyData.length);
            setTotalOrders(150);
            setTodayOrders(12);
            setTodayRevenue(15420);
            setQrRevenue(8200);
            setCashRevenue(4120);
            setPgRevenue(3100);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchDummyOrders();
    }, [page, search, status, dateRange]);

    const handleStatusUpdate = (orderId: any, newStatus: string) => {
        setOrderData((prev) => 
            prev.map(order => order.originalId === orderId ? { ...order, status: newStatus } : order)
        );
    };

    const handleRiderAssign = (orderId: any, newRider: string) => {
        setOrderData((prev) => 
            prev.map(order => order.originalId === orderId ? { ...order, rider: newRider } : order)
        );
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
                    onPageChange={(p) => setPage(p)}
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
