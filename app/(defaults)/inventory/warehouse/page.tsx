'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import IconInfoTriangle from '@/components/icon/icon-info-triangle';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

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

    const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);

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

    const fetchStockAlerts = async () => {
        try {
            setLoadingStock(true);
            
            let query = `/management/admin/warehouse-inventory?page=1&limit=100`;
            if (warehouseIdParam) query += `&warehouse_id=${warehouseIdParam}`;
            
            // Auto-detect for warehouse_manager if no param
            if (!warehouseIdParam) {
                const storedRole = localStorage.getItem('role');
                const userDataString = localStorage.getItem('userData');
                if (storedRole?.toLowerCase().includes('warehouse_manager') && userDataString) {
                    try {
                        const userData = JSON.parse(userDataString);
                        const assignedId = userData.assignedId || userData.assigned_id || userData.warehouseId || userData.warehouse_id;
                        if (assignedId) query += `&warehouse_id=${assignedId}`;
                    } catch (e) { }
                }
            }

            const response = await callApi(query, 'GET');
            if (response?.data) {
                const outOfStock = response.data.filter((item: any) => (item.stock_count || 0) === 0);
                const lowStock = response.data.filter((item: any) => (item.stock_count || 0) > 0 && (item.stock_count || 0) <= (item.low_stock_threshold || 2));
                setOutOfStockProducts(outOfStock);
                setLowStockProducts(lowStock);
            }
        } catch (error) {
            console.error('Error fetching stock alerts:', error);
        } finally {
            setLoadingStock(false);
        }
    };

    useEffect(() => {
        fetchData(page);
        fetchStockAlerts();
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h5 className="text-xl font-black uppercase tracking-tight text-white-dark dark:text-white">Store Inventory</h5>
                    <ul className="flex space-x-2 rtl:space-x-reverse text-xs mt-1">
                        <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Inventory</span></li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-gray-400"><span>Store Report</span></li>
                    </ul>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/inventory/transfer" className="btn btn-outline-primary shadow-sm uppercase font-black text-[10px] px-5 py-2 group">
                        <IconArrowBackward className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Full History
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                {/* Out of Stock Section */}
                <div className="panel h-full w-full border-t-4 border-danger">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold dark:text-white-light flex items-center gap-2">
                            <IconXCircle className="text-danger" />
                            Out of Stock
                            <span className="badge badge-outline-danger rounded-full ml-2">{outOfStockProducts.length}</span>
                        </h5>
                    </div>
                    <div className="table-responsive max-h-[300px] overflow-y-auto -mx-5 px-5">
                        <table className="table-hover">
                            <thead>
                                <tr className="!bg-transparent dark:!bg-transparent border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
                                    <th className="!py-3 !pl-0">Product</th>
                                    <th className="text-center !py-3 !pr-0 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e0e6ed] dark:divide-[#1b2e4b]">
                                {outOfStockProducts.map((item: any, index: number) => (
                                    <tr key={index} className="group text-white-dark hover:text-black dark:hover:text-white-light/90 border-none">
                                        <td className="text-black dark:text-white !py-3 !pl-0 border-none">
                                            <div className="flex items-center">
                                                <img className="h-9 w-9 rounded-md object-cover ltr:mr-3 rtl:ml-3 shadow-sm" src={item.product?.image || "/assets/images/product-headphones.jpg"} alt="product" />
                                                <span className="line-clamp-1 font-medium">{item.product?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="text-center !py-3 !pr-0 border-none">
                                            <span className="badge bg-danger/10 text-danger border-none font-bold px-3 py-1">0 Units</span>
                                        </td>
                                    </tr>
                                ))}
                                {outOfStockProducts.length === 0 && !loadingStock && (
                                    <tr>
                                        <td colSpan={2} className="text-center py-6 text-white-dark italic">✨ All products are in stock</td>
                                    </tr>
                                )}
                                {loadingStock && (
                                     <tr>
                                        <td colSpan={2} className="text-center py-6">
                                            <span className="animate-spin inline-block w-5 h-5 border-2 border-primary border-l-transparent rounded-full"></span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Section */}
                <div className="panel h-full w-full border-t-4 border-warning shadow-md">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-bold dark:text-white-light flex items-center gap-2">
                            <IconInfoTriangle className="text-warning h-5 w-5" />
                            Low Stock Alerts
                            <span className="badge badge-outline-warning rounded-full ml-2 text-xs">{lowStockProducts.length}</span>
                        </h5>
                    </div>
                    <div className="table-responsive max-h-[300px] overflow-y-auto -mx-5 px-5">
                        <table className="table-hover">
                            <thead>
                                <tr className="!bg-transparent dark:!bg-transparent border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
                                    <th className="!py-3 !pl-0">Product</th>
                                    <th className="text-center !py-3 !pr-0 font-bold">Remaining</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e0e6ed] dark:divide-[#1b2e4b]">
                                {lowStockProducts.map((item: any, index: number) => (
                                    <tr key={index} className="group text-white-dark hover:text-black dark:hover:text-white-light/90 border-none">
                                        <td className="text-black dark:text-white !py-3 !pl-0 border-none">
                                            <div className="flex items-center">
                                                <img className="h-9 w-9 rounded-md object-cover ltr:mr-3 rtl:ml-3 shadow-sm" src={item.product?.image || "/assets/images/product-headphones.jpg"} alt="product" />
                                                <span className="line-clamp-1 font-medium">{item.product?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="text-center !py-3 !pr-0 border-none">
                                            <span className="badge bg-warning/10 text-warning border-none font-bold px-3 py-1">{item.stock_count} Units Left</span>
                                        </td>
                                    </tr>
                                ))}
                                {lowStockProducts.length === 0 && !loadingStock && (
                                    <tr>
                                        <td colSpan={2} className="text-center py-6 text-white-dark italic">👍 No low stock alerts</td>
                                    </tr>
                                )}
                                {loadingStock && (
                                     <tr>
                                        <td colSpan={2} className="text-center py-6">
                                            <span className="animate-spin inline-block w-5 h-5 border-2 border-primary border-l-transparent rounded-full"></span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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
