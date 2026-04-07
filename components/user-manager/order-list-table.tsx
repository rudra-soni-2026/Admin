'use client';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
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
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconCreditCard from '@/components/icon/icon-credit-card';
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
    onPageSizeChange?: (size: number) => void;
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
    onDeleteClick?: (item: any) => void;
    loading?: boolean;
    onExportClick?: (format: 'excel' | 'pdf') => void;
    onStatusUpdate?: (orderId: any, newStatus: string) => void;
    onPaymentUpdate?: (orderId: any, paymentMethod: string, breakdown?: any) => void;
    onOrderEdit?: (item: any) => void;
    hideFilter?: boolean;
}

const OrderListTable = ({
    title,
    data,
    columns,
    totalRecords = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
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
    onOrderEdit,
    hideFilter = false,
    loading = false,
    onExportClick
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
                    type={userType}
                />

                <div className="table-responsive mb-3 overflow-x-auto relative min-h-[200px]">
                    {/* Interior Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-black/20 backdrop-blur-[1px]">
                            <span className="inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-8 h-8 align-middle"></span>
                        </div>
                    )}
                    <table className="table-hover whitespace-nowrap w-full min-w-[800px]">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className={`px-2 py-2 text-[10px] tracking-wider font-bold uppercase text-gray-400 dark:text-white-light border-b border-gray-100 
                                        ${col.key === 'status' || col.key === 'order_status' ? 'text-center' : ''} 
                                        ${['ID', 'Status', 'PAY', 'ACTION', 'STORE', 'AMOUNT', 'RIDER'].includes(col.label) ? 'w-1' : ''}
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
                                                    <div className="flex flex-col leading-[1.2] max-w-[125px]">
                                                        <div className="text-[12px] font-bold text-gray-800 dark:text-white-light truncate flex items-center gap-1.5">
                                                            <span title={item.customerName} className="truncate">{item.customerName}</span>
                                                            {item.isNewCustomer && (
                                                                <span title="First Time Customer" className="flex shrink-0 items-center gap-0.5 text-[8px] font-black py-[2px] px-1.5 rounded-sm bg-gradient-to-r from-warning to-yellow-400 text-white uppercase shadow-sm leading-none">
                                                                    <IconStar className="h-2 w-2 fill-white" /> NEW
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-400 mt-[1px] flex items-center gap-1.5">
                                                            <span>{item.customerPhone}</span>
                                                            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                            <span className="text-[9px] font-bold text-primary dark:text-primary-light whitespace-nowrap">{item.userOrderCount} Orders</span>
                                                        </div>
                                                    </div>
                                                ) : col.key === 'address' ? (
                                                    <Tippy content={item.formatted_address || 'No Address'} placement="top">
                                                        <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 whitespace-normal leading-[1.3] line-clamp-2 max-w-[125px] cursor-help">
                                                            {item.formatted_address ? (
                                                                <div className="flex gap-1 items-start">
                                                                    <span className="text-danger mt-[1px] shrink-0">📍</span>
                                                                    <span>{item.formatted_address}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-300 italic">No Address Details</span>
                                                            )}
                                                        </div>
                                                    </Tippy>
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
                                                    <div className="flex items-center min-w-[50px] justify-center">
                                                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${paymentSubTypes[item.originalId] === 'CASH' || (item.paymentMethod || item.pay || '').toUpperCase() === 'CASH' || (item.paymentMethod || item.pay || '').toUpperCase() === 'COD' ? 'bg-success/10 text-success' :
                                                            paymentSubTypes[item.originalId] === 'QR' || (item.paymentMethod || item.pay || '').toUpperCase() === 'QR' || (item.paymentMethod || item.pay || '').toUpperCase() === 'ONLINE' ? 'bg-info/10 text-info' :
                                                                paymentSubTypes[item.originalId] === 'MULTI' ? 'bg-secondary/10 text-secondary' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {paymentSubTypes[item.originalId] || item.paymentMethod || item.pay}
                                                        </span>
                                                    </div>
                                                ) : col.key === 'amount' && userType === 'Order' ? (
                                                    <div className="flex flex-col items-center min-w-[60px] max-w-[70px]">
                                                        <div className="flex items-center justify-center gap-1.5 w-full">
                                                            <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                                                                {item.amount}
                                                            </div>
                                                        </div>
                                                        {(item.status?.toLowerCase() === 'delivered') && !item.payment_confirmed && ((item.paymentMethod || item.pay || '').toUpperCase() === 'CASH' || (item.paymentMethod || item.pay || '').toUpperCase() === 'COD') && !paymentSubTypes[item.originalId] && (
                                                            <div className="flex items-center justify-center gap-1 min-h-[22px] w-full">
                                                                <button
                                                                    onClick={() => {
                                                                        setStagedType({ ...stagedType, [item.originalId]: 'CASH' });
                                                                    }}
                                                                    className={`px-1 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${stagedType[item.originalId] === 'CASH' ? 'bg-success border-success text-white' : 'bg-transparent border-success/20 text-success'}`}
                                                                >CASH</button>
                                                                <button
                                                                    onClick={() => {
                                                                        setStagedType({ ...stagedType, [item.originalId]: 'QR' });
                                                                    }}
                                                                    className={`px-1 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${stagedType[item.originalId] === 'QR' ? 'bg-info border-info text-white' : 'bg-transparent border-info/20 text-info'}`}
                                                                >QR</button>
                                                                <button
                                                                    onClick={() => {
                                                                        const total = parseFloat((item.amount || '0').toString().replace(/[^\d.-]/g, ''));
                                                                        Swal.fire({
                                                                            width: '290px',
                                                                            title: `<span class="text-sm font-black uppercase tracking-tight">Split Payment</span>`,
                                                                            html: `
                                                                                <div class="flex flex-col gap-3 p-1">
                                                                                    <div class="flex flex-col gap-1">
                                                                                        <label class="text-[9px] font-black text-gray-400 uppercase text-left ml-1">Cash Amount</label>
                                                                                        <input id="swal-cash" class="swal2-input !m-0 !w-full !rounded-xl !border-gray-100 !text-xs font-bold text-center !h-10" type="number" value="${total}">
                                                                                    </div>
                                                                                    <div class="flex flex-col gap-1">
                                                                                        <label class="text-[9px] font-black text-gray-400 uppercase text-left ml-1">Online Amount</label>
                                                                                        <input id="swal-online" class="swal2-input !m-0 !w-full !rounded-xl !border-gray-100 !text-xs font-bold text-center !h-10" type="number" value="0">
                                                                                    </div>
                                                                                    <div class="bg-gray-50/50 rounded-xl p-2 border border-gray-100/50 mt-1">
                                                                                        <div class="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                                                                                            <span>Order Total</span>
                                                                                            <span class="text-black">₹${total}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                            showCancelButton: true,
                                                                            confirmButtonText: 'CONFIRM',
                                                                            confirmButtonColor: '#10b981',
                                                                            cancelButtonColor: '#ef4444',
                                                                            customClass: {
                                                                                popup: 'rounded-3xl border-none shadow-2xl p-4',
                                                                                confirmButton: 'rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest',
                                                                                cancelButton: 'rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest'
                                                                            },
                                                                            preConfirm: () => {
                                                                                const cash = parseFloat((document.getElementById('swal-cash') as HTMLInputElement).value || '0');
                                                                                const online = parseFloat((document.getElementById('swal-online') as HTMLInputElement).value || '0');
                                                                                if (Math.abs(cash + online - total) > 0.01) {
                                                                                    Swal.showValidationMessage(`Mismatch! Sum must be ₹${total}`);
                                                                                    return false;
                                                                                }
                                                                                return { cash, online };
                                                                            }
                                                                        }).then((result) => {
                                                                            if (result.isConfirmed) {
                                                                                onPaymentUpdate?.(item.originalId, 'MULTI', result.value);
                                                                                setPaymentSubTypes({ ...paymentSubTypes, [item.originalId]: 'MULTI' });
                                                                                setStagedType({ ...stagedType, [item.originalId]: '' });
                                                                            }
                                                                        });
                                                                    }}
                                                                    className={`px-1.5 py-0.5 rounded border text-[7px] font-black transition-all active:scale-95 ${stagedType[item.originalId] === 'MULTI' ? 'bg-secondary border-secondary text-white' : 'bg-transparent border-secondary/20 text-secondary'}`}
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

                                                        {/* Edit Action Removed as per user request (moved to Detail page) */}
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
                                                    <div className="flex items-center gap-1.5 w-[100px]">
                                                        {['delivered', 'cancelled', 'in_transit'].includes(item.status) ? (
                                                            <div className="flex w-full items-center gap-1.5 px-2 py-1.5 rounded-md border border-gray-100 bg-gray-50/50 text-gray-500 opacity-75">
                                                                <IconUsers className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate flex-1 text-left text-[10px] font-bold">
                                                                    {item.rider !== '-' ? item.rider : 'No Rider'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1">
                                                                <Tippy
                                                                    trigger="click"
                                                                    interactive={true}
                                                                    placement="bottom-end"
                                                                    theme="none"
                                                                    appendTo={() => document.body}
                                                                    zIndex={9999}
                                                                    content={
                                                                        <div className="w-52 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 animate-fade-in pointer-events-auto">
                                                                            <div className="grid grid-cols-2 gap-1.5 mb-2">
                                                                                <button
                                                                                    onClick={() => setStagedRiders({ ...stagedRiders, [item.originalId]: 'HOLD' })}
                                                                                    className={`${stagedRiders[item.originalId] === 'HOLD' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-gray-50 text-gray-400 border-transparent'} flex items-center justify-center gap-1.5 rounded-xl py-2 text-[10px] font-black uppercase border transition-all active:scale-95`}
                                                                                >
                                                                                    <IconMinusCircle className="w-3.5 h-3.5" /> Hold
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setStagedRiders({ ...stagedRiders, [item.originalId]: 'WAIT' })}
                                                                                    className={`${stagedRiders[item.originalId] === 'WAIT' ? 'bg-info/10 text-info border-info/20' : 'bg-gray-50 text-gray-400 border-transparent'} flex items-center justify-center gap-1.5 rounded-xl py-2 text-[10px] font-black uppercase border transition-all active:scale-95`}
                                                                                >
                                                                                    <IconClock className="w-3.5 h-3.5" /> Wait
                                                                                </button>
                                                                            </div>
                                                                            <div className="px-2.5 py-1.5 mb-1.5 border-t border-gray-100 pt-2">
                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Available Riders</span>
                                                                            </div>
                                                                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                                                {riders.map((rider) => (
                                                                                    <button
                                                                                        key={rider.id || rider._id}
                                                                                        onClick={() => {
                                                                                            setStagedRiders({ ...stagedRiders, [item.originalId]: rider.user?.name || rider.name });
                                                                                            (item as any)._selectedRiderId = rider.id || rider._id;
                                                                                        }}
                                                                                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-black text-gray-700 hover:bg-primary/5 hover:text-primary transition-all duration-200 group relative"
                                                                                    >
                                                                                        <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-white group-hover:border-primary/20">
                                                                                            <img src={rider.image || '/assets/images/profile-5.jpeg'} alt="" className="h-full w-full object-cover" />
                                                                                        </div>
                                                                                        <div className="flex flex-col text-left min-w-0 flex-1">
                                                                                            <span className="truncate leading-none">{rider.user?.name || rider.name}</span>
                                                                                        </div>
                                                                                        <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-white ${rider.status === 'Active' || rider.isAvailable ? 'bg-success' : 'bg-warning'}`}></div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        onRiderAssign?.(item.originalId, null, '-');
                                                                                        const n = { ...stagedRiders };
                                                                                        delete n[item.originalId];
                                                                                        setStagedRiders(n);
                                                                                    }}
                                                                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/5 transition-all duration-200"
                                                                                >
                                                                                    <IconX className="h-3.5 w-3.5" />
                                                                                    NOT ASSIGNED
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <button className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-gray-100 bg-white hover:border-primary/40 transition-all w-full group/btn shadow-sm ${stagedRiders[item.originalId] ? 'border-success/40 bg-success/5' : ''}`}>
                                                                        {stagedRiders[item.originalId] === 'HOLD' ? <IconMinusCircle className="w-3.5 h-3.5 text-warning shrink-0" /> :
                                                                            stagedRiders[item.originalId] === 'WAIT' ? <IconClock className="w-3.5 h-3.5 text-info shrink-0" /> :
                                                                                <IconUsers className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                                                        <span className="truncate flex-1 text-left text-[10px] font-bold text-gray-700">
                                                                            {stagedRiders[item.originalId] ? `${stagedRiders[item.originalId]}` :
                                                                                (!item.rider || item.rider === '-') ? 'Assign' : item.rider}
                                                                        </span>
                                                                        <IconCaretDown className={`w-3 h-3 text-gray-300 ml-auto transition-transform duration-300 group-focus-within/btn:rotate-180`} />
                                                                    </button>
                                                                </Tippy>
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
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="text-[11px] font-medium text-gray-400">
                                Showing {Math.min((page - 1) * (pageSize || 10) + 1, totalRecords)} to {Math.min(page * (pageSize || 10), totalRecords)} of {totalRecords} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Limit:</span>
                                <select
                                    className="form-select text-[11px] font-bold p-1 pr-6 pb-1 h-7 rounded-md border-gray-200 shadow-sm"
                                    value={pageSize || 10}
                                    onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
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
