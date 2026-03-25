'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconPrinter from '@/components/icon/icon-printer';

const InventoryTransferDetail = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const queryData = searchParams.get('data');
        if (queryData) {
            try {
                const parsed = JSON.parse(decodeURIComponent(queryData));
                setData(parsed);
                setLoading(false);
                return;
            } catch (e) {
                console.error('Error parsing param data:', e);
            }
        }
        
        if (params.id) {
            fetchDetail();
        }
    }, [params.id, searchParams]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const response = await callApi(`/management/admin/inventory-transfers/${params.id}`, 'GET');
            if (response?.data) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoading(false);
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
                <h2 className="text-2xl font-bold mb-4">Stock Transaction Not Found</h2>
                <button onClick={() => router.back()} className="btn btn-primary">Go Back</button>
            </div>
        );
    }

    const items = Array.isArray(data.items) ? data.items : (typeof data.items === 'string' ? JSON.parse(data.items) : []);
    const refId = data.status === 'PENDING' ? `#REQ-${data.id.slice(-6).toUpperCase()}` : `#TR-${data.id.slice(-6).toUpperCase()}`;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn btn-outline-primary p-2 rounded-full">
                        <IconArrowBackward className="w-5 h-5" />
                    </button>
                    <div>
                        <h5 className="text-xl font-black uppercase tracking-tight">Stock {data.status === 'PENDING' ? 'Request' : 'Transfer'} Details</h5>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{refId}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side: Summary & Items */}
                <div className="md:col-span-2 space-y-6">
                    <div className="panel">
                        <div className="flex items-center justify-between mb-5 border-b pb-3">
                            <h6 className="text-base font-bold uppercase tracking-tight">Transfer Items List</h6>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                data.status === 'COMPLETED' ? 'bg-success/10 text-success border-success/20' : 
                                data.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-danger/10 text-danger border-danger/20'
                            }`}>
                                {data.status}
                            </span>
                        </div>
                        <div className="table-responsive">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-[11px] font-black uppercase text-gray-400">#</th>
                                        <th className="px-4 py-2 text-left text-[11px] font-black uppercase text-gray-400">Product</th>
                                        <th className="px-4 py-2 text-right text-[11px] font-black uppercase text-gray-400">Qty</th>
                                        <th className="px-4 py-2 text-right text-[11px] font-black uppercase text-gray-400">Stock After</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: any, index: number) => (
                                        <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-4 text-xs font-bold text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden shrink-0 shadow-sm animate__animated animate__fadeIn">
                                                        <img src={item.product?.image || item.product_image || '/assets/images/profile-1.jpeg'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-black dark:text-white leading-tight">{item.product?.name || item.product_name || 'Unknown Product'}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                            Barcode: {item.product?.barcode || item.product?.utc_id || '---'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-base font-black text-primary">{item.quantity}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {item.new_stock !== undefined ? item.new_stock : '---'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side: Transaction Info */}
                <div className="space-y-6">
                    <div className="panel">
                        <h6 className="text-base font-bold mb-5 border-b pb-3 uppercase tracking-tight">Transaction Info</h6>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">From Location</label>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800">
                                    <div className="text-sm font-black text-black dark:text-white">{data.source_warehouse?.name || 'Central Warehouse'}</div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-1">{data.source_warehouse?.location || 'Main Storage Facility'}</div>
                                </div>
                            </div>
                            <div className="flex justify-center py-2 animate-bounce">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">To Location</label>
                                <div className="p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800">
                                    <div className="text-sm font-black text-black dark:text-white">{data.destination_store?.name || 'Store Terminal'}</div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-1">{data.destination_store?.location || 'Retail Point'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-dashed border-gray-200 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Date & Time</span>
                                <span className="text-xs font-black text-black dark:text-white">{new Date(data.createdAt || data.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Processed By</span>
                                <span className="text-xs font-black text-black dark:text-white">{data.processed_by?.name || 'System Admin'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="panel bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
                            </div>
                            <div>
                                <h6 className="text-[12px] font-black text-primary uppercase">Stock Note</h6>
                                <p className="text-[11px] font-bold text-primary/70">{data.notes || 'No adjustment notes provided for this transaction.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryTransferDetail;
