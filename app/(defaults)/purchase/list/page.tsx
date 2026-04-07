'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const PurchaseList = () => {
    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [productsMap, setProductsMap] = useState<Record<string, string>>({});
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
            if (response?.data) {
                const mappedData = response.data.map((item: any) => {
                    let parsedItems = [];
                    try { parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []); } catch (e) { parsedItems = []; }
                    return {
                        id: item.id || item._id,
                        date: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A',
                        supplier: item.supplier?.name || 'N/A',
                        reference: item.reference_no || 'N/A',
                        location: item.warehouse?.name || 'N/A',
                        total: `₹${Number(item.grand_total || 0).toLocaleString('en-IN')}`,
                        invoice_url: item.invoice_url,
                        products: parsedItems.length > 0 ? parsedItems.map((pi: any) => productsMap[pi.product_id] || pi.product_name || pi.name || `Item (${pi.product_id?.slice(-6)})`).join(', ') : 'N/A'
                    };
                });
                setPurchaseData(mappedData);
                setTotalRecords(response.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching purchase list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);
    useEffect(() => { fetchData(page); }, [page, debouncedSearch, status, dateRange, productsMap]);

    const fetchProducts = async () => {
        try {
            const res = await callApi('/management/admin/products?limit=1000', 'GET');
            if (res?.data) {
                const map: Record<string, string> = {};
                res.data.forEach((p: any) => { const id = p.id || p._id; if (id) map[id] = p.name || 'Unknown Item'; });
                setProductsMap(map);
            }
        } catch (e) { }
    };

    const handleExport = async (format: string) => {
        try {
            const response = await callApi('/management/admin/reports/purchase-history', 'GET');
            if (response?.data) {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(response.data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');
                const fileName = `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(workbook, fileName);
                
                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                });
                toast.fire({ icon: 'success', title: 'Purchase report exported successfully!' });
            }
        } catch (error) {
            console.error('Export failed:', error);
            Swal.fire('Error', 'Failed to generate Excel report', 'error');
        }
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) try { setPerms(JSON.parse(storedPerms)); } catch (e) { }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true;
        return perms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'reference', label: 'Reference No' },
        { key: 'products', label: 'Items' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'location', label: 'Location' },
        { key: 'total', label: 'Grand Total' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2"><span>Purchase</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 font-bold text-gray-400 uppercase"><span>Export Report</span></li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10"><span className="animate-spin rounded-full border-4 border-primary w-10 h-10"></span></div>
            ) : (
                <UserManagerTable
                    title="Purchase Order History"
                    data={purchaseData} columns={columns} userType="Purchase"
                    totalRecords={totalRecords} totalUsers={totalRecords} page={page} pageSize={pageSize}
                    onPageChange={(p) => setPage(p)} search={search} onSearchChange={setSearch}
                    status={status} onStatusChange={setStatus} dateRange={dateRange} onDateRangeChange={setDateRange}
                    onAddClick={hasPerm('purchase', 'create') ? () => router.push('/purchase/add') : undefined}
                    onEditClick={hasPerm('purchase', 'update') ? (item: any) => router.push(`/purchase/edit/${item.id}`) : undefined}
                    onExportClick={uRole === 'super_admin' ? handleExport : undefined}
                    addButtonLabel="Add New Purchase" hideView={true} hideDelete={true}
                />
            )}
        </div>
    );
};

export default PurchaseList;
