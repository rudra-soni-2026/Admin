'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import IconPlus from '@/components/icon/icon-plus';

const CouponList = () => {
    const router = useRouter();
    const [couponData, setCouponData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const columns = [
        { key: 'code', label: 'Coupon Code' },
        { key: 'display_type', label: 'Type' },
        { key: 'display_value', label: 'Discount' },
        { key: 'display_minOrder', label: 'Min Order' },
        { key: 'display_expiryDate', label: 'Expiry Date' },
        { key: 'display_status', label: 'Status' },
    ];

    useEffect(() => {
        const fetchCoupons = async () => {
             try {
                 setLoading(true);
                 const response = await callApi(`/management/admin/coupons?page=${page}&limit=10`, 'GET');
                 if (response && response.data) {
                     const mappedData = response.data.map((item: any) => ({
                         ...item,
                         id: item.code, // For actions
                         display_value: item.discountType === 'percentage' ? `${item.value}%` : `₹${item.value}`,
                         display_minOrder: `₹${item.minOrder || 0}`,
                         display_type: item.discountType === 'percentage' ? 'Percentage' : 'Flat Amount',
                         display_expiryDate: new Date(item.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                         display_status: item.isActive ? 'Active' : 'Inactive'
                     }));
                     setCouponData(mappedData);
                     setTotalRecords(response.totalCount || response.results || response.data.length);
                 }
             } catch (error) {
                 console.error('Error fetching coupons', error);
             } finally {
                 setLoading(false);
             }
        };
        fetchCoupons();
    }, [page]);

    const handleEdit = (item: any) => {
        localStorage.setItem(`edit_coupon_${item.id}`, JSON.stringify(item));
        router.push(`/coupons/edit/${item.id}`);
    };

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Promotions</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Coupons</span></li>
            </ul>

            <UserManagerTable 
                title="Coupons Management" 
                data={couponData} 
                columns={columns} 
                userType="Coupon" 
                totalRecords={totalRecords}
                page={page}
                onPageChange={(p) => setPage(p)}
                onEditClick={handleEdit}
                onAddClick={() => router.push('/coupons/add')}
                addButtonLabel="Create New Coupon"
                hideView={true}
                hideDelete={true}
                hideTotal={true}
            />
        </div>
    );
};

export default CouponList;
