'use client';
import React, { useEffect, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconFilter from '@/components/icon/icon-filter';
import IconClock from '@/components/icon/icon-clock';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconSearch from '@/components/icon/icon-search';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconPlus from '@/components/icon/icon-plus';
import IconPrinter from '@/components/icon/icon-printer';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconTruck from '@/components/icon/icon-truck';
import IconCalendar from '@/components/icon/icon-calendar';
import IconShoppingCart from '@/components/icon/icon-shopping-cart';
import IconUsers from '@/components/icon/icon-users';
import IconBox from '@/components/icon/icon-box';
import IconTag from '@/components/icon/icon-tag';
import IconStar from '@/components/icon/icon-star';
import IconX from '@/components/icon/icon-x';
import IconMinusCircle from '@/components/icon/icon-minus-circle';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconEye from '@/components/icon/icon-eye';
import IconPencil from '@/components/icon/icon-pencil';
import FilterDrawer from '@/components/user-manager/filter-drawer';
import IconSquareCheck from '@/components/icon/icon-square-check';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface UserListTableProps {
    title: string;
    data: any[];
    columns: { key: string; label: string }[];
    totalRecords?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    totalUsers?: number;
    todayUsers?: number;
    todayRevenue?: number;
    qrRevenue?: number;
    cashRevenue?: number;
    pgRevenue?: number;
    search?: string;
    onSearchChange?: (val: string) => void;
    status?: string;
    onStatusChange?: (val: string) => void;
    dateRange?: any;
    onDateRangeChange?: (val: any) => void;
    onStatusToggle?: (userId: any, currentStatus: string) => void;
    onRiderAssign?: (orderId: any, riderId: string | null, status: string | null) => void;
    onViewClick?: (user: any) => void;
    userType?: string;
    onAddClick?: () => void;
    addButtonLabel?: string;
    riders?: any[];
    onPrint?: (item: any) => void;
    onStatusUpdate?: (orderId: any, newStatus: string) => void;
    onPaymentUpdate?: (orderId: any, paymentMethod: string, breakdown?: any) => void;
    hideFilter?: boolean;
    loading?: boolean;
}

const OrderListTable = ({
    title,
    data,
    columns,
    totalRecords = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    totalUsers = 0,
    todayUsers = 0,
    todayRevenue = 0,
    qrRevenue = 0,
    cashRevenue = 0,
    pgRevenue = 0,
    search = '',
    onSearchChange,
    status = 'all',
    onStatusChange,
    dateRange = '',
    onDateRangeChange,
    onStatusToggle,
    onRiderAssign,
    onViewClick,
    userType = 'User',
    onAddClick,
    addButtonLabel,
    riders = [],
    onPrint,
    onStatusUpdate,
    onPaymentUpdate,
    hideFilter = false,
    loading = false
}: UserListTableProps) => {
    const [showFilter, setShowFilter] = useState(false);
    const [stagedRiders, setStagedRiders] = useState<{ [key: string]: string }>({});
    const [paymentSubTypes, setPaymentSubTypes] = useState<{ [key: string]: string }>({});
    const [stagedType, setStagedType] = useState<{ [key: string]: string }>({});
    const [paymentBreakdowns, setPaymentBreakdowns] = useState<{ [key: string]: { cash: string; online: string } }>({});
    const [activeMultiOrderId, setActiveMultiOrderId] = useState<string | null>(null);

    const handleRiderAssignInternal = (orderId: string, rider: any) => {
        setStagedRiders({ ...stagedRiders, [orderId]: rider.name });
    };

    const [localSearch, setLocalSearch] = useState(search || '');

    // Sync local search when prop changes from outside
    useEffect(() => {
        if (search !== localSearch) {
            setLocalSearch(search || '');
        }
    }, [search]);

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        onSearchChange?.(val);
    };

    return (
        <div className="mt-1">
            <div className="panel overflow-visible">
                <div className="mb-1 flex flex-col items-center justify-between gap-1 sm:flex-row">
                    <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-lg font-black text-black dark:text-white-light tracking-tight">{title}</h5>
                        {userType === 'Order' && (
                            <div className="flex flex-wrap items-center gap-1">
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm font-bold">
                                    <span className="text-[9px] uppercase text-gray-400">TOT</span>
                                    <span className="text-xs text-black dark:text-white">{todayUsers}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm font-bold font-nunito">
                                    <span className="text-[9px] uppercase text-primary">REV</span>
                                    <span className="text-xs text-black dark:text-white">₹{todayRevenue?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm font-bold font-nunito text-warning">
                                    <span className="text-[9px] uppercase">CASH</span>
                                    <span className="text-xs text-black dark:text-white">₹{cashRevenue?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm font-bold font-nunito text-info">
                                    <span className="text-[9px] uppercase">QR</span>
                                    <span className="text-xs text-black dark:text-white">₹{qrRevenue?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white border border-gray-100 shadow-sm font-bold font-nunito text-secondary">
                                    <span className="text-[9px] uppercase">PG</span>
                                    <span className="text-xs text-black dark:text-white">₹{pgRevenue?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
                        <div className="relative flex-1 sm:flex-initial sm:w-48">
                            <input
                                id="global-search-input-orders" 
                                type="text"
                                placeholder="Search..."
                                className="form-input peer !bg-gray-50 !border-gray-100 focus:!border-primary/40 focus:!bg-white transition-all text-xs py-1 rounded-md"
                                value={localSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 ltr:right-[8px] rtl:left-[8px] peer-focus:text-primary">
                                <IconSearch className="h-3.5 w-3.5 opacity-40" />
                            </div>
                        </div>
                        {!hideFilter && (
                            <button type="button" className="btn btn-primary btn-sm border-primary bg-primary px-2.5 py-1 gap-1 shadow-sm transition-all" onClick={() => setShowFilter(true)}>
                                <IconFilter className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-bold uppercase">Filter</span>
                            </button>
                        )}
                        {onAddClick && (
                            <button type="button" className="btn btn-primary btn-sm border-primary bg-primary px-2.5 py-1 gap-1 shadow-sm transition-all" onClick={onAddClick}>
                                <IconPlus className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-bold uppercase">Add</span>
                            </button>
                        )}
                    </div>
                </div>

                <FilterDrawer
                    show={showFilter}
                    setShow={setShowFilter}
                    date={dateRange}
                    setDate={onDateRangeChange || (() => { })}
                    status={status}
                    setStatus={onStatusChange || (() => { })}
                />

                <div className="table-responsive mb-3 overflow-x-auto relative min-h-[200px]">
                    {/* Interior Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-[1px]">
                            <span className="inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-8 h-8 align-middle"></span>
                        </div>
                    )}
                    <table className="table-hover whitespace-nowrap min-w-[1000px]">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className={`px-2 py-2 text-[10px] tracking-wider font-bold uppercase text-gray-400 dark:text-white-light border-b border-gray-100 
                                        ${col.key === 'status' || col.key === 'order_status' ? 'text-center' : ''} 
                                        ${['ID', 'Status', 'PAY', 'ACTION', 'STORE'].includes(col.label) ? 'w-1' : ''}
                                    `}>
                                        {col.label}
                                    </th>
                                ))}
                                {userType !== 'Order' && <th className="text-center w-1 px-1 py-1 text-[10px] uppercase font-black tracking-tighter">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr key={item.id}>
                                        {columns.map((col) => (
                                            <td key={col.key} className={`px-2 py-1.5 ${col.key === 'status' ? 'text-center' : ''}`}>
                                                {col.key === 'order_id' ? (
                                                    <div
                                                        className="text-[12px] font-bold text-black dark:text-white tracking-tighter cursor-pointer hover:text-primary hover:underline transition-all"
                                                        onClick={() => onViewClick?.(item)}
                                                    >
                                                        #{item.order_id?.toString().slice(-6)}
                                                    </div>
                                                ) : col.key === 'user' || col.key === 'image' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-9 w-9 overflow-hidden rounded-full shrink-0">
                                                            <img src={(col.key === 'user' ? item.user?.image : item.image) || '/assets/images/profile-5.jpeg'} alt="profile" className="h-full w-full object-cover" />
                                                        </div>
                                                        {col.key === 'user' && <div className="font-semibold">{item.user?.name}</div>}
                                                    </div>
                                                ) : col.key === 'customer_info' ? (
                                                    <div className="flex flex-col leading-[1.1]">
                                                        <div className="text-[12px] font-bold text-gray-800 dark:text-white-light">
                                                            {item.customerName}
                                                            {item.isNewCustomer && <span className="ml-1 text-[8px] font-bold text-success uppercase">New</span>}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-400">{item.customerPhone}</div>
                                                    </div>
                                                ) : col.key === 'order_timing' || col.key === 'joinedDate' ? (
                                                    <div className="flex flex-col leading-[1.0] min-w-[100px]">
                                                        <div className="text-[11px] font-bold text-gray-800 dark:text-white-light">{item.orderTime || item[col.key]}</div>
                                                        {item.deliveryTime && (
                                                            <div className="text-[9px] font-medium text-gray-400">
                                                                DEL: {item.deliveryTime} {item.duration && <span className="ml-0.5 text-success/80">({item.duration})</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : col.key === 'payment_method' || col.key === 'pay' ? (
                                                    <div className="flex items-center min-w-[50px]">
                                                        <span className={`rounded border px-1 py-0.5 text-[9px] font-black uppercase tracking-wider ${(item.paymentMethod || item.pay) === 'Cash' || (item.paymentMethod || item.pay) === 'COD' ? 'border-orange-200 bg-orange-50 text-orange-600' :
                                                            (item.paymentMethod || item.pay) === 'QR' || (item.paymentMethod || item.pay) === 'UPI' ? 'border-cyan-200 bg-cyan-50 text-cyan-600' :
                                                                (item.paymentMethod || item.pay) === 'PG' || (item.paymentMethod || item.pay) === 'PAYU' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' :
                                                                    'border-slate-200 bg-slate-50 text-slate-600'
                                                            }`}>
                                                            {item.paymentMethod || item.pay}
                                                        </span>
                                                    </div>
                                                ) : col.key === 'amount' && userType === 'Order' ? (
                                                    <div className="flex flex-col min-w-[90px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                                {item.amount}
                                                            </div>
                                                            {paymentSubTypes[item.originalId] && (
                                                                <button
                                                                    onClick={() => {
                                                                        setPaymentSubTypes({ ...paymentSubTypes, [item.originalId]: '' });
                                                                        setStagedType({ ...stagedType, [item.originalId]: '' });
                                                                        setActiveMultiOrderId(null);
                                                                    }}
                                                                    className={`px-1 rounded border text-[7px] font-black uppercase transition-all hover:scale-105 active:scale-95 shadow-sm ${paymentSubTypes[item.originalId] === 'CASH' ? 'bg-success border-success text-white' :
                                                                        paymentSubTypes[item.originalId] === 'BANK' ? 'bg-info border-info text-white' :
                                                                            'bg-secondary border-secondary text-white'
                                                                        }`}
                                                                >
                                                                    {paymentSubTypes[item.originalId]}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {(item.status?.toLowerCase() === 'delivered') && ((item.paymentMethod || item.pay || '').toUpperCase() === 'CASH' || (item.paymentMethod || item.pay || '').toUpperCase() === 'COD') && !paymentSubTypes[item.originalId] && (
                                                            <div className="relative flex items-center gap-1 min-h-[22px]">
                                                                <button
                                                                    onClick={() => {
                                                                        setStagedType({ ...stagedType, [item.originalId]: 'CASH' });
                                                                        setActiveMultiOrderId(null);
                                                                    }}
                                                                    className={`px-1.5 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${stagedType[item.originalId] === 'CASH' ? 'bg-success border-success text-white' : 'bg-transparent border-success/20 text-success/60 hover:bg-success/5'}`}
                                                                >CASH</button>
                                                                <button
                                                                    onClick={() => {
                                                                        setStagedType({ ...stagedType, [item.originalId]: 'QR' });
                                                                        setActiveMultiOrderId(null);
                                                                    }}
                                                                    className={`px-1.5 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${stagedType[item.originalId] === 'QR' ? 'bg-info border-info text-white' : 'bg-transparent border-info/20 text-info/60 hover:bg-info/5'}`}
                                                                >QR</button>
                                                                <button
                                                                    onClick={() => {
                                                                        setStagedType({ ...stagedType, [item.originalId]: 'MULTI' });
                                                                        setActiveMultiOrderId(item.originalId);
                                                                    }}
                                                                    className={`px-1.5 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${item.originalId === activeMultiOrderId || stagedType[item.originalId] === 'MULTI' ? 'bg-secondary border-secondary text-white' : 'bg-transparent border-secondary/20 text-secondary'}`}
                                                                >MULTI</button>

                                                                {stagedType[item.originalId] && stagedType[item.originalId] !== 'MULTI' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setPaymentSubTypes({ ...paymentSubTypes, [item.originalId]: stagedType[item.originalId] });
                                                                            onPaymentUpdate?.(item.originalId, stagedType[item.originalId]);
                                                                            setStagedType({ ...stagedType, [item.originalId]: '' });
                                                                        }}
                                                                        className="w-4 h-4 flex items-center justify-center bg-success rounded-full text-white shadow-sm hover:scale-110 active:scale-90 transition-all ml-0.5"
                                                                    >
                                                                        <IconCircleCheck className="w-3 h-3" />
                                                                    </button>
                                                                )}

                                                                {activeMultiOrderId === item.originalId && (
                                                                    <div className="absolute right-0 top-full mt-1.5 z-[110] bg-white dark:bg-[#1b2e4b] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-1.5 flex items-center gap-1 animate-fade-in-up border border-gray-100 dark:border-white/10 min-w-[150px]">
                                                                        <div className="flex flex-col gap-1 w-full">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Cash Amount"
                                                                                className="w-full bg-gray-50 dark:bg-black/20 px-2 py-0.5 rounded text-[10px] font-black focus:outline-none border border-transparent focus:border-success/30 text-black dark:text-white"
                                                                                autoFocus
                                                                                value={paymentBreakdowns[item.originalId]?.cash || ''}
                                                                                onChange={(e) => setPaymentBreakdowns({ ...paymentBreakdowns, [item.originalId]: { ...(paymentBreakdowns[item.originalId] || { online: '' }), cash: e.target.value } })}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Online Amount"
                                                                                className="w-full bg-gray-50 dark:bg-black/20 px-2 py-0.5 rounded text-[10px] font-black focus:outline-none border border-transparent focus:border-info/30 text-black dark:text-white"
                                                                                value={paymentBreakdowns[item.originalId]?.online || ''}
                                                                                onChange={(e) => setPaymentBreakdowns({ ...paymentBreakdowns, [item.originalId]: { ...(paymentBreakdowns[item.originalId] || { cash: '' }), online: e.target.value } })}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const breakdown = paymentBreakdowns[item.originalId];
                                                                                setPaymentSubTypes({ ...paymentSubTypes, [item.originalId]: 'MULTI' });
                                                                                onPaymentUpdate?.(item.originalId, 'MULTI', { cash: Number(breakdown.cash), online: Number(breakdown.online) });
                                                                                setActiveMultiOrderId(null);
                                                                                setStagedType({ ...stagedType, [item.originalId]: '' });
                                                                            }}
                                                                            className="w-7 h-10 flex items-center justify-center bg-success rounded-lg text-white shadow-md hover:bg-success/90 transition-all active:scale-95 shrink-0"
                                                                        >
                                                                            <IconCircleCheck className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : col.key === 'order_status' ? (
                                                    <div className="text-center min-w-[80px]">
                                                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase w-full ${item.status === 'delivered' ? 'bg-success/10 text-success' :
                                                            item.status === 'cancelled' ? 'bg-danger/10 text-danger' :
                                                                item.status === 'pending' ? 'bg-warning/10 text-warning' :
                                                                    item.status === 'order_accepted' ? 'bg-primary/10 text-primary' :
                                                                        item.status === 'packing' ? 'bg-info/10 text-info' :
                                                                            item.status === 'pickup_accepted' ? 'bg-secondary/10 text-secondary' :
                                                                                item.status === 'in_transit' ? 'bg-info/10 text-info' :
                                                                                    item.status === 'hold' || item.status === 'waiting' ? 'bg-gray-500/10 text-gray-500' :
                                                                                        'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {item.status?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                ) : col.key === 'storeName' ? (
                                                    <div className="font-semibold text-gray-900">{item.storeName}</div>
                                                ) : col.key === 'actions' && userType === 'Order' ? (
                                                    <div className="flex items-center gap-1">
                                                        <Tippy content="Print Bill">
                                                            <button
                                                                onClick={() => onPrint?.(item)}
                                                                type="button"
                                                                className="group flex h-6 w-6 items-center justify-center rounded-md border border-gray-100 bg-white shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5"
                                                            >
                                                                <IconPrinter className="h-3 w-3 text-gray-400 transition-colors group-hover:text-primary" />
                                                            </button>
                                                        </Tippy>

                                                        {item.status === 'pending' && (
                                                            <Tippy content="Accept Order">
                                                                <button
                                                                    onClick={() => onStatusUpdate?.(item.originalId, 'order_accepted')}
                                                                    type="button"
                                                                    className="group flex h-6 w-6 items-center justify-center rounded-md border border-success/20 bg-success/5 shadow-sm transition-all hover:bg-success hover:border-success"
                                                                >
                                                                    <IconSquareCheck className="h-3.5 w-3.5 text-success transition-colors group-hover:text-white" />
                                                                </button>
                                                            </Tippy>
                                                        )}

                                                        {(item.status === 'order_accepted' || item.status === 'hold' || item.status === 'waiting') && (
                                                            <Tippy content="Move to Packing">
                                                                <button
                                                                    onClick={() => onStatusUpdate?.(item.originalId, 'packing')}
                                                                    type="button"
                                                                    className="group flex h-6 w-6 items-center justify-center rounded-md border border-info/20 bg-info/5 shadow-sm transition-all hover:bg-info hover:border-info"
                                                                >
                                                                    <IconBox className="h-3.5 w-3.5 text-info transition-colors group-hover:text-white" />
                                                                </button>
                                                            </Tippy>
                                                        )}

                                                        {item.status === 'packing' && item.rider !== '-' && (
                                                            <Tippy content="Mark Delivered">
                                                                <button
                                                                    onClick={() => onStatusUpdate?.(item.originalId, 'delivered')}
                                                                    type="button"
                                                                    className="group flex h-6 w-6 items-center justify-center rounded-md border border-success/20 bg-success/5 shadow-sm transition-all hover:bg-success hover:border-success"
                                                                >
                                                                    <IconCircleCheck className="h-3.5 w-3.5 text-success transition-colors group-hover:text-white" />
                                                                </button>
                                                            </Tippy>
                                                        )}

                                                        {(item.status === 'pickup_accepted' || item.status === 'in_transit') && (
                                                            <Tippy content="Mark Delivered">
                                                                <button
                                                                    onClick={() => onStatusUpdate?.(item.originalId, 'delivered')}
                                                                    type="button"
                                                                    className="group flex h-6 w-6 items-center justify-center rounded-md border border-success/20 bg-success/5 shadow-sm transition-all hover:bg-success hover:border-success"
                                                                >
                                                                    <IconCircleCheck className="h-3.5 w-3.5 text-success transition-colors group-hover:text-white" />
                                                                </button>
                                                            </Tippy>
                                                        )}

                                                        {!['delivered', 'cancelled'].includes(item.status) && (
                                                            <Tippy content="Cancel Order">
                                                                <button
                                                                    onClick={() => onStatusUpdate?.(item.originalId, 'cancelled')}
                                                                    type="button"
                                                                    className="group flex h-6 w-6 items-center justify-center rounded-md border border-danger/20 bg-danger/5 shadow-sm transition-all hover:bg-danger hover:border-danger"
                                                                >
                                                                    <IconXCircle className="h-3 w-3 text-danger transition-colors group-hover:text-white" />
                                                                </button>
                                                            </Tippy>
                                                        )}
                                                    </div>
                                                ) : col.key === 'status' ? (
                                                    <label className="relative mb-0 inline-block h-5 w-10 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="peer absolute z-10 h-full w-full cursor-pointer opacity-0 focus:outline-none focus:ring-0"
                                                            checked={item[col.key] === 'Active'}
                                                            onChange={() => onStatusToggle?.(item.originalId, item[col.key])}
                                                        />
                                                        <span className="block h-full rounded-full border border-[#adb5bd] bg-white before:absolute before:bottom-[2px] before:h-4 before:w-4 before:rounded-full before:bg-[#adb5bd] before:transition-all before:duration-300 ltr:before:left-0.5 peer-checked:border-primary peer-checked:bg-primary peer-checked:before:bg-white ltr:peer-checked:before:left-5 rtl:before:right-0.5 rtl:peer-checked:before:right-5 dark:bg-dark dark:before:bg-white-dark"></span>
                                                    </label>
                                                ) : col.key === 'rider' && userType === 'Order' ? (
                                                    <div className="flex items-center gap-1.5 min-w-[120px]">
                                                        {['delivered', 'cancelled', 'in_transit'].includes(item.status) ? (
                                                            <div className="flex w-full items-center gap-1.5 px-2 py-1.5 rounded-md border border-gray-100 bg-gray-50/50 text-gray-500 opacity-75">
                                                                <IconUsers className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate flex-1 text-left text-[10px] font-bold">
                                                                    {item.rider !== '-' ? item.rider : 'No Rider'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="dropdown flex-1">
                                                                <Menu as="div" className="relative inline-block text-left w-full">
                                                                    <Menu.Button className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-gray-100 bg-white hover:border-primary/40 transition-all w-full group/btn shadow-sm ${stagedRiders[item.originalId] ? 'border-success/40 bg-success/5' : ''}`}>
                                                                        {stagedRiders[item.originalId] === 'HOLD' ? <IconMinusCircle className="w-3.5 h-3.5 text-warning shrink-0" /> :
                                                                            stagedRiders[item.originalId] === 'WAIT' ? <IconClock className="w-3.5 h-3.5 text-info shrink-0" /> :
                                                                                <IconUsers className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                                                        <span className="truncate flex-1 text-left text-[10px] font-bold text-gray-700">
                                                                            {stagedRiders[item.originalId] ? `${stagedRiders[item.originalId]}` :
                                                                                (!item.rider || item.rider === '-') ? 'Assign' : item.rider}
                                                                        </span>
                                                                        <IconCaretDown className={`w-3 h-3 text-gray-300 ml-auto transition-transform duration-300 group-focus-within/btn:rotate-180`} />
                                                                    </Menu.Button>
                                                                    <Transition
                                                                        as={Fragment}
                                                                        enter="transition ease-out duration-200"
                                                                        enterFrom={`transform opacity-0 scale-95 focus:ring-2 focus:ring-primary/20 ${index >= data.length - 4 && data.length > 4 ? 'translate-y-2' : '-translate-y-2'}`}
                                                                        enterTo="transform opacity-100 scale-100 translate-y-0"
                                                                        leave="transition ease-in duration-150"
                                                                        leaveFrom="transform opacity-100 scale-100 translate-y-0"
                                                                        leaveTo={`transform opacity-0 scale-95 ${index >= data.length - 4 && data.length > 4 ? 'translate-y-2' : '-translate-y-2'}`}
                                                                    >
                                                                        <Menu.Items className={`absolute right-0 z-[100] w-48 rounded-xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-1 ring-black/5 focus:outline-none dark:bg-[#1b2e4b] p-1.5 border border-black/5 ${index >= data.length - 4 && data.length > 4 ? 'bottom-full mb-1 origin-bottom-right' : 'mt-1 origin-top-right'}`}>
                                                                            <div className="grid grid-cols-2 gap-1 mb-1.5">
                                                                                <Menu.Item>
                                                                                    {({ active }) => (
                                                                                        <button
                                                                                            onClick={() => setStagedRiders({ ...stagedRiders, [item.originalId]: 'HOLD' })}
                                                                                            className={`${active || stagedRiders[item.originalId] === 'HOLD' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-gray-50 text-gray-400 border-transparent'} flex items-center justify-center gap-1 rounded-lg py-1 text-[9px] font-black uppercase border transition-all`}
                                                                                        >
                                                                                            <IconMinusCircle className="w-3 h-3" /> Hold
                                                                                        </button>
                                                                                    )}
                                                                                </Menu.Item>
                                                                                <Menu.Item>
                                                                                    {({ active }) => (
                                                                                        <button
                                                                                            onClick={() => setStagedRiders({ ...stagedRiders, [item.originalId]: 'WAIT' })}
                                                                                            className={`${active || stagedRiders[item.originalId] === 'WAIT' ? 'bg-info/10 text-info border-info/20' : 'bg-gray-50 text-gray-400 border-transparent'} flex items-center justify-center gap-1 rounded-lg py-1 text-[9px] font-black uppercase border transition-all`}
                                                                                        >
                                                                                            <IconClock className="w-3 h-3" /> Wait
                                                                                        </button>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            </div>
                                                                            <div className="px-2 py-1 mb-1 border-t border-black/5 pt-1.5">
                                                                                <span className="text-[8px] font-black uppercase tracking-widest text-black dark:text-white">Available Riders</span>
                                                                            </div>
                                                                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                                                                {riders.map((rider) => (
                                                                                    <Menu.Item key={rider.id || rider._id}>
                                                                                        {({ active }) => (
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    setStagedRiders({ ...stagedRiders, [item.originalId]: rider.user?.name || rider.name });
                                                                                                    (item as any)._selectedRiderId = rider.id || rider._id;
                                                                                                }}
                                                                                                className={`${active ? 'bg-primary/5' : ''} flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-black text-black transition-all duration-200 group`}
                                                                                            >
                                                                                                <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 shadow-sm border border-black/5">
                                                                                                    <img src={rider.image || '/assets/images/profile-5.jpeg'} alt="" className="h-full w-full object-cover" />
                                                                                                </div>
                                                                                                <div className="flex flex-col text-left min-w-0 flex-1">
                                                                                                    <span className="truncate leading-none">{rider.user?.name || rider.name}</span>
                                                                                                </div>
                                                                                                <div className={`h-2 w-2 rounded-full ${rider.status === 'Active' || rider.isAvailable ? 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.4)]'}`}></div>
                                                                                            </button>
                                                                                        )}
                                                                                    </Menu.Item>
                                                                                ))}
                                                                            </div>
                                                                            <div className="mt-1.5 pt-1.5 border-t border-black/5">
                                                                                <Menu.Item>
                                                                                    {({ active }) => (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                onRiderAssign?.(item.originalId, null, '-');
                                                                                                const n = { ...stagedRiders };
                                                                                                delete n[item.originalId];
                                                                                                setStagedRiders(n);
                                                                                            }}
                                                                                            className={`${active ? 'bg-danger/5' : ''} flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[9px] font-black uppercase tracking-widest text-black transition-all duration-200`}
                                                                                        >
                                                                                            <IconX className="h-3 w-3" />
                                                                                            NOT ASSIGNED
                                                                                        </button>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            </div>
                                                                        </Menu.Items>
                                                                    </Transition>
                                                                </Menu>
                                                            </div>
                                                        )}
                                                        {stagedRiders[item.originalId] && (
                                                            <Tippy content="Confirm Assign">
                                                                <button
                                                                    onClick={() => {
                                                                        const selectedRider = riders.find(r => (r.user?.name || r.name) === stagedRiders[item.originalId]);
                                                                        if (selectedRider) {
                                                                            onRiderAssign?.(item.originalId, selectedRider.id || selectedRider._id, null);
                                                                        } else if (stagedRiders[item.originalId] === 'HOLD' || stagedRiders[item.originalId] === 'WAIT') {
                                                                            const backendStatus = stagedRiders[item.originalId] === 'HOLD' ? 'hold' : 'waiting';
                                                                            onRiderAssign?.(item.originalId, null, backendStatus);
                                                                        }
                                                                        const n = { ...stagedRiders };
                                                                        delete n[item.originalId];
                                                                        setStagedRiders(n);
                                                                    }}
                                                                    className="flex h-6 w-6 items-center justify-center rounded bg-success text-white hover:bg-success-dark transition-all active:scale-95 shadow-sm shadow-success/10 shrink-0"
                                                                >
                                                                    <IconSquareCheck className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tippy>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-[12px] font-bold text-black dark:text-white-light">{item[col.key]}</div>
                                                )}
                                            </td>
                                        ))}
                                        {userType !== 'Order' && (
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Tippy content="View">
                                                        <button
                                                            type="button"
                                                            className="text-primary hover:text-primary-dark"
                                                            onClick={() => onViewClick?.(item)}
                                                        >
                                                            <IconEye className="h-5 w-5" />
                                                        </button>
                                                    </Tippy>
                                                    <Tippy content="Edit">
                                                        <button type="button" className="text-success hover:text-success-dark">
                                                            <IconPencil className="h-5 w-5" />
                                                        </button>
                                                    </Tippy>
                                                    <Tippy content="Delete">
                                                        <button type="button" className="text-danger hover:text-danger-dark">
                                                            <IconTrashLines className="h-5 w-5" />
                                                        </button>
                                                    </Tippy>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="py-6 text-center">
                                        No records found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination UI */}
                {totalRecords > 0 && onPageChange && (
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 md:flex-row">
                        <div className="text-[11px] font-medium text-gray-400">
                            Showing {Math.min((page - 1) * pageSize + 1, totalRecords)} to {Math.min(page * pageSize, totalRecords)} of {totalRecords} entries
                        </div>
                        <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                            <li>
                                <button
                                    type="button"
                                    className={`flex justify-center rounded-md bg-gray-50 p-1.5 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                                    onClick={() => onPageChange(page - 1)}
                                >
                                    <IconCaretDown className="h-3.5 w-3.5 rotate-90" />
                                </button>
                            </li>
                            {Array.from({ length: Math.ceil(totalRecords / pageSize) }).map((_, i) => {
                                const pageNum = i + 1;
                                if (pageNum === 1 || pageNum === Math.ceil(totalRecords / pageSize) || (pageNum >= page - 1 && pageNum <= page + 1)) {
                                    return (
                                        <li key={pageNum}>
                                            <button
                                                type="button"
                                                className={`flex justify-center rounded-md px-2.5 py-1 text-[11px] font-bold transition ${page === pageNum ? 'bg-primary text-white' : 'bg-gray-50 text-dark hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light'}`}
                                                onClick={() => onPageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                } else if (pageNum === page - 2 || pageNum === page + 2) {
                                    return <li key={pageNum} className="text-[10px] text-gray-300 px-1">...</li>;
                                }
                                return null;
                            })}
                            <li>
                                <button
                                    type="button"
                                    className={`flex justify-center rounded-md bg-gray-50 p-1.5 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${page === Math.ceil(totalRecords / pageSize) ? 'pointer-events-none opacity-50' : ''}`}
                                    onClick={() => onPageChange(page + 1)}
                                >
                                    <IconCaretDown className="h-3.5 w-3.5 -rotate-90" />
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderListTable;
