'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import moment from 'moment';
import Swal from 'sweetalert2';

const InventoryTransferDetail = () => {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [receivedQuantities, setReceivedQuantities] = useState<any>({});
    const [sentQuantities, setSentQuantities] = useState<any>({});
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userAssignedId, setUserAssignedId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            showCloseButton: true,
            customClass: {
                popup: `color-${icon} border-${icon} shadow-lg animate__animated animate__fadeInRight`,
            },
        });
        toast.fire({ icon, title });
    };

    // Deriving items from data
    let items: any[] = [];
    try {
        const rawItems = data?.items;
        items = Array.isArray(rawItems) ? rawItems : (typeof rawItems === 'string' ? JSON.parse(rawItems) : []);
    } catch (e) { items = []; }

    useEffect(() => {
        // Initialize sent quantities for editing
        if (data?.status === 'PENDING' && Object.keys(sentQuantities).length === 0 && items.length > 0) {
            const initialSent: any = {};
            items.forEach((item: any) => {
                // AUTO-ADJUST: Default Sent to available WH stock if it's lower than what was requested
                const requested = Number(item.requested_quantity || item.quantity || 0);
                const available = Number(item.warehouse_stock || 0);
                initialSent[item.product_id] = Math.min(requested, available);
            });
            setSentQuantities(initialSent);
        }
    }, [data, items]);

    useEffect(() => {
        const role = localStorage.getItem('role') || '';
        setUserRole(role);
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            setUserAssignedId(userData.assignedId || userData.storeId || userData.warehouseId || '');
        } catch (e) {}

        if (params.id) {
            const cached = sessionStorage.getItem(`transfer_${params.id}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setData(parsed);
                    setNotes(parsed.notes || '');
                    setLoading(false);
                } catch (e) {}
            }
            fetchDetail();
        }
    }, [params.id]);

    const fetchDetail = async () => {
        try {
            if (!data) setLoading(true);
            const response = await callApi(`/management/admin/inventory-transfer/${params.id}`, 'GET');
            if (response?.data) {
                setData(response.data);
                setNotes(response.data.notes || '');
                const initialReceived: any = {};
                response.data.items?.forEach((item: any) => {
                    initialReceived[item.product_id] = item.received_quantity || item.sent_quantity || item.quantity;
                });
                setReceivedQuantities(initialReceived);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            setSubmitting(true);
            const payload: any = { status: newStatus };
            
            if (newStatus === 'IN_TRANSIT') {
                payload.items = items.map(item => ({
                    product_id: item.product_id,
                    quantity: Number(sentQuantities[item.product_id] !== undefined ? sentQuantities[item.product_id] : (item.sent_quantity || item.quantity))
                }));
            } else if (newStatus === 'RECEIVED') {
                const receivedItems = items.map(item => ({
                    product_id: item.product_id,
                    received_quantity: Number(receivedQuantities[item.product_id] !== undefined ? receivedQuantities[item.product_id] : (item.sent_quantity || item.quantity)),
                    sent_quantity: Number(item.sent_quantity || item.quantity)
                }));

                // 🛡️ VALIDATION: If any item is less than sent, notes is REQUIRED
                const hasShortage = receivedItems.some(i => i.received_quantity < i.sent_quantity);
                if (hasShortage && (!notes || notes.trim().length < 5)) {
                    showToast('Shortage detected! Please provide a reason in Discrepancy Notes.', 'error');
                    setSubmitting(false);
                    return;
                }

                payload.received_items = receivedItems;
                payload.notes = notes;
            }

            const response = await callApi(`/management/admin/inventory-transfer/${params.id}/status`, 'PATCH', payload);
            if (response?.status === 'success') {
                setData(response.data);
                fetchDetail();
                showToast(`Transfer updated to ${newStatus.replace('_', ' ')}`, 'success');
            }
        } catch (error: any) {
            showToast(error.message || 'Update failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-12 h-12"></span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="panel flex flex-col items-center justify-center p-20 text-center">
                <h2 className="text-2xl font-bold mb-4 italic uppercase text-gray-300 tracking-tighter">Transaction Not Found</h2>
                <button onClick={() => router.back()} className="btn btn-primary">Go Back</button>
            </div>
        );
    }

    const refId = `#TR-${data.id.slice(-6).toUpperCase()}`;
    const currentRole = userRole.toLowerCase();
    const isStoreManager = currentRole.includes('store_manager');
    const isWarehouseManager = currentRole.includes('warehouse_manager') || currentRole.includes('admin');
    const isDestinationStore = String(userAssignedId) === String(data.destination_store_id);
    const isSourceWarehouse = String(userAssignedId) === String(data.source_warehouse_id) || currentRole.includes('admin');

    const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="btn btn-outline-primary p-2.5 rounded-full border-gray-200 text-gray-400">
                        <IconArrowBackward className="w-5 h-5" />
                    </button>
                    <div>
                        <h5 className="text-xl font-black uppercase tracking-tight text-black">Transfer Review</h5>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">{refId}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                data.status === 'COMPLETED' ? 'bg-success text-white' : 
                                data.status === 'PENDING' ? 'bg-warning text-white' :
                                'bg-info text-white'
                            }`}>
                                {data.status}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {data.status === 'PENDING' && isSourceWarehouse && (
                        <button disabled={submitting} onClick={() => handleUpdateStatus('IN_TRANSIT')} className="btn btn-primary shadow-lg shadow-primary/20 uppercase font-black text-xs px-6">Dispatch Now</button>
                    )}
                    {data.status === 'RECEIVED' && (['admin', 'super_admin'].includes(userRole)) && (
                        <button disabled={submitting} onClick={() => handleUpdateStatus('COMPLETED')} className="btn btn-success shadow-lg shadow-success/20 uppercase font-black text-xs px-6">Approve Final stock</button>
                    )}
                    {data.status === 'IN_TRANSIT' && (isStoreManager || currentRole.includes('admin')) && (
                        <button disabled={submitting} onClick={() => handleUpdateStatus('RECEIVED')} className="btn btn-warning shadow-lg shadow-warning/20 uppercase font-black text-xs px-6">Submit Verification</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="panel p-0 overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
                        <div className="px-6 py-4 border-b border-gray-50 bg-white">
                            <h6 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Item Fulfillment Checklist</h6>
                        </div>
                        <div className="table-responsive">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-y border-gray-100/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Details</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">WH Stock</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Requested</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Sent</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">Received</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {paginatedItems.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded border border-gray-100 bg-white flex items-center justify-center p-1 shrink-0">
                                                        <img src={item.product_image || item.product?.thumbnail} className="max-w-full max-h-full object-contain" alt="" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-black text-black text-[12px] leading-none truncate">{item.product_name || item.product?.name}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {item.product_id?.slice(-8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${item.warehouse_stock < item.requested_quantity ? 'bg-danger/10 text-danger animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                                                    {item.warehouse_stock || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-black text-gray-400 text-xs">{item.requested_quantity || item.quantity}</td>
                                            <td className="px-4 py-4 text-center">
                                                {data.status === 'PENDING' && isWarehouseManager && isSourceWarehouse ? (
                                                    <input 
                                                        type="string"
                                                        className="form-input w-16 h-8 text-center font-black text-xs p-0 border-gray-200 rounded-md bg-white"
                                                        value={sentQuantities[item.product_id] !== undefined ? sentQuantities[item.product_id] : (item.sent_quantity || item.quantity)}
                                                        onChange={(e) => setSentQuantities({...sentQuantities, [item.product_id]: e.target.value})}
                                                    />
                                                ) : (
                                                    <span className={`text-[13px] font-black ${item.sent_quantity < (item.requested_quantity || item.quantity) ? 'text-warning' : 'text-gray-900'}`}>{item.sent_quantity || item.quantity}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {(data.status === 'IN_TRANSIT' && (isStoreManager || currentRole.includes('admin'))) ? (
                                                    <input 
                                                        type="string"
                                                        className="form-input w-16 h-8 text-center font-black text-xs p-0 border-primary/20 rounded-md bg-primary/5 text-primary"
                                                        value={receivedQuantities[item.product_id] !== undefined ? receivedQuantities[item.product_id] : (item.sent_quantity || item.quantity)}
                                                        onChange={(e) => setReceivedQuantities({...receivedQuantities, [item.product_id]: e.target.value})}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[13px] font-black ${item.received_quantity < (item.sent_quantity || item.quantity) ? 'text-danger' : 'text-success'}`}>
                                                            {item.received_quantity ?? '---'}
                                                        </span>
                                                        {(data.status === 'COMPLETED' || item.received_quantity !== undefined) && item.received_quantity < (item.sent_quantity || item.quantity) && (
                                                            <span className="text-[7px] font-black text-danger uppercase tracking-tighter">Shortage</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {items.length > pageSize && (
                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="text-[10px] font-black uppercase text-primary disabled:opacity-30">Prev</button>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage} of {Math.ceil(items.length / pageSize)}</span>
                                <button disabled={currentPage === Math.ceil(items.length / pageSize)} onClick={() => setCurrentPage(prev => prev + 1)} className="text-[10px] font-black uppercase text-primary disabled:opacity-30">Next</button>
                            </div>
                        )}
                    </div>

                    <div className="panel border-none shadow-sm ring-1 ring-gray-100">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Discrepancy Notes</h6>
                        {data.status === 'IN_TRANSIT' && isStoreManager ? (
                            <textarea className="form-textarea text-xs font-bold p-4 bg-gray-50 border-none rounded-xl" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type any items missing or damaged during transit..." />
                        ) : (
                            <div className="text-xs font-bold text-gray-500 italic p-4 bg-gray-50/50 rounded-xl">{data.notes || 'No remarks provided.'}</div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel border-none shadow-sm ring-1 ring-gray-100 bg-primary/5">
                        <h6 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Logistics Lane</h6>
                        <div className="space-y-6 px-2">
                            <div className="relative pl-6 border-l-2 border-primary/20">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Source</div>
                                <div className="text-[13px] font-black text-black uppercase mt-1 truncate">{data.source_warehouse?.name}</div>
                            </div>
                            <div className="relative pl-6 border-l-2 border-primary/20 pb-4">
                                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destination</div>
                                <div className="text-[13px] font-black text-black uppercase mt-1 truncate">{data.destination_store?.name}</div>
                            </div>
                        </div>
                        <div className="mt-10 pt-6 border-t border-primary/10 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Drafted</div>
                                <div className="text-[11px] font-black text-black mt-1">{moment(data.createdAt).format('DD/MM/YY')}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Handler</div>
                                <div className="text-[11px] font-black text-primary mt-1 uppercase truncate">{data.created_by?.name || 'Admin'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                            Verification completes the audit trail. Once approved by Admin, target store stock is updated.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryTransferDetail;
