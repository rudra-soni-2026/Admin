'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';

import { useSearchParams } from 'next/navigation';

const WarehouseInventory = () => {
    const searchParams = useSearchParams();
    const warehouseIdParam = searchParams.get('warehouse_id');
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/warehouse-inventory?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (warehouseIdParam) query += `&warehouse_id=${warehouseIdParam}`;

            const response = await callApi(query, 'GET');
            if (response?.data) {
                const mappedData = response.data.map((item: any) => ({
                    id: item.id || `#WH-${item._id?.slice(-4).toUpperCase() || 'INV'}`,
                    image: item.product?.image || '/assets/images/profile-1.jpeg',
                    product: item.product?.name || 'Unknown Product',
                    unit: item.product?.unit_label || 'N/A',
                    stock: `${item.stock_count || 0} units`,
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

    const columns = [
        { key: 'image', label: 'Image' },
        { key: 'product', label: 'Product Name' },
        { key: 'unit', label: 'Unit' },
        { key: 'stock', label: 'Total Stock' },
    ];

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6 text-sm">
                <li>
                    <Link href="/" className="text-primary hover:underline font-bold">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Inventory</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold">
                    <span>Warehouse Report</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Warehouse Stock"
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
                    onAddClick={hasPerm('inventory', 'create') ? () => window.location.href = '/inventory/request' : undefined}
                    addButtonLabel="Transfer Stock"
                    hideView={true}
                    hideDelete={true}
                    hideAction={!hasPerm('inventory', 'update')}
                />
            )}
        </div>
    );
};

export default WarehouseInventory;
