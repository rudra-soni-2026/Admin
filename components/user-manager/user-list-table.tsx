'use client';
import React, { useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconFilter from '@/components/icon/icon-filter';
import IconSearch from '@/components/icon/icon-search';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconPlus from '@/components/icon/icon-plus';
import IconEye from '@/components/icon/icon-eye';
import IconPencil from '@/components/icon/icon-pencil';
import IconFolder from '@/components/icon/icon-folder';
import IconDownload from '@/components/icon/icon-download';
import IconLock from '@/components/icon/icon-lock';
import IconBox from '@/components/icon/icon-box';
import FilterDrawer from '@/components/user-manager/filter-drawer';

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
    search?: string;
    onSearchChange?: (val: string) => void;
    status?: string;
    onStatusChange?: (val: string) => void;
    dateRange?: any;
    onDateRangeChange?: (val: any) => void;
    onStatusToggle?: (userId: any, currentStatus: string) => void;
    onStatusClick?: (item: any) => void;
    onViewClick?: (user: any) => void;
    onEditClick?: (item: any) => void;
    onPermissionEdit?: (item: any) => void;
    userType?: string;
    onAddClick?: () => void;
    addButtonLabel?: string;
    // Extra filters for Products
    categoryId?: string;
    onCategoryIdChange?: (val: string) => void;
    brand?: string;
    onBrandChange?: (val: string) => void;
    minPrice?: string;
    onMinPriceChange?: (val: string) => void;
    maxPrice?: string;
    onMaxPriceChange?: (val: string) => void;
    hideAction?: boolean;
    hideDelete?: boolean;
    hideView?: boolean;
    hideFilter?: boolean;
    onDownloadClick?: (item: any) => void;
    onStockClick?: (item: any) => void;
    disableNameClick?: boolean;
    hideTotal?: boolean;
    onDeleteClick?: (item: any) => void;
}

