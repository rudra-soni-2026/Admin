'use client';
import React, { useEffect, useState } from 'react';
import CouponForm from '@/components/coupons/coupon-form';
import { useParams } from 'next/navigation';

const CouponEdit = () => {
    const params = useParams();
    const id = params.id as string;
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        // Here you would typically fetch real data if needed
        // For now, looking at list page patterns
    }, [id]);

    return (
        <div className="max-w-4xl mx-auto">
            <CouponForm id={id} editData={editData} />
        </div>
    );
};

export default CouponEdit;
