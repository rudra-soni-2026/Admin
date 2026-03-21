'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

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
                    cartItemsCount: user.cartProductCount || 0,
                    orders: `${Number(user.todayOrder || 0)} | ${Number(user.totalOrder || 0)}`,
                    status: user.isBanned ? 'Inactive' : 'Active',
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
                            ? { ...user, status: isBanned === 'true' ? 'Inactive' : 'Active' } 
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

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'user', label: 'User' },
        { key: 'phone', label: 'Phone' },
        { key: 'cartItemsCount', label: 'Cart' },
        { key: 'orders', label: 'Today | Total' },
        { key: 'joinedDate', label: 'Joined' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">
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

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Customer" 
                    data={customerData} 
                    columns={columns} 
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
                    userType="Customer"
                    hideDelete={true}
                    hideView={true}
                    hideAction={true}
                    disableNameClick={true}
                />
            )}
        </div>
    );
};

export default CustomerList;