const UserListTable = ({
    title,
    data,
    columns,
    totalRecords = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    totalUsers = 0,
    todayUsers = 0,
    search = '',
    onSearchChange,
    status = 'all',
    onStatusChange,
    dateRange = '',
    onDateRangeChange,
    onStatusToggle,
    onStatusClick,
    onViewClick,
    onEditClick,
    onPermissionEdit,
    onDownloadClick,
    onStockClick,
    onDeleteClick,
    userType = 'User',
    onAddClick,
    addButtonLabel,
    categoryId,
    onCategoryIdChange,
    brand,
    onBrandChange,
    minPrice,
    onMinPriceChange,
    maxPrice,
    onMaxPriceChange,
    hideAction = false,
    hideDelete = false,
    hideView = false,
    hideFilter = false,
    disableNameClick = false,
    hideTotal = false
}: UserListTableProps) => {
    const [showFilter, setShowFilter] = useState(false);

    return (
        <div className="mt-1">
            <div className="panel overflow-hidden shadow-sm border-gray-100 p-0">
                <div className="mb-1 flex flex-col gap-1 p-2 sm:px-8 sm:py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-lg font-black text-black dark:text-white-light tracking-tight">{title}</h5>
                        <div className="flex flex-wrap items-center gap-1">
                            {!hideTotal && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success/10 border border-success/20 shadow-sm transition-all">
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-success">Total</span>
                                    <span className="text-[11px] font-bold text-black dark:text-white">{totalUsers}</span>
                                </div>
                            )}
                            {(userType === 'Customer' || (todayUsers > 0 && userType !== 'Product' && userType !== 'Admin')) && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 shadow-sm transition-all">
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-primary">Today</span>
                                    <span className="text-[11px] font-bold text-black dark:text-white">{todayUsers}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="relative flex-1 sm:flex-initial sm:w-48">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="form-input peer !bg-gray-50 !border-gray-100 focus:!border-primary/40 focus:!bg-white transition-all text-sm py-2 rounded-lg"
                                value={search}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 ltr:right-[8px] rtl:left-[8px] peer-focus:text-primary">
                                <IconSearch className="h-3.5 w-3.5 opacity-40" />
                            </div>
                        </div>
                        {!hideFilter && (
                            <button type="button" className="btn btn-outline-primary btn-sm px-4 py-2 gap-2 shadow-sm transition-all" onClick={() => setShowFilter(true)}>
                                <IconFilter className="h-4 w-4" />
                                <span className="text-[12px] font-bold uppercase">Filter</span>
                            </button>
                        )}
                        {onAddClick && (
                            <button type="button" className="btn btn-primary btn-sm px-4 py-2 gap-2 shadow-sm transition-all" onClick={onAddClick}>
                                <IconPlus className="h-4 w-4" />
                                <span className="text-[12px] font-bold uppercase">{addButtonLabel || 'Add'}</span>
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
                    categoryId={categoryId}
                    setCategoryId={onCategoryIdChange}
                    brand={brand}
                    setBrand={onBrandChange}
                    minPrice={minPrice}
                    setMinPrice={onMinPriceChange}
                    maxPrice={maxPrice}
                    setMaxPrice={onMaxPriceChange}
                />

                <div className="table-responsive mb-0 overflow-x-auto border-t border-gray-100">
                    <table className="table-hover w-full min-w-[800px]">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className={`px-4 py-2 text-[11px] tracking-[0.05em] font-black uppercase text-gray-600 dark:text-gray-400 border-b border-gray-100 ${col.key === 'status' || col.key === 'image' ? 'text-center' : ''} ${col.key === 'name' ? 'min-w-[120px]' : ''} ${col.key === 'image' ? 'w-[70px]' : ''} ${col.key === 'barcode' ? 'w-[140px]' : ''} ${columns.indexOf(col) === 0 ? 'sm:pl-8' : ''}`}>
                                        {col.label}
                                    </th>
                                ))}
                                {!hideAction && <th className="text-center w-1 px-4 py-2 text-[11px] uppercase font-black tracking-[0.05em] text-gray-600 dark:text-gray-400 border-b border-gray-100 sm:pr-8">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item) => (
                                    <tr key={item.id} className="bg-white dark:bg-transparent border-t border-gray-100">
                                        {columns.map((col) => (
                                            <td key={col.key} className={`px-4 py-1.5 sm:py-2 ${col.key === 'status' || col.key === 'image' ? 'text-center' : ''} ${columns.indexOf(col) === 0 ? 'sm:pl-8' : ''}`}>
                                                {col.key === 'user' ? (
                                                    <div 
                                                        className={`flex items-center gap-2 ${onViewClick && !disableNameClick ? 'cursor-pointer group' : ''}`}
                                                        onClick={() => !disableNameClick && onViewClick?.(item)}
                                                    >
                                                        {!columns.some(c => c.key === 'image') && (
                                                            <div className="h-8 w-8 overflow-hidden rounded-full shrink-0 shadow-sm border border-gray-100 bg-gray-50 group-hover:border-primary/50 transition-all">
                                                                <img src={item.user?.image || item.image || '/assets/images/profile-5.jpeg'} alt="profile" className="h-full w-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col leading-tight">
                                                            <div className={`text-[12px] font-bold text-black dark:text-white-light ${!disableNameClick ? 'group-hover:text-primary transition-colors group-hover:underline' : ''}`}>
                                                                {item.user?.name || item.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : col.key === 'id' ? (
                                                    (userType === 'Category' && item.level === 0) || userType !== 'Category' ? (
                                                        <div
                                                            className={`text-[12px] font-black text-black dark:text-white-light tracking-tight ${onViewClick && !disableNameClick ? 'cursor-pointer hover:underline' : ''}`}
                                                            onClick={() => !disableNameClick && onViewClick?.(item)}
                                                        >
                                                            {item.id}
                                                        </div>
                                                    ) : (
                                                        <div className="w-12"></div>
                                                    )
                                                ) : col.key === 'image' ? (
                                                    <div 
                                                        className={`h-8 w-8 overflow-hidden ${userType === 'Product' ? 'rounded-lg' : 'rounded-full'} shrink-0 shadow-sm border border-gray-100 bg-gray-50 mx-auto ${onViewClick && !disableNameClick ? 'cursor-pointer hover:border-primary/50 transition-all' : ''}`}
                                                        onClick={() => !disableNameClick && onViewClick?.(item)}
                                                    >
                                                        <img src={item.image || item.user?.image || '/assets/images/profile-5.jpeg'} alt="profile" className="h-full w-full object-cover" />
                                                    </div>
                                                ) : col.key === 'name' ? (
                                                    userType === 'Category' ? (
                                                        <div 
                                                            className={`flex items-center group relative py-0.5 h-full ${onViewClick && !disableNameClick ? 'cursor-pointer' : ''}`}
                                                            style={{ paddingLeft: `${item.level * 28}px` }}
                                                            onClick={() => !disableNameClick && onViewClick?.(item)}
                                                        >
                                                            {/* Continuous Vertical Tree Line */}
                                                            {item.level > 0 && (
                                                                <div 
                                                                    className="absolute top-0 bottom-0 w-[1px] bg-gray-200 dark:bg-gray-800"
                                                                    style={{ left: `${(item.level * 28) - 14}px` }}
                                                                ></div>
                                                            )}

                                                            <div className="flex items-center gap-2.5 relative z-10">
                                                                {/* Expansion Control */}
                                                                {item.level < 2 ? (
                                                                    <div className={`transition-transform duration-300 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white ${item.isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                                                                        <IconCaretDown className={`w-3.5 h-3.5 ${!item.isExpanded ? 'ltr:-rotate-90 rtl:rotate-90' : ''}`} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-3.5 flex justify-center">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                                                    </div>
                                                                )}

                                                                {/* Branch Horizontal Line */}
                                                                {item.level > 0 && (
                                                                    <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 w-3.5 h-[1px] bg-gray-200 dark:bg-gray-800"></div>
                                                                )}

                                                                {/* Category Image - Only for Sub-categories (level > 0) */}
                                                                {item.level > 0 && (
                                                                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-gray-50 shrink-0 transform group-hover:scale-105 transition-transform">
                                                                        <img src={item.image || '/assets/images/profile-12.jpeg'} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}

                                                                {/* Category Content */}
                                                                <div className="flex flex-col whitespace-nowrap overflow-hidden">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-[13px] leading-tight transition-all ${item.level === 0 ? 'font-black text-black dark:text-white uppercase tracking-tight' : 'font-bold text-gray-700 dark:text-gray-400'}`}>
                                                                            {item.name}
                                                                        </span>
                                                                        {item.level > 0 && (
                                                                            <span className="text-[10px] font-black text-black dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md leading-none">
                                                                                {item.id}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${item.level === 0 ? 'text-primary' : 'text-gray-400'}`}>
                                                                            {item.level === 0 ? 'Root Category' : 'Sub-Item'}
                                                                        </span>
                                                                        {item.level === 0 && (
                                                                             <div className="w-1 h-1 rounded-full bg-primary/30"></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`text-[12px] font-bold text-black dark:text-white-light ${onViewClick && !disableNameClick && userType !== 'Product' ? 'cursor-pointer hover:text-primary transition-colors hover:underline' : ''}`}
                                                            onClick={() => userType !== 'Product' && !disableNameClick && onViewClick?.(item)}
                                                        >
                                                            {item.name || item.user?.name}
                                                        </div>
                                                    )
                                                ) : col.key === 'phone' ? (
                                                    <div className="flex flex-col leading-tight text-[12px] font-bold text-gray-700 dark:text-white-light leading-snug">
                                                        <span>{item.phone}</span>
                                                        {item.email && <span className="text-[10px] text-gray-400 font-medium normal-case">{item.email}</span>}
                                                    </div>
                                                ) : col.key === 'status' ? (
                                                    <label className="relative mb-0 inline-block h-4 w-8 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="peer absolute z-10 h-full w-full cursor-pointer opacity-0 focus:outline-none focus:ring-0"
                                                            checked={item[col.key] === 'Active'}
                                                            onChange={() => onStatusToggle?.(item.originalId, item[col.key])}
                                                        />
                                                        <span className="block h-full rounded-full border border-[#adb5bd] bg-white before:absolute before:bottom-[2px] before:h-3 before:w-3 before:rounded-full before:bg-[#adb5bd] before:transition-all before:duration-300 ltr:before:left-0.5 peer-checked:border-primary peer-checked:bg-primary peer-checked:before:bg-white ltr:peer-checked:before:left-4.5 rtl:before:right-0.5 rtl:peer-checked:before:right-4.5 dark:bg-dark dark:before:bg-white-dark"></span>
                                                    </label>
                                                ) : col.key === 'purchase_status' ? (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${item[col.key] === 'Received' ? 'bg-success/10 text-success border-success/20' : item[col.key] === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-info/10 text-info border-info/20'}`}>
                                                        {item[col.key]}
                                                    </span>
                                                ) : col.key === 'status_label' ? (
                                                    <span 
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer hover:opacity-80 transition-all ${
                                                            item[col.key] === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' : 
                                                            item[col.key] === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' : 
                                                            item[col.key] === 'OUT_FOR_DELIVERY' ? 'bg-info/10 text-info border-info/20' : 
                                                            'bg-danger/10 text-danger border-danger/20'
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStatusClick?.(item);
                                                        }}
                                                    >
                                                        {item[col.key]}
                                                    </span>
                                                ) : (
                                                    <div className="text-[12px] font-bold text-gray-700 dark:text-white-light leading-snug">
                                                        {item[col.key]}
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                        {!hideAction && (
                                            <td className="text-center sm:pr-8">
                                                <div className="flex items-center justify-center gap-3">
                                                    {!hideView && userType !== 'Category' && onViewClick && (
                                                        <Tippy content="View">
                                                            <button
                                                                type="button"
                                                                className="p-1 text-primary hover:text-primary-dark transition-colors"
                                                                onClick={() => onViewClick?.(item)}
                                                            >
                                                                <IconEye className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                    {onEditClick && (
                                                        <Tippy content="Edit">
                                                            <button 
                                                                type="button" 
                                                                className="p-1 text-success hover:text-success-dark transition-colors"
                                                                onClick={() => onEditClick?.(item)}
                                                            >
                                                                <IconPencil className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                    {onPermissionEdit && (
                                                        <Tippy content="Permissions">
                                                            <button 
                                                                type="button" 
                                                                className="p-1 text-warning hover:text-warning-dark transition-colors"
                                                                onClick={() => onPermissionEdit?.(item)}
                                                            >
                                                                <IconLock className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                    {onDownloadClick && (
                                                        <Tippy content="Download">
                                                            <button 
                                                                type="button" 
                                                                className="p-1 text-info hover:text-info-dark transition-colors"
                                                                onClick={() => onDownloadClick?.(item)}
                                                            >
                                                                <IconDownload className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                    {onStockClick && (
                                                        <Tippy content="View Stock / Inventory">
                                                            <button 
                                                                type="button" 
                                                                className="p-1 text-info hover:text-info-dark transition-colors"
                                                                onClick={() => onStockClick?.(item)}
                                                            >
                                                                <IconBox className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                    {!hideDelete && (
                                                        <Tippy content="Delete">
                                                            <button 
                                                                type="button" 
                                                                className="p-1 text-danger hover:text-danger-dark transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteClick?.(item);
                                                                }}
                                                            >
                                                                <IconTrashLines className="h-4 w-4" />
                                                            </button>
                                                        </Tippy>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="py-6 text-center text-xs text-gray-400">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalRecords > 0 && onPageChange && (
                    <div className="flex flex-col items-center justify-between gap-4 p-5 border-t border-gray-100 sm:flex-row">
                        <div className="text-[12px] font-bold text-gray-500">
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

export default UserListTable;
