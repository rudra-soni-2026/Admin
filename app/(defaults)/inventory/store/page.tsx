'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import { DataTable } from 'mantine-datatable';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconBox from '@/components/icon/icon-box';
import IconSearch from '@/components/icon/icon-search';

const StoreInventory = () => {
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
            let query = `management/admin/store-inventory?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            const response = await callApi(query, 'GET');
            if (response?.data) {
                setInventoryData(response.data);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Store Inventory</h1>
                <Link href="/inventory/transfer" className="btn btn-info">
                    Request Transfer
                </Link>
            </div>

            <div className="panel overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold">Total Records: {totalRecords}</div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-input py-2 ltr:pl-10 rtl:pr-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <IconSearch className="w-4 h-4 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 opacity-30" />
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        className="table-hover whitespace-nowrap"
                        records={inventoryData}
                        columns={[
                            {
                                accessor: 'store',
                                title: 'Store',
                                render: ({ store }: any) => <span className="font-semibold">{store?.name || 'N/A'}</span>
                            },
                            {
                                accessor: 'product',
                                title: 'Product',
                                render: ({ product }: any) => (
                                    <div className="flex items-center gap-2">
                                        <IconBox className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold">{product?.name || 'Unknown'}</span>
                                    </div>
                                )
                            },
                            {
                                accessor: 'stock_count',
                                title: 'Stock',
                                render: ({ stock_count }: any) => (
                                    <span className={`badge ${stock_count > 5 ? 'badge-outline-primary' : 'badge-outline-danger'}`}>
                                        {stock_count} units
                                    </span>
                                )
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                render: ({ stock_count }: any) => (
                                    stock_count <= 5 ? (
                                        <span className="text-danger font-bold text-xs uppercase">Low Stock</span>
                                    ) : (
                                        <span className="text-success font-bold text-xs uppercase">Healthy</span>
                                    )
                                )
                            }
                        ]}
                        fetching={loading}
                        totalRecords={totalRecords}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={[25, 50, 100]}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={300}
                    />
                </div>
            </div>
        </div>
    );
};

export default StoreInventory;
