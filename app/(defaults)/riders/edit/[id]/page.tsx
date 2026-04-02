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

    const fetchRider = () => {
        setLoading(true);
        // Rely ONLY on localStorage as requested
        const savedData = localStorage.getItem(`edit_rider_${id}`);
        if (savedData) {
            try {
                setRiderData(JSON.parse(savedData));
            } catch (e) {
                console.error("Error parsing rider data from storage", e);
                window.location.href = '/riders/list';
            }
        } else {
            // If data is missing (e.g. direct URL entry), go back to list
            window.location.href = '/riders/list';
        }
        setLoading(false);
    };

    if (loading) return <div className="panel flex items-center justify-center min-h-[400px]">Loading...</div>;

    return (
        <div className="animate__animated animate__fadeIn">
            <RiderForm id={id} editData={riderData} />
        </div>
    );
};

export default EditRider;
