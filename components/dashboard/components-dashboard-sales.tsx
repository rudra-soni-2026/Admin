'use client';
import Dropdown from '@/components/dropdown';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconBolt from '@/components/icon/icon-bolt';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCalendar from '@/components/icon/icon-calendar';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconEdit from '@/components/icon/icon-edit';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconInbox from '@/components/icon/icon-inbox';
import IconMultipleForwardRight from '@/components/icon/icon-multiple-forward-right';
import IconNetflix from '@/components/icon/icon-netflix';
import IconPlus from '@/components/icon/icon-plus';
import IconShoppingCart from '@/components/icon/icon-shopping-cart';
import IconTag from '@/components/icon/icon-tag';
import IconUser from '@/components/icon/icon-user';
import IconTruck from '@/components/icon/icon-truck';
import IconBox from '@/components/icon/icon-box';
import IconFile from '@/components/icon/icon-file';
import IconDownload from '@/components/icon/icon-download';
import { IRootState } from '@/store';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useSelector } from 'react-redux';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import IconPrinter from '@/components/icon/icon-printer';
import IconPrinterLine from '@/components/icon/icon-printer'; // Using printer as placeholder for presentation
import IconRefresh from '@/components/icon/icon-refresh';
import { initiateSocket, getDashboardStats, subscribeToDashboardStats, unsubscribeFromOrders } from '@/utils/socket';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';

