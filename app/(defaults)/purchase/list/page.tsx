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
            if (response && response.data) {
                const mappedData = response.data.map((item: any) => {
                    let parsedItems = [];
                    try {
                        parsedItems = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []);
                    } catch (e) {
                        parsedItems = [];
                    }

                    return {
                        id: item.id || item._id,
                        date: item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A',
                        supplier: item.supplier?.name || 'N/A',
                        reference: item.reference_no || 'N/A',
                        location: item.warehouse?.name || 'N/A',
                        total: `₹${Number(item.grand_total || 0).toLocaleString('en-IN')}`,
                        invoice_url: item.invoice_url,
                        products: parsedItems.length > 0 
                            ? parsedItems.map((pi: any) => productsMap[pi.product_id] || pi.product_name || pi.name || `Item (${pi.product_id?.slice(-6)})`).join(', ') 
                            : 'N/A'
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

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchData(page);
    }, [page, debouncedSearch, status, dateRange, productsMap]);

    const fetchProducts = async () => {
        try {
            const res = await callApi('/management/admin/products?limit=1000', 'GET');
            if (res && res.data) {
                const map: Record<string, string> = {};
                res.data.forEach((p: any) => {
                    const id = p.id || p._id;
                    if (id) map[id] = p.name || p.product_name || 'Unknown Item';
                });
                setProductsMap(map);
            }
        } catch (e) {
            console.error('Error fetching products for map:', e);
        }
    };

    const handleAddPurchase = () => {
        router.push('/purchase/add');
    };

    const handleViewPurchase = (item: any) => {
        router.push(`/purchase/view/${item.id}`);
    };

    const handleDownloadInvoice = (item: any) => {
        if (item.invoice_url) {
            window.open(item.invoice_url, '_blank');
        } else {
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
            });
            toast.fire({ icon: 'info', title: 'No invoice attached to this purchase' });
        }
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
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Purchase Management</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Purchase List</span></li>
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
                    onDownloadClick={handleDownloadInvoice}
                    hideView={true}
                    hideDelete={true}
                />
            )}
        </div>
    );
};

export default PurchaseList;
