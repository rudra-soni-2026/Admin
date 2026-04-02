'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const AdminList = () => {
    const [adminData, setAdminData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [todayAdmins, setTodayAdmins] = useState(0);

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

    const fetchAdmins = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/list?page=${currentPage}&limit=${pageSize}&role=admin`;
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
                const currentUserString = localStorage.getItem('userData');
                let currentUserId = '';
                if (currentUserString) {
                    try {
                        currentUserId = JSON.parse(currentUserString).id;
                    } catch (e) {}
                }
                const userRole = localStorage.getItem('role');

                const mappedData = response.data
                    .filter((admin: any) => {
                        // If the logged in user is a regular admin, hide their own record from the list
                        if (userRole === 'admin' && admin.id === currentUserId) return false;
                        return true;
                    })
                    .map((admin: any) => ({
                        id: admin.id ? `#${String(admin.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                        originalId: admin.id,
                        name: admin.name || 'Unknown Admin',
                        image: admin.image || '/assets/images/profile-1.jpeg',
                        email: admin.email || 'N/A',
                        phone: admin.phone || 'N/A',
                        role: admin.role?.toUpperCase() || 'ADMIN',
                        status: admin.isBanned ? 'Inactive' : 'Active',
                        joinedDate: admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                        // Include raw fields for the Edit Form (Create/Edit Similarity)
                        permissions: admin.permissions || {},
                        storeIds: admin.storeIds || ['ALL_STORES'],
                        warehouseIds: admin.warehouseIds || ['ALL_WAREHOUSES'],
                    }));
                setAdminData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalAdmin || 0);
                setTotalRecords(count);
                setTotalAdmins(count);

                if (response.stats) {
                    setTodayAdmins(response.stats.todayAdmin || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchAdmins(page);
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
                    title: `Admin ${isBanned === 'true' ? 'Banned' : 'Unbanned'} successfully`,
                    padding: '10px 20px',
                });

                setAdminData((prev) => 
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

    const handleAddAdmin = () => {
        router.push('/admins/add');
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) {}
        }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch(e){}
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'image', label: 'Image' },
        { key: 'name', label: 'Admin Name' },
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
                    <span>Admin List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Admin" 
                    data={adminData} 
                    columns={columns} 
                    userType="Admin" 
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalAdmins}
                    todayUsers={todayAdmins}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusToggle={hasPerm('admins', 'update') ? handleStatusToggle : undefined}
                    onAddClick={hasPerm('admins', 'create') ? handleAddAdmin : undefined}
                    onEditClick={hasPerm('admins', 'update') ? (item: any) => {
                        localStorage.setItem(`edit_user_${item.originalId}`, JSON.stringify(item));
                        router.push(`/admins/edit/${item.originalId}`);
                    } : undefined}
                    hideDelete={true}
                    hideView={true}
                    addButtonLabel="Create New Admin"
                    disableNameClick={true}
                />
            )}
        </div>
    );
};

export default AdminList;
