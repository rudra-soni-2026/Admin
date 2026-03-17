'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';

const PurchaseList = () => {
    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState<any>('');

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
            let query = `/management/admin/purchases?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            const response = await callApi(query, 'GET');
            if (response && response.data) {
                const mappedData = response.data.map((item: any) => ({
                    id: item.id || item._id,
                    date: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A',
                    supplier: item.supplier?.name || 'N/A',
                    reference: item.reference_no || 'N/A',
                    status: item.status || 'Received',
                    total: `₹${Number(item.grand_total || 0).toLocaleString('en-IN')}`,
                }));
                setPurchaseData(mappedData);
                setTotalRecords(response.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching purchase list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, debouncedSearch, status, dateRange]);

    const handleAddPurchase = () => {
        router.push('/purchase/add');
    };

    const handleViewPurchase = (item: any) => {
        router.push(`/purchase/view/${item.id}`);
    };

    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'reference', label: 'Reference No' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'total', label: 'Grand Total' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Purchase Management</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Purchase List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Purchase Order" 
                    data={purchaseData} 
                    columns={columns} 
                    userType="Purchase" 
                    totalRecords={totalRecords}
                    totalUsers={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onAddClick={handleAddPurchase}
                    addButtonLabel="Add New Purchase"
                    onViewClick={handleViewPurchase}
                    hideDelete={true}
                />
            )}
        </div>
    );
};

export default PurchaseList;
