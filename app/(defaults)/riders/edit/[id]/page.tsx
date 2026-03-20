'use client';
import React, { useState, useEffect } from 'react';
import RiderForm from '@/components/users/rider-form';
import { callApi } from '@/utils/api';
import { useParams } from 'next/navigation';

const EditRider = () => {
    const params = useParams();
    const id = params.id as string;
    const [riderData, setRiderData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchRider();
    }, [id]);

    const fetchRider = async () => {
        try {
            setLoading(true);
            const response = await callApi(`/management/admin/riders/${id}`, 'GET');
            if (response && response.data) setRiderData(response.data);
        } catch (error) {
            console.error('Error fetching rider:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="panel flex items-center justify-center min-h-[400px]">Loading...</div>;

    return (
        <div className="animate__animated animate__fadeIn">
            <RiderForm id={id} editData={riderData} />
        </div>
    );
};

export default EditRider;
