'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const WarehouseList = () => {
    const [warehouseData, setWarehouseData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalWarehouses, setTotalWarehouses] = useState(0);
    const [todayWarehouses, setTodayWarehouses] = useState(0);

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

    const fetchWarehouses = async (currentPage: number) => {
        try {
            setLoading(true);
            // Assuming endpoint exists or will be created
            let query = `/management/admin/warehouses?page=${currentPage}&limit=${pageSize}`;
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
                const mappedData = response.data.map((warehouse: any) => ({
                    id: warehouse.id ? `#${String(warehouse.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                    originalId: warehouse.id,
                    name: warehouse.name || 'Unknown Warehouse',
                    image: warehouse.image || '/assets/images/profile-1.jpeg',
                    phone: warehouse.contact_number || 'N/A',
                    city: warehouse.city || 'N/A',
                    capacity: warehouse.capacity ? `${warehouse.capacity} Units` : 'N/A',
                    address: warehouse.address || 'N/A',
                    status: warehouse.isActive ? 'Active' : 'Inactive',
                    joinedDate: warehouse.created_at ? new Date(warehouse.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A',
                }));
                setWarehouseData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalWarehouse || 0);
                setTotalRecords(count);
                setTotalWarehouses(count);

                if (response.stats) {
                    setTodayWarehouses(response.stats.todayWarehouse || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchWarehouses(page);
        }
    }, [page, debouncedSearch, status, dateRange]);

    const handleStatusToggle = async (id: any, currentStatus: string) => {
        // Implementation for warehouse status toggle if needed
        console.log('Toggle warehouse status:', id, currentStatus);
    };

    const router = useRouter();

    const handleAddWarehouse = () => {
        router.push('/warehouses/add');
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Warehouse Name' },
        { key: 'phone', label: 'Contact' },
        { key: 'city', label: 'City' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Warehouse</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Warehouse" 
                    data={warehouseData} 
                    columns={columns} 
                    userType="Warehouse" 
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalWarehouses}
                    todayUsers={todayWarehouses}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusToggle={handleStatusToggle}
                    onAddClick={handleAddWarehouse}
                    addButtonLabel="Create New Warehouse"
                />
            )}
        </div>
    );
};

export default WarehouseList;