const ComponentsDashboardSales = () => {
    const router = useRouter();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    const [isMounted, setIsMounted] = useState(false);
    const [date1, setDate1] = useState<any>(null); // Start with null for Today
    const [isEditable, setIsEditable] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState('all');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loadingPermission, setLoadingPermission] = useState(true);

    // Dynamic Permission Protection
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const role = localStorage.getItem('role');
        const storedPerms = localStorage.getItem('permissions');
        let perms: any = null;
        if (storedPerms) {
            try { perms = JSON.parse(storedPerms); } catch (e) { }
        }

        const hasPerm = (p: string) => {
            if (role === 'super_admin') return true;
            if (!perms) return false;
            if (typeof perms === 'object' && !Array.isArray(perms)) return perms?.[p]?.read === true;
            if (Array.isArray(perms)) return perms.includes(p);
            return false;
        };

        if (!hasPerm('dashboard')) {
            if (hasPerm('users')) router.push('/users/list');
            else if (hasPerm('admins')) router.push('/admins/list');
            else if (hasPerm('stores')) router.push('/store/list');
            else if (hasPerm('warehouses')) router.push('/warehouses/list');
            else if (hasPerm('orders')) router.push('/orders/list');
            else if (hasPerm('products')) router.push('/products/list');
            else if (role === 'product_manager') router.push('/products/list');
            else if (role === 'warehouse_manager') router.push('/warehouses/list');
            else if (role === 'store_manager') router.push('/store/list');
            else router.push('/company/settings'); // Final safety
        } else {
            setLoadingPermission(false);
        }
    }, [router]);

    useEffect(() => {
        setIsMounted(true);
        const role = localStorage.getItem('role');
        const userDataString = localStorage.getItem('userData');
        setUserRole(role);

        let initialStoreId = 'all';
        if ((role === 'store_manager' || role === 'warehouse_manager') && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                initialStoreId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id || 'all';
            } catch (e) { }
        }
        setSelectedStore(initialStoreId);

        // Fetch Stores with Territory Filtering
        callApi('/management/admin/stores?page=1&limit=100', 'GET').then((res: any) => {
            if (res && res.data) {
                const userDataString = localStorage.getItem('userData');
                if (userDataString) {
                    try {
                        const userData = JSON.parse(userDataString);
                        let allowedStoreIds: string[] = [];

                        // Parse storeIds if it's a stringified array
                        if (typeof userData.storeIds === 'string') {
                            allowedStoreIds = JSON.parse(userData.storeIds);
                        } else if (Array.isArray(userData.storeIds)) {
                            allowedStoreIds = userData.storeIds;
                        }

                        // If NOT "ALL_STORES", filter the data
                        if (!allowedStoreIds.includes('ALL_STORES')) {
                            const filtered = res.data.filter((store: any) => allowedStoreIds.includes(store.id));
                            setStores(filtered);
                            // Auto-select the first allowed store if current isn't allowed
                            if (initialStoreId === 'all' && filtered.length > 0) {
                                setSelectedStore(filtered[0].id);
                                initiateSocket(filtered[0].id);
                            }
                            return;
                        }
                    } catch (e) {
                        console.error("Error parsing territory:", e);
                    }
                }
                setStores(res.data);
            }
        });

        // Socket Setup
        initiateSocket(initialStoreId);
        subscribeToDashboardStats((err, data) => {
            if (data) {
                const actualData = data.data || data;
                setStats(actualData);
            }
        });

        return () => {
            unsubscribeFromOrders();
        };
    }, []);

    const fetchStats = () => {
        let params: any = { storeId: selectedStore };
        if (date1 && Array.isArray(date1) && date1.length === 2) {
            params.startDate = date1[0].toISOString();
            params.endDate = date1[1].toISOString();
        }
        getDashboardStats(params);
    };

    useEffect(() => {
        if (isMounted && selectedStore) {
            fetchStats();
        }
    }, [date1, selectedStore, isMounted]);

    const exportTable = () => {
        let columnDelimiter = ',';
        let lineDelimiter = '\n';
        let keys = ['Metric', 'Value'];
        let data = stats ? [
            { Metric: 'Total Customers', Value: stats?.kpi?.totalCustomers?.count || 0 },
            { Metric: 'Today Orders', Value: stats?.kpi?.todayOrders?.count || 0 },
            { Metric: 'Delivered Orders', Value: stats?.kpi?.deliveredOrders?.count || 0 },
            { Metric: 'Cancelled Orders', Value: stats?.kpi?.cancelledOrders?.count || 0 },
            { Metric: 'Active Stores', Value: stats?.kpi?.infrastructure?.activeStores || 0 },
            { Metric: 'Online Payment', Value: stats?.kpi?.payments?.online?.amount || 0 },
            { Metric: 'Cash Payment', Value: stats?.kpi?.payments?.cash?.amount || 0 },
        ] : [];
        let result = keys.join(columnDelimiter) + lineDelimiter;
        data.map((item: any) => {
            keys.map((key, index) => {
                if (index > 0) result += columnDelimiter;
                result += item[key];
            });
            result += lineDelimiter;
        });

        if (result == null) return;
        if (!result.match(/^data:text\/csv/i)) {
            result = 'data:text/csv;charset=utf-8,' + result;
        }
        let encodedUri = encodeURI(result);
        let link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'dashboard-report.csv');
        link.click();
    };

    //Revenue Chart
    const revenueChart: any = {
        series: [
            {
                name: 'Income',
                data: [16800, 16800, 15500, 17800, 15500, 17000, 19000, 16000, 15000, 17000, 14000, 17000],
            },
            {
                name: 'Expenses',
                data: [16500, 17500, 16200, 17300, 16000, 19500, 16000, 17000, 16000, 19000, 18000, 19000],
            },
        ],
        options: {
            chart: {
                height: 325,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },

            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                curve: 'smooth',
                width: 2,
                lineCap: 'square',
            },
            dropShadow: {
                enabled: true,
                opacity: 0.2,
                blur: 10,
                left: -7,
                top: 22,
            },
            colors: isDark ? ['#2196F3', '#E7515A'] : ['#1B55E2', '#E7515A'],
            markers: {
                discrete: [
                    {
                        seriesIndex: 0,
                        dataPointIndex: 6,
                        fillColor: '#1B55E2',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                    {
                        seriesIndex: 1,
                        dataPointIndex: 5,
                        fillColor: '#E7515A',
                        strokeColor: 'transparent',
                        size: 7,
                    },
                ],
            },
            labels: stats?.charts?.revenuePerformance?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    show: true,
                },
                labels: {
                    offsetX: isRtl ? 2 : 0,
                    offsetY: 5,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-xaxis-title',
                    },
                },
            },
            yaxis: {
                tickAmount: 7,
                labels: {
                    formatter: (value: any) => {
                        return value ? (value / 1000 + 'K') : '0K';
                    },
                    offsetX: isRtl ? -30 : -10,
                    offsetY: 0,
                    style: {
                        fontSize: '12px',
                        cssClass: 'apexcharts-yaxis-title',
                    },
                },
                opposite: isRtl ? true : false,
            },
            grid: {
                borderColor: isDark ? '#191E3A' : '#E0E6ED',
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: false,
                    },
                },
                yaxis: {
                    lines: {
                        show: true,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '16px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5,
                },
            },
            tooltip: {
                marker: {
                    show: true,
                },
                x: {
                    show: false,
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: isDark ? 0.19 : 0.28,
                    opacityTo: 0.05,
                    stops: isDark ? [100, 100] : [45, 100],
                },
            },
        },
    };

    //Sales By Category
    const salesByCategory: any = {
        series: [985, 737, 270],
        options: {
            chart: {
                type: 'donut',
                height: 460,
                fontFamily: 'Nunito, sans-serif',
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 25,
                colors: isDark ? '#0e1726' : '#fff',
            },
            colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#e2a03f'] : ['#e2a03f', '#5c1ac3', '#e7515a'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                markers: {
                    width: 10,
                    height: 10,
                    offsetX: -2,
                },
                height: 50,
                offsetY: 20,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        background: 'transparent',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '29px',
                                offsetY: -10,
                            },
                            value: {
                                show: true,
                                fontSize: '26px',
                                color: isDark ? '#bfc9d4' : undefined,
                                offsetY: 16,
                                formatter: (val: any) => {
                                    return val ? val.toString() : '0';
                                },
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#888ea8',
                                fontSize: '29px',
                                formatter: (w: any) => {
                                    return w?.globals?.seriesTotals ? w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                        return a + b;
                                    }, 0) : 0;
                                },
                            },
                        },
                    },
                },
            },
            labels: stats?.charts?.salesMixByStore?.labels || ['Apparel', 'Sports', 'Others'],
            states: {
                hover: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
                active: {
                    filter: {
                        type: 'none',
                        value: 0.15,
                    },
                },
            },
        },
    };

    //Daily Sales
    const dailySales: any = {
        series: [
            {
                name: 'Sales',
                data: [44, 55, 41, 67, 22, 43, 21],
            },
            {
                name: 'Last Week',
                data: [13, 23, 20, 8, 13, 27, 33],
            },
        ],
        options: {
            chart: {
                height: 160,
                type: 'bar',
                fontFamily: 'Nunito, sans-serif',
                toolbar: {
                    show: false,
                },
                stacked: false,
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 1,
            },
            colors: ['#e2a03f', '#e0e6ed'],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: {
                            position: 'bottom',
                            offsetX: -10,
                            offsetY: 0,
                        },
                    },
                },
            ],
            xaxis: {
                labels: {
                    show: false,
                },
                categories: stats?.charts?.dailySales?.labels || ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
            },
            yaxis: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '25%',
                },
            },
            legend: {
                show: false,
            },
            grid: {
                show: false,
                xaxis: {
                    lines: {
                        show: false,
                    },
                },
                padding: {
                    top: 10,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
        },
    };

    //Total Orders
    const totalOrders: any = {
        series: [
            {
                name: 'Sales',
                data: [28, 40, 36, 52, 38, 60, 38, 52, 36, 40],
            },
        ],
        options: {
            chart: {
                height: 290,
                type: 'area',
                fontFamily: 'Nunito, sans-serif',
                sparkline: {
                    enabled: true,
                },
            },
            stroke: {
                curve: 'smooth',
                width: 2,
            },
            colors: isDark ? ['#00ab55'] : ['#00ab55'],
            labels: stats?.charts?.ordersTrend?.labels || ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            yaxis: {
                min: 0,
                show: false,
            },
            grid: {
                padding: {
                    top: 125,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            fill: {
                opacity: 1,
                type: 'gradient',
                gradient: {
                    type: 'vertical',
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: 0.3,
                    opacityTo: 0.05,
                    stops: [100, 100],
                },
            },
            tooltip: {
                x: {
                    show: false,
                },
            },
        },
    };

    if (loadingPermission) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="animate-spin inline-block w-8 h-8 border-[3px] border-primary border-l-transparent rounded-full align-middle"></span>
            </div>
        );
    }

    return (
        <>
            <style>
                {`
                    @media print {
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        #sidebar, .navbar, .header, .no-print, .dropdown, button { display: none !important; }
                        body, .main-container, .main-content { background: #ffffff !important; background-color: #ffffff !important; padding: 0 !important; margin: 0 !important; width: 100% !important; overflow: visible !important; }
                        .panel { box-shadow: none !important; border: none !important; page-break-inside: avoid; margin-bottom: 30px !important; }
                        .grid { display: grid !important; gap: 20px !important; }
                        .xl\\:grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                        .xl\\:grid-cols-3 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                        .xl\\:col-span-2 { grid-column: span 1 / span 1 !important; }
                        @page { size: landscape; margin: 1cm; }
                    }
                    .edit-active { border: 1px dashed rgba(255,255,255,0.5); padding: 0 4px; border-radius: 4px; cursor: text; }
                `}
            </style>
            <div>
                <div className="flex items-center justify-between flex-wrap gap-4 no-print">
                    <ul className="flex space-x-2 rtl:space-x-reverse">
                        <li>
                            <Link href="/" className="text-primary hover:underline">
                                Dashboard
                            </Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <span>Sales</span>
                        </li>
                    </ul>
                    <div className="flex items-center gap-4 ltr:ml-auto rtl:mr-auto">
                        {(userRole === 'super_admin' || userRole === 'admin') && (
                            <select
                                className="form-select w-40 h-10 no-print"
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                <option value="all">All Stores</option>
                                {stores.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="relative no-print">
                            <Flatpickr
                                options={{
                                    mode: 'range',
                                    dateFormat: 'Y-m-d',
                                    position: isRtl ? 'auto right' : 'auto left',
                                }}
                                value={date1}
                                placeholder="Select Date Range (Today)"
                                className="form-input w-52 ltr:pr-10 rtl:pl-10 h-10"
                                onChange={(date) => setDate1(date)}
                            />
                            <span className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark pointer-events-none">
                                <IconCalendar className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="dropdown no-print">
                            <Dropdown
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="btn btn-primary dropdown-toggle gap-2"
                                button={
                                    <>
                                        <IconDownload className="w-4 h-4" />
                                        Export
                                        <IconCaretDown className="w-4 h-4" />
                                    </>
                                }
                            >
                                <ul className="!min-w-[170px]">
                                    <li>
                                        <button type="button" onClick={exportTable}>
                                            <IconFile className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                            Export to Excel
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => window.print()}>
                                            <IconPrinter className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                            Download PDF
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => window.print()}>
                                            <IconBolt className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                            Presentation View
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                        <button
                            type="button"
                            className={`btn ${isEditable ? 'btn-danger' : 'btn-outline-primary'} gap-2 no-print`}
                            onClick={() => setIsEditable(!isEditable)}
                        >
                            <IconEdit className="w-4 h-4" />
                            {isEditable ? 'Finish Editing' : 'Edit Mode'}
                        </button>
                    </div>
                </div>

                <div className="pt-5">
                    {/* Real-time Operations Tracking */}
                    <div className="mb-6 grid grid-cols-1 gap-6 text-white sm:grid-cols-2 xl:grid-cols-4">
                        <div className="panel bg-gradient-to-r from-blue-500 to-blue-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Total Customers</div>
                                <IconUser className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.totalCustomers?.count ?? '0'}
                                </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold ltr:ml-3 rtl:mr-3">
                                    +{stats?.kpi?.totalCustomers?.increaseToday ?? '0'} Today
                                </div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-emerald-500 to-emerald-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Total Orders</div>
                                <IconShoppingCart className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.allTimeOrder?.count ?? '0'}
                                </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold ltr:ml-3 rtl:mr-3">
                                    Today: {stats?.kpi?.todayOrders?.count ?? '0'}
                                </div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Delivered Orders</div>
                                <IconTruck className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.deliveredOrders?.count ?? '0'}
                                </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold ltr:ml-3 rtl:mr-3">
                                    Today: {stats?.kpi?.deliveredOrders?.todayCount ?? '0'}
                                </div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-rose-500 to-rose-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Cancelled Orders</div>
                                <IconHorizontalDots className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.cancelledOrders?.count ?? '0'}
                                </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold ltr:ml-3 rtl:mr-3">
                                    Today: {stats?.kpi?.cancelledOrders?.todayCount ?? '0'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure & Payments Overview */}
                    <div className="mb-6 grid grid-cols-1 gap-6 text-white sm:grid-cols-2 xl:grid-cols-4">
                        <div className="panel bg-indigo-600">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Active Stores</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.activeStores?.totalStores ?? '0'} Total Stores
                                </div>
                            </div>
                        </div>
                        <div className="panel bg-amber-500">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Catalogs</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    {stats?.kpi?.catalogs?.categories ?? '0'} Category | {stats?.kpi?.catalogs?.products ?? '0'} Product
                                </div>
                            </div>
                        </div>
                        <div className="panel bg-sky-600">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Online Payment</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    ₹{stats?.kpi?.payments?.online?.amount?.toLocaleString() ?? '0'} ({stats?.kpi?.payments?.online?.percentage ?? '0'}%)
                                </div>
                            </div>
                        </div>
                        <div className="panel bg-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Cash Payment</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}>
                                    ₹{stats?.kpi?.payments?.cash?.amount?.toLocaleString() ?? '0'} ({stats?.kpi?.payments?.cash?.percentage ?? '0'}%)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 xl:grid-cols-3">
                        <div className="panel h-full xl:col-span-3">
                            <div className="mb-5 flex items-center justify-between dark:text-white-light">
                                <h5 className="text-lg font-semibold">Sales Performance (Live)</h5>
                            </div>
                            <div className="relative">
                                <div className="rounded-lg bg-white dark:bg-black">
                                    {isMounted ? (
                                        <ReactApexChart
                                            series={
                                                stats?.charts?.revenuePerformance?.income
                                                    ? [
                                                        { name: 'Income', data: stats.charts.revenuePerformance.income },
                                                        { name: 'Expenses', data: stats.charts.revenuePerformance.expenses || [] }
                                                    ]
                                                    : revenueChart.series
                                            }
                                            options={{
                                                ...revenueChart.options,
                                                xaxis: {
                                                    ...revenueChart.options.xaxis,
                                                    categories: stats?.charts?.revenuePerformance?.labels || revenueChart.options.labels
                                                }
                                            }}
                                            type="area"
                                            height={325}
                                            width={'100%'}
                                        />
                                    ) : (
                                        <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                            <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
                        <div className="panel h-full">
                            <div className="mb-5 flex items-center justify-between dark:text-white-light">
                                <h5 className="text-lg font-semibold">Summary</h5>
                                <div className="dropdown">
                                    <Dropdown
                                        placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                        button={<IconHorizontalDots className="h-5 w-5 text-black/70 hover:!text-primary dark:text-white/70" />}
                                    >
                                        <ul>
                                            <li>
                                                <button type="button">View Report</button>
                                            </li>
                                            <li>
                                                <button type="button">Edit Report</button>
                                            </li>
                                            <li>
                                                <button type="button">Mark as Done</button>
                                            </li>
                                        </ul>
                                    </Dropdown>
                                </div>
                            </div>
                            <div className="space-y-9">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 ltr:mr-3 rtl:ml-3">
                                        <div className="grid h-9 w-9 place-content-center  rounded-full bg-secondary-light text-secondary dark:bg-secondary dark:text-secondary-light">
                                            <IconInbox />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-2 flex font-semibold text-white-dark">
                                            <h6>Income</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto">₹{((stats?.kpi?.payments?.online?.amount ?? 0) + (stats?.kpi?.payments?.cash?.amount ?? 0)).toLocaleString()}</p>
                                        </div>
                                        <div className="h-2 rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#7579ff] to-[#b224ef]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-9 w-9 ltr:mr-3 rtl:ml-3">
                                        <div className="grid h-9 w-9 place-content-center rounded-full bg-success-light text-success dark:bg-success dark:text-success-light">
                                            <IconTag />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-2 flex font-semibold text-white-dark">
                                            <h6>Profit</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto">₹{(stats?.kpi?.profit?.amount ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full rounded-full bg-gradient-to-r from-[#3cba92] to-[#0ba360]" style={{ width: `${stats?.kpi?.profit?.increase ?? 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-9 w-9 ltr:mr-3 rtl:ml-3">
                                        <div className="grid h-9 w-9 place-content-center rounded-full bg-warning-light text-warning dark:bg-warning dark:text-warning-light">
                                            <IconCreditCard />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-2 flex font-semibold text-white-dark">
                                            <h6>Expenses</h6>
                                            <p className="ltr:ml-auto rtl:mr-auto">₹{(stats?.kpi?.expenses?.amount ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full rounded-full bg-gradient-to-r from-[#f09819] to-[#ff5858]" style={{ width: `${stats?.kpi?.expenses?.decrease ?? 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="panel h-full p-0">
                            <div className="absolute flex w-full items-center justify-between p-5">
                                <div className="relative">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-light text-success dark:bg-success dark:text-success-light">
                                        <IconShoppingCart />
                                    </div>
                                </div>
                                <h5 className="text-2xl font-semibold ltr:text-right rtl:text-left dark:text-white-light">
                                    {stats?.kpi?.todayOrders?.count ?? '0'}
                                    <span className="block text-sm font-normal">Order Trend (Hourly)</span>
                                </h5>
                            </div>
                            <div className="rounded-lg bg-transparent mt-10">
                                {/* loader */}
                                {isMounted ? (
                                    <ReactApexChart
                                        key={stats?.timestamp || 'orders-trend'}
                                        series={stats?.charts?.ordersTrend?.series || totalOrders.series}
                                        options={{
                                            ...totalOrders.options,
                                            chart: {
                                                ...totalOrders.options.chart,
                                                sparkline: { enabled: false },
                                                toolbar: { show: false }
                                            },
                                            xaxis: {
                                                labels: { show: true, style: { fontSize: '10px' } },
                                                categories: stats?.charts?.ordersTrend?.labels || Array.from({ length: 24 }, (_, i) => `${i}:00`)
                                            },
                                            grid: {
                                                padding: { top: 10, right: 0, bottom: 0, left: 10 }
                                            }
                                        }}
                                        type="area"
                                        height={280}
                                        width={'100%'}
                                    />
                                
                                ) : (
                                    <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="panel h-full w-full">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="text-lg font-semibold dark:text-white-light">Top Selling Products</h5>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="ltr:rounded-l-md rtl:rounded-r-md">Product</th>
                                            <th>Store</th>
                                            {/* <th>Category</th> */}
                                            <th>Price</th>
                                            <th className="ltr:rounded-r-md rtl:rounded-l-md">Sold</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(stats?.topSellingProducts || []).map((product: any, index: number) => (
                                            <tr key={index} className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                                <td className="min-w-[150px] text-black dark:text-white">
                                                    <div className="flex items-center">
                                                        <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src={product.image || "/assets/images/product-headphones.jpg"} alt="product" />
                                                        <span className="whitespace-nowrap">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-primary">ALL</td>
                                                {/* <td>{product.category}</td> */}
                                                <td>₹{product.price}</td>
                                                <td>
                                                    <span className="badge bg-success shadow-md dark:group-hover:bg-transparent">{product.sold} Units</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!stats?.topSellingProducts || stats?.topSellingProducts.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4">No products found for this range</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ComponentsDashboardSales;
