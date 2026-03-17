'use client';
import React, { useState } from 'react';
import UserListTable from './user-list-table';
import OrderListTable from './order-list-table';
import ComponentsUsersAccountSettingsTabs from '@/components/users/account-settings/components-users-account-settings-tabs';

interface UserManagerTableProps {
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
    onRiderAssign?: (orderId: any, riderId: string) => void;
    userType?: string;
    onAddClick?: () => void;
    addButtonLabel?: string;
    onViewClick?: (item: any) => void;
    onEditClick?: (item: any) => void;
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
}

const UserManagerTable = (props: UserManagerTableProps) => {
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const handleViewUser = (user: any) => {
        setSelectedUser(user);
        setViewMode('detail');
    };

    if (viewMode === 'detail' && selectedUser) {
        return (
            <div className="mt-6">
                <div className="mb-6 flex items-center justify-between">
                    <h5 className="text-lg font-bold dark:text-white-light">{props.userType || 'User'} Profile</h5>
                    <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={() => setViewMode('list')}
                    >
                        Back to List
                    </button>
                </div>
                <ComponentsUsersAccountSettingsTabs userData={selectedUser} />
            </div>
        );
    }

    const finalViewClick = props.onViewClick || (props.userType === 'Category' ? undefined : handleViewUser);

    return props.userType === 'Order' ? (
        <OrderListTable {...props} onViewClick={finalViewClick} />
    ) : (
        <UserListTable {...props} onViewClick={finalViewClick} onEditClick={props.onEditClick} hideAction={props.hideAction} hideDelete={props.hideDelete} hideView={props.hideView} />
    );
};

export default UserManagerTable;
