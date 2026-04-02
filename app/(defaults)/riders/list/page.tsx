'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const RiderList = () => {
    const [riderData, setRiderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');

    const router = useRouter();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/riders?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;

            const response = await callApi(query, 'GET');
            if (response && response.data) {
                const mappedData = response.data.map((item: any) => ({
                    ...item,
                    id: item.id || item._id,
                    originalId: item.id || item._id, // Required for status toggle
                    name: item.user?.name || item.name || 'N/A',
                    phone: item.user?.phone || item.phone || 'N/A',
                    email: item.user?.email || item.email || 'N/A',
                    status: item.isActive ? 'Active' : 'Inactive',
                    vehicleType: item.vehicleType || 'N/A',
                    vehicleNumber: item.vehicleNumber || 'N/A',
                    vehicleModel: item.vehicleModel || 'N/A'
                }));
                setRiderData(mappedData);
                setTotalRecords(response.totalCount || response.data?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching rider list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, debouncedSearch, status]);

    const handleAddRider = () => {
        router.push('/riders/add');
    };

    const handleEditRider = (item: any) => {
        localStorage.setItem(`edit_rider_${item.originalId}`, JSON.stringify(item));
        router.push(`/riders/edit/${item.id}`);
    };

    const handleDeleteRider = async (item: any) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                await callApi(`/management/admin/riders/${item.id}`, 'DELETE');
                Swal.fire('Deleted!', 'Rider has been deleted.', 'success');
                fetchData(page);
            }
        } catch (error: any) {
            Swal.fire('Error!', error.message || 'Failed to delete rider', 'error');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'Active' ? false : true;
            await callApi(`/management/admin/riders/${id}`, 'PATCH', { isActive: newStatus });
            showMessage('Status updated successfully', 'success');
            fetchData(page);
        } catch (error: any) {
            showMessage(error.message || 'Failed to update status', 'danger');
        }
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
        });
        toast.fire({ icon: type, title: msg });
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'vehicleType', label: 'Vehicle' },
        { key: 'vehicleModel', label: 'Model' },
        { key: 'vehicleNumber', label: 'Number' },
        { key: 'status', label: 'Status' },
    ];

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, [page]);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Rider Management</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Rider List</span></li>
            </ul>

            <div className={`fixed top-0 left-0 right-0 h-1 z-[1000] overflow-hidden bg-primary/20 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="h-full bg-primary animate-progress w-full"></div>
            </div>

            <UserManagerTable
                key="rider-manager-list"
                title="Riders"
                data={riderData}
                columns={columns}
                userType="Rider"
                loading={loading}
                totalRecords={totalRecords}
                totalUsers={totalRecords}
                page={page}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                search={search}
                onSearchChange={setSearch}
                status={status}
                onStatusChange={setStatus}
                onAddClick={hasPerm('riders', 'create') ? handleAddRider : undefined}
                onEditClick={hasPerm('riders', 'update') ? handleEditRider : undefined}
                onStatusToggle={hasPerm('riders', 'update') ? handleStatusToggle : undefined}
                addButtonLabel="Add New Rider"
                hideView={true}
                hideDelete={true}
            />
        </div>
    );
};

export default RiderList;
