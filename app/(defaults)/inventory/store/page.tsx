'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';

import { useSearchParams } from 'next/navigation';

const StoreInventory = () => {
    const searchParams = useSearchParams();
    const storeIdParam = searchParams.get('store_id');
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [perms, setPerms] = useState<any>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/store-inventory?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;

            // Check for store_manager assignedId
            const storedRole = localStorage.getItem('role');
            const userDataString = localStorage.getItem('userData');
            let assignedStoreId = storeIdParam;

            if (storedRole?.toLowerCase().includes('store_manager') && userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    assignedStoreId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || assignedStoreId;
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }

            if (assignedStoreId) query += `&store_id=${assignedStoreId}`;

            const response = await callApi(query, 'GET');
            if (response?.data) {
                const mappedData = response.data.map((item: any) => ({
                    id: item.id || `#STR-${item._id?.slice(-4).toUpperCase() || 'INV'}`,
                    image: item.product?.image || '/assets/images/profile-1.jpeg',
                    product: item.product?.name || 'Unknown Product',
                    unit: item.product?.unit_label || 'N/A',
                    stock: `${item.stock_count || 0} units`,
                    originalId: item._id
                }));
                setInventoryData(mappedData);
                setTotalRecords(response.totalCount || 0);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, debouncedSearch, pageSize]);

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
        if (uRole !== 'admin') return true; // Gate only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'image', label: 'Image' },
        { key: 'product', label: 'Product Name' },
        { key: 'unit', label: 'Unit' },
        { key: 'stock', label: 'Total Stock' },
    ];

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link href="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Inventory</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold">
                    <span>Store Report</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Store Stock"
                    data={inventoryData}
                    columns={columns}
                    userType="Inventory"
                    totalRecords={totalRecords}
                    totalUsers={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    search={search}
                    onSearchChange={setSearch}
                    onAddClick={hasPerm('inventory', 'create') ? () => window.location.href = '/inventory/stock-request' : undefined}
                    addButtonLabel="Request For Stock"
                    hideView={true}
                    hideDelete={true}
                    hideAction={!hasPerm('inventory', 'update')}
                />
            )}
        </div>
    );
};

export default StoreInventory;


