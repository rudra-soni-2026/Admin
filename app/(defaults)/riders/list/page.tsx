'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import IconPlus from '@/components/icon/icon-plus';

const RiderList = () => {
    const router = useRouter();
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const columns = [
        { key: 'user', label: 'Rider' },
        { key: 'phone', label: 'Phone' },
        { key: 'vehicleType', label: 'Type' },
        { key: 'vehicleNumber', label: 'Number' },
        { key: 'vehicleModel', label: 'Model' },
        { key: 'rating', label: 'Rating' },
        { key: 'totalEarned', label: 'Earned' },
        { key: 'status', label: 'Status' },
    ];

    useEffect(() => {
        fetchRiders();
    }, [page]);

    const fetchRiders = async () => {
        try {
            setLoading(true);
            const response = await callApi(`/management/admin/riders?page=${page}&limit=20`, 'GET');
            if (response && response.data) {
                const mappedData = response.data.map((item: any) => ({
                    ...item,
                    name: item.user?.name || item.name,
                    phone: item.user?.phone || item.phone,
                    status: item.isActive ? 'Active' : 'Inactive',
                    originalId: item.id || item._id,
                    totalEarned: `₹${item.totalEarned || 0}`,
                    balance: `₹${item.balance || 0}`,
                    rating: `${item.rating || 0} ★`
                }));
                setRiders(mappedData);
                setTotalRecords(response.totalRecords || response.data.length);
            }
        } catch (error) {
            console.error('Error fetching riders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rider: any) => {
        localStorage.setItem(`edit_rider_${rider.id || rider._id}`, JSON.stringify(rider));
        router.push(`/riders/edit/${rider.id || rider._id}`);
    };

    const handleStatusToggle = async (id: any, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'Active' ? false : true;
            await callApi(`/management/admin/riders/${id}`, 'PATCH', { isActive: nextStatus });
            fetchRiders();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Riders</span></li>
            </ul>

            <UserManagerTable 
                title="Rider Management" 
                data={riders} 
                columns={columns} 
                userType="Rider"
                totalRecords={totalRecords}
                totalUsers={totalRecords}
                page={page}
                onPageChange={(p) => setPage(p)}
                onEditClick={handleEdit}
                onAddClick={() => router.push('/riders/add')}
                onStatusToggle={handleStatusToggle}
                addButtonLabel="Register New Rider"
                hideDelete={true}
                hideView={true}
                disableNameClick={true}
            />
        </div>
    );
};

export default RiderList;
