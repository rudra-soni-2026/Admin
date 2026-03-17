'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const SupplierList = () => {
    const [supplierData, setSupplierData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const [todaySuppliers, setTodaySuppliers] = useState(0);

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

    const fetchSuppliers = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/suppliers?page=${currentPage}&limit=${pageSize}`;
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
                const mappedData = response.data.map((supplier: any) => ({
                    id: supplier.id ? `#${String(supplier.id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                    originalId: supplier.id,
                    name: supplier.name || 'Unknown Supplier',
                    contact_person: supplier.contact_person || '-',
                    image: supplier.image || '/assets/images/profile-1.jpeg',
                    email: supplier.email || 'N/A',
                    phone: supplier.phone || 'N/A',
                    city: supplier.city || '-',
                    tax_id: supplier.tax_id || '-',
                    role: supplier.role?.toUpperCase() || 'SUPPLIER',
                    status: supplier.isBanned ? 'Inactive' : 'Active',
                    joinedDate: supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                }));
                setSupplierData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalSupplier || 0);
                setTotalRecords(count);
                setTotalSuppliers(count);

                if (response.stats) {
                    setTodaySuppliers(response.stats.todaySupplier || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchSuppliers(page);
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
                    title: `Supplier ${isBanned === 'true' ? 'Banned' : 'Unbanned'} successfully`,
                    padding: '10px 20px',
                });

                setSupplierData((prev) => 
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

    const handleAddSupplier = () => {
        router.push('/suppliers/add');
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Business Name' },
        { key: 'contact_person', label: 'Contact Person' },
        { key: 'phone', label: 'Phone' },
        { key: 'city', label: 'City' },
        { key: 'tax_id', label: 'GSTIN/Tax' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Inventory & Products</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Supplier List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Supplier" 
                    data={supplierData} 
                    columns={columns} 
                    userType="Supplier" 
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalSuppliers}
                    todayUsers={todaySuppliers}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onStatusToggle={handleStatusToggle}
                    onAddClick={handleAddSupplier}
                    addButtonLabel="Create New Supplier"
                    hideView={true}
                />
            )}
        </div>
    );
};

export default SupplierList;
