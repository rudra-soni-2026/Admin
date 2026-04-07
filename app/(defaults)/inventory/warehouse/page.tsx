'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import IconInfoTriangle from '@/components/icon/icon-info-triangle';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import Swal from 'sweetalert2';
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
                    threshold: `${item.low_stock_threshold || 0} units`,
                    originalId: item.id || item._id,
                    productId: item.product_id,
                    stockNum: item.stock_count || 0,
                    thresholdNum: item.low_stock_threshold || 2
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
            else {
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
                setOutOfStockProducts(response.data.filter((item: any) => (item.stock_count || 0) === 0));
                setLowStockProducts(response.data.filter((item: any) => (item.stock_count || 0) > 0 && (item.stock_count || 0) <= (item.low_stock_threshold || 2)));
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
        if (uRole !== 'admin') return true;
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'image', label: 'Image' },
        { key: 'product', label: 'Product Name' },
        { key: 'unit', label: 'Unit' },
        { key: 'stock', label: 'Total Stock' },
        { key: 'threshold', label: 'Alert Threshold' },
    ];

    const showToast = (msg: string, type: 'success' | 'danger' = 'success') => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        toast.fire({
            icon: type === 'danger' ? 'error' : 'success',
            title: `<span class="text-[12px] font-black uppercase">${msg}</span>`,
            padding: '10px 20px',
            customClass: { popup: type === 'danger' ? '!bg-danger !text-white' : '!bg-success !text-white' }
        });
    };

    const handleEdit = async (item: any) => {
        const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : '';
        const isSuperAdmin = storedRole?.toLowerCase() === 'super_admin';

        const { value: formValues } = await Swal.fire({
            title: `Warehouse Inventory Management`,
            html: `<div class="flex flex-col gap-4 text-left p-2"><div class="bg-info/5 p-3 rounded-lg border border-info/10 mb-2">` +
                `<h6 class="text-sm font-black text-info uppercase">${item.product}</h6></div>` +
                (isSuperAdmin ? `<div class="flex flex-col gap-1"><label class="text-[10px] font-black uppercase text-gray-400">📦 Stock</label>` +
                `<input id="swal-input1" class="swal2-input !m-0 !w-full" type="number" value="${item.stockNum}"></div>` : '') +
                `<div class="flex flex-col gap-1"><label class="text-[10px] font-black uppercase text-gray-400">⚠️ Threshold</label>` +
                `<input id="swal-input2" class="swal2-input !m-0 !w-full" type="number" value="${item.thresholdNum}"></div></div>`,
            showCancelButton: true,
            confirmButtonText: 'Update Stock 🚀',
            preConfirm: () => [
                isSuperAdmin ? (document.getElementById('swal-input1') as HTMLInputElement).value : item.stockNum,
                (document.getElementById('swal-input2') as HTMLInputElement).value
            ]
        });

        if (formValues) {
            try {
                const [newStock, newThreshold] = formValues;
                const warehouse_id = warehouseIdParam || localStorage.getItem('assigned_id') || localStorage.getItem('warehouseId');
                const response = await callApi('/management/admin/update-warehouse-inventory', 'POST', {
                    warehouse_id, product_id: item.productId, stock_count: parseInt(newStock), low_stock_threshold: parseInt(newThreshold)
                });
                if (response?.status === 'success') {
                    showToast('Warehouse inventory saved.');
                    fetchData(page);
                } else throw new Error(response?.message || 'Update failed');
            } catch (error: any) {
                showToast(error.message, 'danger');
            }
        }
    };

    const handleExport = async (format: string) => {
        try {
            const response = await callApi('/management/admin/reports/warehouse-stock', 'GET');
            if (response?.data) {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(response.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'WarehouseStock');
                const fileName = `Warehouse_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(workbook, fileName);
                showToast('Excel report downloaded!');
            }
        } catch (error) {
            showToast('Export failed', 'danger');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h5 className="text-xl font-black uppercase tracking-tight text-white-dark dark:text-white">Warehouse Inventory</h5>
                    <ul className="flex space-x-2 text-xs mt-1">
                        <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                        <li className="before:content-['/'] ltr:before:mr-2"><span>Inventory</span></li>
                        <li className="before:content-['/'] ltr:before:mr-2 font-bold text-gray-400"><span>Warehouse Report</span></li>
                    </ul>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/inventory/transfer" className="btn btn-outline-primary shadow-sm uppercase font-black text-[10px] px-5 py-2 group">
                        <IconArrowBackward className="w-4 h-4 mr-2" /> Full History
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                <div className="panel h-full border-t-4 border-danger">
                    <div className="mb-5 flex items-center justify-between"><h5 className="text-lg font-semibold flex items-center gap-2"><IconXCircle className="text-danger" /> Out of Stock <span className="badge badge-outline-danger ml-2">{outOfStockProducts.length}</span></h5></div>
                    <div className="table-responsive max-h-[300px] overflow-y-auto px-5">
                        <table className="table-hover">
                            <thead><tr><th className="!py-3 !pl-0">Product</th><th className="text-center !py-3 !pr-0 font-bold">Status</th></tr></thead>
                            <tbody className="divide-y">{outOfStockProducts.map((item: any, index: number) => (
                                <tr key={index} className="group border-none"><td className="!py-3 !pl-0 border-none"><div className="flex items-center"><img className="h-9 w-9 rounded-md object-cover mr-3 shadow-sm" src={item.product?.image || "/assets/images/product-headphones.jpg"} alt="" /><span className="line-clamp-1 font-medium">{item.product?.name || 'Unknown'}</span></div></td><td className="text-center border-none"><span className="badge bg-danger/10 text-danger font-bold px-3 py-1">0 Units</span></td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
                <div className="panel h-full border-t-4 border-warning shadow-md">
                    <div className="mb-5 flex items-center justify-between"><h5 className="text-lg font-bold flex items-center gap-2"><IconInfoTriangle className="text-warning h-5 w-5" /> Low Stock <span className="badge badge-outline-warning ml-2 text-xs">{lowStockProducts.length}</span></h5></div>
                    <div className="table-responsive max-h-[300px] overflow-y-auto px-5">
                        <table className="table-hover">
                            <thead><tr><th className="!py-3 !pl-0">Product</th><th className="text-center !py-3 !pr-0 font-bold">Remaining</th></tr></thead>
                            <tbody className="divide-y">{lowStockProducts.map((item: any, index: number) => (
                                <tr key={index} className="group border-none"><td className="!py-3 !pl-0 border-none"><div className="flex items-center"><img className="h-9 w-9 rounded-md object-cover mr-3 shadow-sm" src={item.product?.image || "/assets/images/product-headphones.jpg"} alt="" /><span className="line-clamp-1 font-medium">{item.product?.name || 'Unknown'}</span></div></td><td className="text-center border-none"><span className="badge bg-warning/10 text-warning font-bold px-3 py-1">{item.stock_count} Units Left</span></td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-10"><span className="animate-spin rounded-full border-4 border-success w-10 h-10"></span></div>
            ) : (
                <UserManagerTable
                    title="Warehouse Stock" data={inventoryData} columns={columns} userType="Inventory"
                    totalRecords={totalRecords} totalUsers={totalRecords} page={page} pageSize={pageSize}
                    onPageChange={(p) => setPage(p)} search={search} onSearchChange={setSearch}
                    onAddClick={hasPerm('inventory', 'create') ? () => window.location.href = '/inventory/request' : undefined}
                    onEditClick={handleEdit} onExportClick={uRole === 'super_admin' ? handleExport : undefined}
                    addButtonLabel="Transfer Stock" hideView={true} hideDelete={true} hideAction={!hasPerm('inventory', 'update')}
                />
            )}
        </div>
    );
};

export default WarehouseInventory;
