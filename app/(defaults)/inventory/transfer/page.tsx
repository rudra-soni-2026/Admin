'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import UserManagerTable from '@/components/user-manager/user-manager-table';

const InventoryTransfer = () => {
    const router = useRouter();
    // History States
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Initial Fetch
    useEffect(() => {
        fetchTransferHistory();
    }, [historyPage, historyPageSize]);

    const fetchTransferHistory = async () => {
        try {
            setHistoryLoading(true);

            const storedRole = localStorage.getItem('role')?.toLowerCase() || '';
            const userDataString = localStorage.getItem('userData');
            let query = `/management/admin/inventory-transfers?page=${historyPage}&limit=${historyPageSize}`;

            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    const assignedId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id;

                    if (assignedId && assignedId !== 'all') {
                        if (storedRole.includes('store_manager')) {
                            query += `&storeId=${assignedId}`;
                        } else if (storedRole.includes('warehouse_manager')) {
                            query += `&warehouseId=${assignedId}`;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }

            const response = await callApi(query, 'GET');
            if (response?.data) {
                const mapped = response.data.map((item: any) => {
                    let itemsArray = [];
                    try {
                        itemsArray = Array.isArray(item.items) ? item.items :
                            (typeof item.items === 'string' ? JSON.parse(item.items) : []);
                    } catch (e) { itemsArray = []; }

                    const totalUnits = itemsArray.reduce((acc: number, i: any) => acc + (Number(i.quantity) || 0), 0);
                    const firstItem = itemsArray[0] || {};

                    return {
                        ...item,
                        id: item.status === 'PENDING' ? `#REQ-${item.id.slice(-6).toUpperCase()}` : `#TR-${item.id.slice(-6).toUpperCase()}`,
                        originalId: item.id,
                        from: item.source_warehouse?.name || '---',
                        to: item.destination_store?.name || '---',
                        image: firstItem.product?.image || firstItem.product_image || '/assets/images/profile-1.jpeg',
                        items_summary: `${firstItem.product?.name || firstItem.product_name || 'N/A'} ${itemsArray.length > 1 ? `(+${itemsArray.length - 1} more)` : ''} | Total: ${totalUnits}`,
                        date: item.createdAt ? new Date(item.createdAt).toLocaleString() : (item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'),
                        status_label: item.status,
                    };
                });
                setHistoryData(mapped);
                setHistoryTotal(response.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleApproveTransfer = async (record: any) => {
        if (record.status_label !== 'PENDING') {
            showMessage('This transfer is already processed.', 'info');
            return;
        }

        try {
            const confirm = await Swal.fire({
                title: 'Approve Transfer?',
                text: 'Kya aap is stock request ko approve karna chahte hain?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#4361ee',
                cancelButtonColor: '#e7515a',
                confirmButtonText: 'Yes, Approve It!'
            });

            if (confirm.isConfirmed) {
                setHistoryLoading(true);
                let items = [];
                try {
                    items = typeof record.items === 'string' ? JSON.parse(record.items) : (record.items || []);
                } catch (e) { items = []; }

                const payload = {
                    source_warehouse_id: record.source_warehouse_id,
                    destination_store_id: record.destination_store_id,
                    items: items
                };

                const response = await callApi('/management/admin/inventory-transfer', 'POST', payload);
                if (response?.success) {
                    showMessage('Stock successfully transfer ho chuka hai.', 'success');
                    fetchTransferHistory();
                } else {
                    showMessage(response?.message || 'Approval failed.', 'error');
                }
            }
        } catch (error: any) {
            showMessage(error?.message || 'Something went wrong.', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, [historyPage]);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    const columns = [
        { key: 'id', label: 'Reference' },
        { key: 'image', label: 'Item' },
        { key: 'items_summary', label: 'Product Details' },
        { key: 'from', label: 'From (Warehouse)' },
        { key: 'to', label: 'To (Store)' },
        { key: 'date', label: 'Time' },
        { key: 'status_label', label: 'Status' },
    ];

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Inventory</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold">
                    <span>History</span>
                </li>
            </ul>

            {historyLoading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable
                    title="Inventory History"
                    data={historyData}
                    columns={columns}
                    userType="Inventory"
                    totalRecords={historyTotal}
                    totalUsers={historyTotal}
                    page={historyPage}
                    pageSize={historyPageSize}
                    onPageChange={(p) => setHistoryPage(p)}
                    onStatusClick={hasPerm('inventory', 'update') ? (record) => handleApproveTransfer(record) : undefined}
                    onViewClick={(record) => {
                        // 🚀 SessionStorage Hack: Avoid huge URL params while keeping instant load
                        sessionStorage.setItem(`transfer_${record.originalId}`, JSON.stringify(record));
                        router.push(`/inventory/transfer/view/${record.originalId}`);
                    }}
                    hideAdd={true}
                    hideDelete={true}
                    hideView={true}
                />
            )}
        </div>
    );
};

export default InventoryTransfer;
