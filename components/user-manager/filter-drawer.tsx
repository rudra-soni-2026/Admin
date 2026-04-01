'use client';
import React from 'react';
import IconX from '@/components/icon/icon-x';
import IconRefresh from '@/components/icon/icon-refresh';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface FilterDrawerProps {
    show: boolean;
    setShow: (value: boolean) => void;
    date: any;
    setDate: (value: any) => void;
    status: string;
    setStatus: (value: string) => void;
    type?: string;
    categoryId?: string;
    setCategoryId?: (value: string) => void;
    brand?: string;
    setBrand?: (value: string) => void;
    minPrice?: string;
    setMinPrice?: (value: string) => void;
    maxPrice?: string;
    setMaxPrice?: (value: string) => void;
}

const FilterDrawer = ({ 
    show, setShow, date, setDate, status, setStatus, type = 'User',
    categoryId, setCategoryId, brand, setBrand, minPrice, setMinPrice, maxPrice, setMaxPrice 
}: FilterDrawerProps) => {
    const [localDate, setLocalDate] = React.useState<any>(date);
    const [localStatus, setLocalStatus] = React.useState<string>(status);
    const [localBrand, setLocalBrand] = React.useState<string>(brand || '');
    const [localCategory, setLocalCategory] = React.useState<string>(categoryId || '');
    const [localMinPrice, setLocalMinPrice] = React.useState<string>(minPrice || '');
    const [localMaxPrice, setLocalMaxPrice] = React.useState<string>(maxPrice || '');

    // Sync local state when external data changes or drawer is opened
    React.useEffect(() => {
        if (show) {
            setLocalDate(date);
            setLocalStatus(status);
            setLocalBrand(brand || '');
            setLocalCategory(categoryId || '');
            setLocalMinPrice(minPrice || '');
            setLocalMaxPrice(maxPrice || '');
        }
    }, [show, date, status, brand, categoryId, minPrice, maxPrice]);

    const handleApply = () => {
        setDate(localDate);
        setStatus(localStatus);
        setBrand?.(localBrand);
        setCategoryId?.(localCategory);
        setMinPrice?.(localMinPrice);
        setMaxPrice?.(localMaxPrice);
        setShow(false);
    };

    const handleReset = () => {
        setLocalDate('');
        setLocalStatus('all');
        setLocalBrand('');
        setLocalCategory('');
        setLocalMinPrice('');
        setLocalMaxPrice('');
        
        setDate('');
        setStatus('all');
        setBrand?.('');
        setCategoryId?.('');
        setMinPrice?.('');
        setMaxPrice?.('');
        setShow(false);
    };

    return (
        <div>
            {/* Overlay */}
            <div className={`${(show && '!block') || ''} fixed inset-0 z-[100] hidden bg-[black]/60 transition-[display]`} onClick={() => setShow(false)}></div>

            <nav
                className={`${(show && 'ltr:!right-0 rtl:!left-0') || ''
                    } fixed bottom-0 top-0 z-[100] w-full max-w-[380px] bg-white p-4 shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-[right] duration-300 ltr:-right-[380px] rtl:-left-[380px] dark:bg-black`}
            >
                {/* Specific Custom Styles for Inline Calendar within this Drawer */}
                <style jsx global>{`
                    .flatpickr-inline-clean .flatpickr-calendar.inline {
                        width: 100% !important;
                        max-width: 320px !important;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: 1px solid #e0e6ed !important;
                        background: #fff;
                        border-radius: 12px;
                        padding-bottom: 10px;
                    }
                    .dark .flatpickr-inline-clean .flatpickr-calendar.inline {
                        background: #0e1726 !important;
                        border-color: #1b2e4b !important;
                    }
                    .flatpickr-inline-clean .flatpickr-months .flatpickr-month {
                        background: transparent !important;
                        color: inherit !important;
                        fill: inherit !important;
                    }
                    .flatpickr-inline-clean .flatpickr-current-month .numInputWrapper {
                        width: 6.5ch;
                    }
                    .flatpickr-inline-clean .flatpickr-day.selected {
                        background: #4361ee !important;
                        border-color: #4361ee !important;
                    }
                `}</style>

                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-white-light dark:border-[#1b2e4b]">
                        <h4 className="text-base font-bold dark:text-white">Filters</h4>
                        <button type="button" className="opacity-30 hover:opacity-100 dark:text-white" onClick={() => setShow(false)}>
                            <IconX className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto mt-3 space-y-4 pb-20 pr-1 perfect-scrollbar">
                        {/* Date Filter */}
                        <div>
                            <label className="mb-2 block text-[13px] font-semibold text-gray-800 dark:text-white-light">Filter by Date Range</label>
                            <div className="w-full flatpickr-inline-clean">
                                <Flatpickr
                                    value={localDate}
                                    options={{
                                        mode: 'range',
                                        dateFormat: 'Y-m-d',
                                        inline: true,
                                    }}
                                    className="opacity-0 h-0 w-0 absolute z-[-1]"
                                    onChange={(selectedDates) => setLocalDate(selectedDates)}
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-3">
                            <label className="mb-1 block text-[12px] font-bold text-gray-700 dark:text-white-light uppercase tracking-tight">{type === 'Customer' ? 'Ban' : type} Status</label>
                            <div className="flex flex-col gap-1.5">
                                <label className={`flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-2 transition-all ${localStatus === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-white-light dark:border-[#1b2e4b] hover:bg-gray-50 dark:hover:bg-[#1b2e4b]/50'}`}>
                                    <div className="flex items-center">
                                        <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${localStatus === 'all' ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {localStatus === 'all' && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className={`ltr:ml-2 rtl:mr-2 text-[13px] font-bold ${localStatus === 'all' ? 'text-primary' : 'dark:text-white-light'}`}>All {type}s</span>
                                    </div>
                                    <input type="radio" name="status" className="hidden" value="all" checked={localStatus === 'all'} onChange={(e) => setLocalStatus(e.target.value)} />
                                </label>
                                <label className={`flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-2 transition-all ${localStatus === 'active' ? 'border-success bg-success/10 text-success' : 'border-white-light dark:border-[#1b2e4b] hover:bg-gray-50 dark:hover:bg-[#1b2e4b]/50'}`}>
                                    <div className="flex items-center">
                                        <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${localStatus === 'active' ? 'border-success bg-success' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {localStatus === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className={`ltr:ml-2 rtl:mr-2 text-[13px] font-bold ${localStatus === 'active' ? 'text-success' : 'dark:text-white-light'}`}>
                                            {type === 'Product' ? 'Active / Published' : 'Active'}
                                        </span>
                                    </div>
                                    <input type="radio" name="status" className="hidden" value="active" checked={localStatus === 'active'} onChange={(e) => setLocalStatus(e.target.value)} />
                                </label>
                                <label className={`flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-2 transition-all ${localStatus === 'inactive' ? 'border-danger bg-danger/10 text-danger' : 'border-white-light dark:border-[#1b2e4b] hover:bg-gray-50 dark:hover:bg-[#1b2e4b]/50'}`}>
                                    <div className="flex items-center">
                                        <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${localStatus === 'inactive' ? 'border-danger bg-danger' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {localStatus === 'inactive' && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                                        </div>
                                        <span className={`ltr:ml-2 rtl:mr-2 text-[13px] font-bold ${localStatus === 'inactive' ? 'text-danger' : 'dark:text-white-light'}`}>
                                            {type === 'Product' ? 'Inactive / Draft' : type === 'Customer' ? 'Banned' : 'Inactive'}
                                        </span>
                                    </div>
                                    <input type="radio" name="status" className="hidden" value="inactive" checked={localStatus === 'inactive'} onChange={(e) => setLocalStatus(e.target.value)} />
                                </label>
                            </div>
                        </div>

                        {type === 'Product' && (
                            <>
                                {/* Brand Filter */}
                                <div>
                                    <label className="mb-2 block text-[12px] font-bold text-gray-700 dark:text-white-light uppercase tracking-tight">Brand</label>
                                    <input 
                                        type="text" 
                                        className="form-input text-xs" 
                                        placeholder="Search by brand..." 
                                        value={localBrand} 
                                        onChange={(e) => setLocalBrand(e.target.value)} 
                                    />
                                </div>

                                {/* Price Range */}
                                <div className="space-y-2">
                                    <label className="block text-[12px] font-bold text-gray-700 dark:text-white-light uppercase tracking-tight">Price Range (₹)</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                className="form-input text-xs pl-6" 
                                                placeholder="Min" 
                                                value={localMinPrice} 
                                                onChange={(e) => setLocalMinPrice(e.target.value)} 
                                            />
                                            <span className="absolute left-2 top-1.5 text-gray-400 text-[10px]">₹</span>
                                        </div>
                                        <span className="text-gray-400">-</span>
                                        <div className="relative flex-1">
                                            <input 
                                                type="number" 
                                                className="form-input text-xs pl-6" 
                                                placeholder="Max" 
                                                value={localMaxPrice} 
                                                onChange={(e) => setLocalMaxPrice(e.target.value)} 
                                            />
                                            <span className="absolute left-2 top-1.5 text-gray-400 text-[10px]">₹</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 bg-white dark:bg-black pt-2">
                        <button type="button" className="btn btn-outline-danger flex-1" onClick={handleReset}>
                            <IconRefresh className="ltr:mr-2 rtl:ml-2" />
                            Reset
                        </button>
                        <button type="button" className="btn btn-primary flex-1" onClick={handleApply}>
                            Apply
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default FilterDrawer;
