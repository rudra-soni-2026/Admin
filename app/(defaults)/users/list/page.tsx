'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconEye from '@/components/icon/icon-eye';

const CustomerList = () => {
    const [customerData, setCustomerData] = useState<any[]>([]);
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
        }, 500); // Wait for 500ms

        return () => clearTimeout(handler);
    }, [search]);

    const fetchCustomers = async (currentPage: number) => {
        try {
            setLoading(true);

            // Build Query Params
            let query = `/management/admin/users?page=${currentPage}&limit=${pageSize}&role=user`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (status === 'active') query += `&isBanned=false`;
            else if (status === 'inactive') query += `&isBanned=true`;

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
                    createdAt: user.created_at, // Keep raw date for filtering reference if needed
                    joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                    lastOrderDate: (() => {
                        const date = new Date(user.lastOrderDate || user.last_order_at);
                        return isNaN(date.getTime()) ? (
                            <span className="text-warning font-black uppercase text-[9px] bg-warning/10 px-2.5 py-1 rounded-md border border-warning/20 tracking-wider inline-block">
                                Never Ordered
                            </span>
                        ) : (
                            <span className="text-[12px] font-bold text-gray-700 dark:text-white-light">
                                {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        );
                    })(),
                    orders: (
                        <div className="flex flex-col items-center justify-center leading-tight">
                            <div className="flex items-center gap-1.5 font-black text-[13px]">
                                <span className="text-black dark:text-white-light">{Number(user.totalOrder || 0)}</span>
                                <span className="text-gray-300 font-light">|</span>
                                <span className={Number(user.todayOrder) > 0 ? "text-primary" : "text-gray-400 opacity-60"}>
                                    {Number(user.todayOrder || 0)}
                                </span>
                            </div>
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.1em] mt-0.5">Orders</span>
                        </div>
                    ),
                    status: user.isBanned ? 'Banned' : 'Active',
                    actions: (
                        <div className="flex items-center justify-center">
                            <Link href={`/users/view/${user.id}`} className="text-primary hover:opacity-70 transition-all p-2 rounded-full hover:bg-primary/5">
                                <IconEye className="h-5 w-5" />
                            </Link>
                        </div>
                    ),
                }));
                setCustomerData(mappedData);
                setTotalRecords(response.totalCount || 0);

                if (response.stats) {
                    if (response.stats.totalCustomer) setTotalUsers(response.stats.totalCustomer);
                    if (response.stats.todayCustomer) setTodayUsers(response.stats.todayCustomer);
                }
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch on page or filter change
    useEffect(() => {
        // Reset to page 1 on filter change
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchCustomers(page);
        }
    }, [page, debouncedSearch, status, dateRange]);

    // Separate effect for calculating total counts and today's users if not in the response
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // If the main API doesn't return stats, we might need a separate call or calculate from a larger set
                // For now, let's assume we might need to fetch a bit more to calculate 'Today' if not provided
                if (totalUsers === 0 || todayUsers === 0) {
                    const allResponse = await callApi('/management/admin/users?limit=1000&role=user', 'GET');
                    if (allResponse && allResponse.data) {
                        setTotalUsers(allResponse.data.length);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const countToday = allResponse.data.filter((u: any) => {
                            const d = new Date(u.created_at);
                            return d >= today;
                        }).length;
                        setTodayUsers(countToday);
                    }
                }
            } catch (e) {
                console.error("Error fetching stats", e);
            }
        };
        fetchStats();
    }, []);

    const handleStatusToggle = async (userId: any, currentStatus: string) => {
        try {
            const isBanned = currentStatus === 'Active' ? 'true' : 'false';
            const response = await callApi('/management/admin/ban-user', 'POST', {
                userId: userId,
                isBanned: isBanned
            });

            if (response) {
                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    showCloseButton: true,
                    customClass: {
                        popup: isBanned === 'true' ? 'color-danger' : 'color-success',
                    },
                });
                toast.fire({
                    icon: 'success',
                    title: `User ${isBanned === 'true' ? 'Banned' : 'Unbanned'} successfully`,
                    padding: '10px 20px',
                });

                // Update local state
                setCustomerData((prevData) =>
                    prevData.map((user) =>
                        user.originalId === userId
                            ? { ...user, status: isBanned === 'true' ? 'Banned' : 'Active' }
                            : user
                    )
                );
            }
        } catch (error) {
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                showCloseButton: true,
                customClass: {
                    popup: 'color-danger',
                },
            });
            toast.fire({
                icon: 'error',
                title: 'Operation failed! Please try again.',
                padding: '10px 20px',
            });
            console.error('Error toggling user status:', error);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('AdminToken');
            let query = `/api/v1/management/admin/users?role=user&export=excel`;

            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (status === 'active') query += `&isBanned=false`;
            else if (status === 'inactive') query += `&isBanned=true`;

            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`;
            }

            const response = await fetch(query, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed. Please check your permissions.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customer_list_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            Swal.fire({
                icon: 'success',
                title: 'Export Successful',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (error: any) {
            console.error('Export error:', error);
            Swal.fire('Error', error.message || 'Failed to generate export', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'user', label: 'User' },
        { key: 'phone', label: 'Phone' },
        { key: 'orders', label: 'Total | Today' },
        { key: 'status', label: 'Ban Status' },
        { key: 'lastOrderDate', label: 'Last Order' },
        { key: 'joinedDate', label: 'Joined' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline font-bold">
                        Dashboard
                    </Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>User Manager</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Customer List</span>
                </li>
            </ul>

            <div className={`fixed top-0 left-0 right-0 h-1 z-[1000] overflow-hidden bg-primary/20 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full bg-primary animate-progress w-full"></div>
            </div>

            <UserManagerTable
                key="customer-manager-list"
                title="Customer"
                data={customerData}
                columns={columns}
                loading={loading}
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
                onStatusToggle={hasPerm('customers', 'update') ? handleStatusToggle : undefined}
                onViewClick={(item) => window.location.href = `/users/view/${item.originalId}`}
                onExportClick={handleExport}
                userType="Customer"
                hideEdit={true}
                hideDelete={true}
                hideAdd={true}
                disableNameClick={true}
            />
        </div>
    );
};

export default CustomerList;
