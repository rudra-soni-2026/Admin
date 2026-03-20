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
        { key: 'name', label: 'Rider Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'vehicleType', label: 'Vehicle' },
        { key: 'vehicleNumber', label: 'Number' },
        { key: 'storeName', label: 'Assigned Store' },
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
                setRiders(response.data);
                setTotalRecords(response.totalRecords || response.data.length);
            }
        } catch (error) {
            console.error('Error fetching riders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rider: any) => {
        router.push(`/riders/edit/${rider.id || rider._id}`);
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
                page={page}
                onPageChange={(p) => setPage(p)}
                onEditClick={handleEdit}
                onAddClick={() => router.push('/riders/add')}
                addButtonLabel="Register New Rider"
                hideDelete={true}
                hideView={true}
            />
        </div>
    );
};

export default RiderList;
