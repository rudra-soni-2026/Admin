'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';

const WarehouseInventory = () => {
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
            let query = `management/admin/warehouse-inventory?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            const response = await callApi(query, 'GET');
            if (response?.data) {
                const mappedData = response.data.map((item: any) => ({
                    id: `#WH-${item._id?.slice(-4).toUpperCase() || 'INV'}`,
                    warehouse: item.warehouse?.name || 'N/A',
                    product: item.product?.name || 'Unknown',
                    stock: `${item.stock_count} units`,
                    lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Never',
                    status: item.stock_count > 20 ? 'Active' : 'Inactive',
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

    const columns = [
        { key: 'id', label: 'Batch ID' },
        { key: 'warehouse', label: 'Warehouse Name' },
        { key: 'product', label: 'Product Name' },
        { key: 'stock', label: 'In Stock' },
        { key: 'lastUpdated', label: 'Updated' },
        { key: 'status', label: 'Stock Health' },
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
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    search={search}
                    onSearchChange={setSearch}
                    onAddClick={() => window.location.href = '/inventory/transfer'}
                    addButtonLabel="Transfer Stock"
                    hideView={true}
                    hideDelete={true}
                    hideAction={true}
                />
            )}
        </div>
    );
};

export default WarehouseInventory;
