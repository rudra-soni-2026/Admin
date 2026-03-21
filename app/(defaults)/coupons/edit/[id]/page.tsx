'use client';
import React, { useEffect, useState } from 'react';
import CouponForm from '@/components/coupons/coupon-form';
import { useParams } from 'next/navigation';
import { callApi } from '@/utils/api';

const CouponEdit = () => {
    const params = useParams();
    const id = params.id as string;
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        const fetchCoupon = async () => {
             // 1. Try local cache first (from list page)
             const cached = localStorage.getItem(`edit_coupon_${id}`);
             if (cached) {
                 setEditData(JSON.parse(cached));
                 return;
             }
             
             // 2. Fallback to API
             try {
                // Assuming /admin/coupons/:code or similar
                // But list page uses a mapped item with id: item.code
                // Let's assume the backend takes the code as param?
                // The route in management.routes.js was router.patch('/admin/coupons/:code', authMiddleware, updateCoupon);
                // So id here is actually the code.
                const response = await callApi(`/management/admin/coupons/${id}`, 'GET');
                if (response && response.data) {
                    setEditData(response.data);
                }
             } catch (error) {
                console.error("Error fetching coupon", error);
             }
        };
        if (id) fetchCoupon();
    }, [id]);

    return (
        <div className="max-w-4xl mx-auto">
            <CouponForm id={id} editData={editData} />
        </div>
    );
};

export default CouponEdit;
