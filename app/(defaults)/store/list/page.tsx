'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const StoreList = () => {
    const [storeData, setStoreData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };
    const [totalStores, setTotalStores] = useState(0);
    const [todayStores, setTodayStores] = useState(0);

    // Filter States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState<any>('');

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchStores = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/stores?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (status === 'active') query += `&isActive=true`;
            else if (status === 'inactive') query += `&isActive=false`;

            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }

            const response = await callApi(query, 'GET');

            if (response && response.data) {
                const userDataString = localStorage.getItem('userData');
                let allowedStoreIds: string[] = [];
                if (userDataString) {
                    try {
                        const userData = JSON.parse(userDataString);
                        if (typeof userData.storeIds === 'string') {
                            allowedStoreIds = JSON.parse(userData.storeIds);
                        } else if (Array.isArray(userData.storeIds)) {
                            allowedStoreIds = userData.storeIds;
                        }
                    } catch (e) { }
                }

                const mappedData = response.data
                    .filter((store: any) => {
                        if (uRole === 'super_admin') return true;
                        if (allowedStoreIds.includes('ALL_STORES') || allowedStoreIds.includes('all')) return true;
                        return allowedStoreIds.includes(store.id);
                    })
                    .map((store: any) => ({
                        id: store.id ? `#${String(store.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                        originalId: store.id,
                        name: store.name || 'Unknown Store',
                        image: store.image || '/assets/images/profile-12.jpeg',
                        phone: store.contact_number || 'N/A',
                        email: store.email || 'N/A',
                        city: store.city || 'N/A',
                        status: store.isActive ? 'Active' : 'Inactive',
                        isActive: store.isActive,
                        joinedDate: store.created_at ? new Date(store.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A',
                        // Original fields for Edit/View fallback
                        address: store.address || '',
                        contact_number: store.contact_number || '',
                        latitude: store.latitude || '',
                        longitude: store.longitude || '',
                        open_time: store.open_time || '',
                        close_time: store.close_time || '',
                        warehouse_id: store.warehouse_id || '',
                        store_manager_id: store.store_manager_id || '',
                        is_service_available: store.is_service_available ?? true,
                        is_cod_enabled: store.is_cod_enabled ?? true,
                        distance_threshold: store.distance_threshold || 5000,
                        priority_message: store.priority_message || '',
                        priority_message_color: store.priority_message_color || '#FF0000',
                        coverage_polygon: store.coverage_polygon || null,
                        store_manager: store.store_manager,
                        warehouse: store.warehouse,
                    }));
                setStoreData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalStore || 0);
                setTotalRecords(count);
                setTotalStores(count);

                if (response.stats) {
                    setTodayStores(response.stats.todayStore || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchStores(page);
        }
    }, [page, debouncedSearch, status, dateRange]);

    const handleStatusToggle = async (id: any, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'Active' ? false : true;
            const response = await callApi(`/management/admin/stores/${id}`, 'PATCH', {
                isActive: nextStatus
            });

            if (response && response.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: `Store ${nextStatus ? 'Activated' : 'Deactivated'}`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                });
                fetchStores(page); // Refresh list
            }
        } catch (error: any) {
            console.error('Error toggling store status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text: error.message || 'Error occurred while updating status.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
            });
        }
    };

    const router = useRouter();

    const handleAddStore = () => {
        router.push('/store/add');
    };


    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Store Name' },
        { key: 'phone', label: 'Contact' },
        { key: 'city', label: 'City' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Store Manager</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Store List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Store"
                    data={storeData}
                    columns={columns}
                    userType="Store"
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalStores}
                    todayUsers={todayStores}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusToggle={hasPerm('stores', 'update') ? handleStatusToggle : undefined}
                    onAddClick={hasPerm('stores', 'create') ? handleAddStore : undefined}
                    onEditClick={hasPerm('stores', 'update') ? (item: any) => {
                        localStorage.setItem(`edit_store_${item.originalId}`, JSON.stringify(item));
                        router.push(`/store/edit/${item.originalId}`);
                    } : undefined}
                    onStockClick={hasPerm('store_inventory', 'read') ? (item: any) => router.push(`/inventory/store?store_id=${item.originalId}`) : undefined}
                    hideDelete={true}
                    hideView={true}
                    hideStock={false}
                    addButtonLabel="Create New Store"
                />
            )}
        </div>
    );
};

export default StoreList;
