'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const ProductManagerList = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [todayUsers, setTodayUsers] = useState(0);

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

    const fetchData = async (currentPage: number) => {
        try {
            setLoading(true);
            // Assuming the API supports role filtering on /management/admin/users
            let query = `/management/admin/list?page=${currentPage}&limit=${pageSize}&role=product_manager`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (status === 'active') query += `&status=active`;
            else if (status === 'inactive') query += `&status=inactive`;
            
            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }

            const response = await callApi(query, 'GET');

            if (response && response.data) {
                const mappedData = response.data.map((user: any) => ({
                    id: user.id ? `#${String(user.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                    originalId: user.id,
                    user: {
                        name: user.name || 'Unknown User',
                        image: user.image || '/assets/images/profile-1.jpeg',
                    },
                    email: user.email || 'N/A',
                    phone: user.phone || 'N/A',
                    joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                    status: user.isBanned ? 'Inactive' : 'Active',
                }));
                setData(mappedData);
                setTotalRecords(response.totalCount || 0);
                
                if (response.stats) {
                    setTotalUsers(response.stats.total || response.totalCount || 0);
                    setTodayUsers(response.stats.today || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching product managers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchData(page);
        }
    }, [page, debouncedSearch, status, dateRange]);

    const handleStatusToggle = async (userId: any, currentStatus: string) => {
        try {
            const isBanned = currentStatus === 'Active' ? 'true' : 'false';
            const response = await callApi('/management/admin/ban-user', 'POST', {
                userId: userId,
                isBanned: isBanned
            });

            if (response) {
                Swal.fire({
                    icon: 'success',
                    title: `User ${isBanned === 'true' ? 'Banned' : 'Unbanned'} successfully`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });

                setData((prev) => 
                    prev.map((item) => 
                        item.originalId === userId 
                            ? { ...item, status: isBanned === 'true' ? 'Inactive' : 'Active' } 
                            : item
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const router = useRouter();

    const handleAddProductManager = () => {
        router.push('/product-managers/add');
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'user', label: 'Info' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'joinedDate', label: 'Joined' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>User Manager</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Product Manager List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Product Manager" 
                    data={data} 
                    columns={columns} 
                    userType="Product Manager" 
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalUsers}
                    todayUsers={todayUsers}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusToggle={handleStatusToggle}
                    onAddClick={handleAddProductManager}
                    addButtonLabel="Add New Product Manager"
                />
            )}
        </div>
    );
};

export default ProductManagerList;
