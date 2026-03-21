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

const ComponentsDashboardSales = () => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    const [isMounted, setIsMounted] = useState(false);
    const [date1, setDate1] = useState<any>('2026-03-01 to 2026-03-21');
    const [isEditable, setIsEditable] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const exportTable = () => {
        let columnDelimiter = ',';
        let lineDelimiter = '\n';
        let keys = ['Metric', 'Value'];
        let data = [
            { Metric: 'Total Customers', Value: '1280' },
            { Metric: 'Today Orders', Value: '245' },
            { Metric: 'Delivered Orders', Value: '212' },
            { Metric: 'Cancelled Orders', Value: '12' },
            { Metric: 'Active Stores', Value: '8' },
            { Metric: 'Online Payment', Value: '6420' },
            { Metric: 'Cash Payment', Value: '3180' },
        ];
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
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
            labels: ['Apparel', 'Sports', 'Others'],
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
                stacked: true,
                stackType: '100%',
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
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
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
                    right: -20,
                    bottom: -20,
                    left: -20,
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
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
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
                        <div className="relative">
                            <Flatpickr
                                options={{
                                    mode: 'range',
                                    dateFormat: 'Y-m-d',
                                    position: isRtl ? 'auto right' : 'auto left',
                                }}
                                value={date1}
                                className="form-input w-52 ltr:pr-10 rtl:pl-10 h-10"
                                onChange={(date) => setDate1(date)}
                            />
                            <span className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-white-dark pointer-events-none">
                                <IconCalendar className="w-4 h-4" />
                            </span>
                        </div>
                        <div className="dropdown">
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
                            className={`btn ${isEditable ? 'btn-danger' : 'btn-outline-primary'} gap-2`}
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
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 1,280 </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold ltr:ml-3 rtl:mr-3">+45 Today</div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-emerald-500 to-emerald-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Today's Orders</div>
                                <IconShoppingCart className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 245 </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold">Live Tracking</div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Delivered Orders</div>
                                <IconTruck className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 212 </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold">Success Rate: 92%</div>
                            </div>
                        </div>

                        <div className="panel bg-gradient-to-r from-rose-500 to-rose-400">
                            <div className="flex justify-between">
                                <div className="text-md font-semibold uppercase opacity-90">Cancelled Orders</div>
                                <IconHorizontalDots className="w-5 h-5" />
                            </div>
                            <div className="mt-5 flex items-center">
                                <div className={`text-3xl font-bold ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 12 </div>
                                <div className="badge bg-white/30 rounded-full py-1 text-[10px] font-bold">Immediate Review</div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure & Payments Overview */}
                    <div className="mb-6 grid grid-cols-1 gap-6 text-white sm:grid-cols-2 xl:grid-cols-4">
                        <div className="panel bg-indigo-600">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Active Stores</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 08 Stores </div>
                            </div>
                        </div>
                        <div className="panel bg-amber-500">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Catalogs</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> 15 Categories | 420 Products </div>
                            </div>
                        </div>
                        <div className="panel bg-sky-600">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Online Payment</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> ₹6,420 (65%) </div>
                            </div>
                        </div>
                        <div className="panel bg-slate-700">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold uppercase opacity-90">Cash Payment</div>
                                <div className={`text-xs font-bold bg-white/10 px-2 py-1 rounded ${isEditable ? 'edit-active' : ''}`} contentEditable={isEditable} suppressContentEditableWarning={true}> ₹3,180 (35%) </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 xl:grid-cols-3">
                        <div className="panel h-full xl:col-span-2">
                            <div className="mb-5 flex items-center justify-between dark:text-white-light">
                                <h5 className="text-lg font-semibold">Store-wise Sales Performance (Live)</h5>
                            </div>
                            <div className="relative">
                                <div className="rounded-lg bg-white dark:bg-black">
                                    {isMounted ? (
                                        <ReactApexChart series={revenueChart.series} options={revenueChart.options} type="area" height={325} width={'100%'} />
                                    ) : (
                                        <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                            <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="panel h-full">
                            <div className="mb-5 flex items-center justify-between dark:text-white-light">
                                <h5 className="text-lg font-semibold dark:text-white-light">Sales Mix by Store</h5>
                            </div>
                            <div>
                                <div className="rounded-lg bg-white dark:bg-black">
                                    {isMounted ? (
                                        <ReactApexChart series={salesByCategory.series} options={salesByCategory.options} type="donut" height={420} width={'100%'} />
                                    ) : (
                                        <div className="grid min-h-[420px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                            <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="panel h-full sm:col-span-2 xl:col-span-1">
                            <div className="mb-5 flex items-center">
                                <h5 className="text-lg font-semibold dark:text-white-light">
                                    Daily Sales
                                    <span className="block text-sm font-normal text-white-dark">Go to columns for details.</span>
                                </h5>
                                <div className="relative ltr:ml-auto rtl:mr-auto">
                                    <div className="grid h-11 w-11 place-content-center rounded-full bg-[#ffeccb] text-warning dark:bg-warning dark:text-[#ffeccb]">
                                        <IconDollarSign />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="rounded-lg bg-white dark:bg-black">
                                    {isMounted ? (
                                        <ReactApexChart series={dailySales.series} options={dailySales.options} type="bar" height={160} width={'100%'} />
                                    ) : (
                                        <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                            <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                                            <p className="ltr:ml-auto rtl:mr-auto">$92,600</p>
                                        </div>
                                        <div className="h-2 rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full w-11/12 rounded-full bg-gradient-to-r from-[#7579ff] to-[#b224ef]"></div>
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
                                            <p className="ltr:ml-auto rtl:mr-auto">$37,515</p>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#3cba92] to-[#0ba360]" style={{ width: '65%' }}></div>
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
                                            <p className="ltr:ml-auto rtl:mr-auto">$55,085</p>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-dark-light shadow dark:bg-[#1b2e4b]">
                                            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#f09819] to-[#ff5858]" style={{ width: '80%' }}></div>
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
                                    3,192
                                    <span className="block text-sm font-normal">Total Orders</span>
                                </h5>
                            </div>
                            <div className="rounded-lg bg-transparent">
                                {/* loader */}
                                {isMounted ? (
                                    <ReactApexChart series={totalOrders.series} options={totalOrders.options} type="area" height={290} width={'100%'} />
                                ) : (
                                    <div className="grid min-h-[325px] place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] ">
                                        <span className="inline-flex h-5 w-5 animate-spin rounded-full  border-2 border-black !border-l-transparent dark:border-white"></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="panel h-full w-full">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="text-lg font-semibold dark:text-white-light">Recent Orders</h5>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="ltr:rounded-l-md rtl:rounded-r-md">Customer</th>
                                            <th>Product</th>
                                            <th>Invoice</th>
                                            <th>Price</th>
                                            <th className="ltr:rounded-r-md rtl:rounded-l-md">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="min-w-[150px] text-black dark:text-white">
                                                <div className="flex items-center">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/profile-6.jpeg" alt="avatar" />
                                                    <span className="whitespace-nowrap">Luke Ivory</span>
                                                </div>
                                            </td>
                                            <td className="text-primary">Headphone</td>
                                            <td>
                                                <Link href="/apps/invoice/preview">#46894</Link>
                                            </td>
                                            <td>$56.07</td>
                                            <td>
                                                <span className="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-black dark:text-white">
                                                <div className="flex items-center">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/profile-7.jpeg" alt="avatar" />
                                                    <span className="whitespace-nowrap">Andy King</span>
                                                </div>
                                            </td>
                                            <td className="text-info">Nike Sport</td>
                                            <td>
                                                <Link href="/apps/invoice/preview">#76894</Link>
                                            </td>
                                            <td>$126.04</td>
                                            <td>
                                                <span className="badge bg-secondary shadow-md dark:group-hover:bg-transparent">Shipped</span>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-black dark:text-white">
                                                <div className="flex items-center">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/profile-8.jpeg" alt="avatar" />
                                                    <span className="whitespace-nowrap">Laurie Fox</span>
                                                </div>
                                            </td>
                                            <td className="text-warning">Sunglasses</td>
                                            <td>
                                                <Link href="/apps/invoice/preview">#66894</Link>
                                            </td>
                                            <td>$56.07</td>
                                            <td>
                                                <span className="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-black dark:text-white">
                                                <div className="flex items-center">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/profile-9.jpeg" alt="avatar" />
                                                    <span className="whitespace-nowrap">Ryan Collins</span>
                                                </div>
                                            </td>
                                            <td className="text-danger">Sport</td>
                                            <td>
                                                <button type="button">#75844</button>
                                            </td>
                                            <td>$110.00</td>
                                            <td>
                                                <span className="badge bg-secondary shadow-md dark:group-hover:bg-transparent">Shipped</span>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-black dark:text-white">
                                                <div className="flex items-center">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/profile-10.jpeg" alt="avatar" />
                                                    <span className="whitespace-nowrap">Irene Collins</span>
                                                </div>
                                            </td>
                                            <td className="text-secondary">Speakers</td>
                                            <td>
                                                <Link href="/apps/invoice/preview">#46894</Link>
                                            </td>
                                            <td>$56.07</td>
                                            <td>
                                                <span className="badge bg-success shadow-md dark:group-hover:bg-transparent">Paid</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="panel h-full w-full">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="text-lg font-semibold dark:text-white-light">Top Selling Product</h5>
                            </div>
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr className="border-b-0">
                                            <th className="ltr:rounded-l-md rtl:rounded-r-md">Store</th>
                                            <th>Product</th>
                                            <th>Price</th>
                                            <th>Sold</th>
                                            <th className="ltr:rounded-r-md rtl:rounded-l-md">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-secondary font-bold">Store A</td>
                                            <td className="min-w-[150px] text-black dark:text-white">
                                                <div className="flex">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/product-headphones.jpg" alt="avatar" />
                                                    <p className="whitespace-nowrap">
                                                        Headphone
                                                        <span className="block text-xs text-primary">Digital</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td>₹168</td>
                                            <td>170</td>
                                            <td>
                                                <button type="button" className="flex items-center text-danger">
                                                    <IconMultipleForwardRight className="ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                                                    Direct
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-secondary font-bold">Store B</td>
                                            <td className="text-black dark:text-white">
                                                <div className="flex">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/product-shoes.jpg" alt="avatar" />
                                                    <p className="whitespace-nowrap">
                                                        Shoes <span className="block text-xs text-warning">Fashion</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td>₹126</td>
                                            <td>130</td>
                                            <td>
                                                <button type="button" className="flex items-center text-success">
                                                    <IconMultipleForwardRight className="ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                                                    Google
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-secondary font-bold">Store C</td>
                                            <td className="text-black dark:text-white">
                                                <div className="flex">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/product-watch.jpg" alt="avatar" />
                                                    <p className="whitespace-nowrap">
                                                        Watch <span className="block text-xs text-danger">Accessories</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td>₹56</td>
                                            <td>66</td>
                                            <td>
                                                <button type="button" className="flex items-center text-warning">
                                                    <IconMultipleForwardRight className="ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                                                    Ads
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-secondary font-bold">Store D</td>
                                            <td className="text-black dark:text-white">
                                                <div className="flex">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/product-laptop.jpg" alt="avatar" />
                                                    <p className="whitespace-nowrap">
                                                        Laptop <span className="block text-xs text-primary">Digital</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td>₹110</td>
                                            <td>35</td>
                                            <td>
                                                <button type="button" className="flex items-center text-secondary">
                                                    <IconMultipleForwardRight className="ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                                                    Email
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group text-white-dark hover:text-black dark:hover:text-white-light/90">
                                            <td className="text-secondary font-bold">Store E</td>
                                            <td className="text-black dark:text-white">
                                                <div className="flex">
                                                    <img className="h-8 w-8 rounded-md object-cover ltr:mr-3 rtl:ml-3" src="/assets/images/product-camera.jpg" alt="avatar" />
                                                    <p className="whitespace-nowrap">
                                                        Camera <span className="block text-xs text-primary">Digital</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td>₹56</td>
                                            <td>30</td>
                                            <td>
                                                <button type="button" className="flex items-center text-primary">
                                                    <IconMultipleForwardRight className="ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                                                    Referral
                                                </button>
                                            </td>
                                        </tr>
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
