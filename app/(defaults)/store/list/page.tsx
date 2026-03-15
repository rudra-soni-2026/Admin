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
                const mappedData = response.data.map((store: any) => ({
                    id: store.id ? `#${String(store.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                    originalId: store.id,
                    name: store.name || 'Unknown Store',
                    image: store.image || '/assets/images/profile-12.jpeg',
                    phone: store.contact_number || 'N/A',
                    email: store.email || 'N/A',
                    city: store.city || 'N/A',
                    status: store.isActive ? 'Active' : 'Inactive',
                    joinedDate: store.created_at ? new Date(store.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A',
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

    const handleStatusToggle = async (userId: any, currentStatus: string) => {
        // Implementation for store status toggle if needed
        console.log('Toggle store status:', userId, currentStatus);
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
                    onStatusToggle={handleStatusToggle}
                    onAddClick={handleAddStore}
                    addButtonLabel="Create New Store"
                />
            )}
        </div>
    );
};

export default StoreList;
