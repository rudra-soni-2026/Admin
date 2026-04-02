'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const OfferList = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filter States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');

    const router = useRouter();

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `management/admin/offers?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            // status filtering if API supports it, otherwise generic

            const response = await callApi(query, 'GET');

            if (response && response.status === "success") {
                const offers = response.data || [];
                const mappedData = offers.map((offer: any) => ({
                    id: offer._id ? `#${String(offer._id).substring(0, 8).toUpperCase()}` : '#UNKNOWN',
                    originalId: offer._id,
                    user: { // Reuse user field for product info in table
                        name: offer.productId?.name || 'Unknown Product',
                        image: offer.productId?.image || '/assets/images/placeholder.png',
                    },
                    offerPrice: `₹${offer.offerPrice}`,
                    conditions: `Max Qty: ${offer.minQuantity} | Min Val: ₹${offer.minOrderValue}`,
                    validity: `${new Date(offer.startDate).toLocaleDateString()} - ${offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'No Limit'}`,
                    status: offer.status === 'active' || offer.isActive ? 'Active' : 'Inactive',
                    raw: offer
                }));
                setData(mappedData);
                setTotalRecords(response.pagination?.total_items || offers.length);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page);
    }, [page, debouncedSearch, status]);

    const handleStatusToggle = async (id: any, currentStatus: string) => {
        try {
            const response = await callApi(`management/admin/offers/status/${id}`, 'PATCH');

            if (response && response.status === "success") {
                Swal.fire({
                    icon: 'success',
                    title: 'Status updated successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });

                setData((prev) =>
                    prev.map((item) =>
                        item.originalId === id
                            ? { ...item, status: currentStatus === 'Active' ? 'Inactive' : 'Active' }
                            : item
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling offer status:', error);
        }
    };

    const handleAddOffer = () => {
        router.push('/offers/add');
    };

    const handleEditOffer = (item: any) => {
        if (item.raw) {
            localStorage.setItem(`edit_offer_${item.originalId}`, JSON.stringify(item.raw));
        }
        router.push(`/offers/edit/${item.originalId}`);
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'user', label: 'Product' },
        { key: 'offerPrice', label: 'Offer Price' },
        { key: 'conditions', label: 'Conditions' },
        { key: 'validity', label: 'Validity Period' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Products</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Offer Management</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Product Offers"
                    data={data}
                    columns={columns}
                    userType="Offer"
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    onStatusToggle={hasPerm('offers', 'update') ? handleStatusToggle : undefined}
                    onAddClick={hasPerm('offers', 'create') ? handleAddOffer : undefined}
                    onEditClick={hasPerm('offers', 'update') ? handleEditOffer : undefined}
                    addButtonLabel="Add Offer"
                    hideDelete={true}
                    hideView={true}
                    hideFilter={true}
                />
            )}
        </div>
    );
};

export default OfferList;
