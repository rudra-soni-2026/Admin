'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconBox from '@/components/icon/icon-box';
import IconFile from '@/components/icon/icon-file';

const ViewPurchase = () => {
    const params = useParams();
    const router = useRouter();
    const purchaseId = params?.id;
    const [loading, setLoading] = useState(true);
    const [purchase, setPurchase] = useState<any>(null);

    useEffect(() => {
        if (purchaseId) {
            fetchPurchaseDetails();
        }
    }, [purchaseId]);

    const fetchPurchaseDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching Purchase Details for ID:', purchaseId);
            const response = await callApi(`/management/admin/purchases/${purchaseId}`, 'GET');
            
            if (response && (response.data || response.id || response._id)) {
                const data = response.data || response;
                if (typeof data.items === 'string') {
                    try {
                        data.items = JSON.parse(data.items);
                    } catch (e) {
                        data.items = [];
                    }
                }
                setPurchase(data);
            } else {
                throw new Error('API returned no data');
            }
        } catch (error) {
            console.error('Error fetching purchase details, checking cache:', error);
            // Fallback to localStorage if API fails
            const cachedData = localStorage.getItem(`view_purchase_${purchaseId}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                // Ensure we have minimal structure even if it's from list
                setPurchase({
                    ...parsed,
                    reference_no: parsed.reference_no || parsed.reference || 'N/A',
                    purchase_date: parsed.purchase_date || parsed.date || new Date().toISOString(),
                    tax_amount: Number(parsed.tax_amount || 0),
                    discount_amount: Number(parsed.discount_amount || 0),
                    shipping_amount: Number(parsed.shipping_amount || 0),
                    grand_total: Number(parsed.grand_total || parsed.total?.replace(/[^\d.]/g, '') || 0),
                    items: parsed.items || []
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10 align-middle"></span>
            </div>
        );
    }

    if (!purchase) {
        return (
            <div className="panel p-10 text-center">
                <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
                <Link href="/purchase/list" className="btn btn-primary mt-4 inline-block">Back to List</Link>
            </div>
        );
    }

    const calculateSubtotal = (price: number, qty: number) => price * qty;
    const items = purchase.items || [];

    const statusColors: Record<string, string> = {
        'Received': 'bg-success/10 text-success border-success/20',
        'Pending': 'bg-warning/10 text-warning border-warning/20',
        'Ordered': 'bg-info/10 text-info border-info/20',
    };

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse items-center">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/purchase/list" className="text-primary hover:underline">Purchase Management</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>View Purchase</span></li>
            </ul>

            <div className="panel flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h5 className="text-lg font-bold">Purchase Order: {purchase.reference_no}</h5>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[purchase.status] || 'bg-gray-100'}`}>
                        {purchase.status}
                    </span>
                </div>
                <Link href="/purchase/list" className="btn btn-outline-primary btn-sm uppercase font-bold">
                    <IconArrowBackward className="h-4 w-4 mr-2" /> Back
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel">
                        <h6 className="text-base font-bold mb-5 border-b pb-2 uppercase tracking-tight text-gray-400">Basic Info</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Date</label>
                                <p className="font-bold">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Reference No</label>
                                <p className="font-bold">{purchase.reference_no}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Location (Warehouse)</label>
                                <p className="font-bold">{purchase.warehouse?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400">Supplier</label>
                                <p className="font-bold text-primary">{purchase.supplier?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <h6 className="text-base font-bold mb-5 border-b pb-2 uppercase tracking-tight text-gray-400">Order Items</h6>
                        <div className="table-responsive">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-800 text-[10px] font-black uppercase text-gray-400 bg-gray-50/50 dark:bg-black/20">
                                        <th className="px-4 py-3 text-left w-12">#</th>
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-center w-24">Cost</th>
                                        <th className="px-4 py-3 text-center w-24">Sell</th>
                                        <th className="px-4 py-3 text-center w-20">Qty</th>
                                        <th className="px-4 py-3 text-right w-32">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: any, index: number) => (
                                        <tr key={index} className="border-b dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-black/10">
                                            <td className="px-4 py-4 text-xs font-bold text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-black flex items-center justify-center overflow-hidden border">
                                                        {item.product?.image ? (
                                                            <img src={item.product.image} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <IconBox className="w-5 h-5 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase">{item.product_name || item.product?.name || item.name || 'Item: ' + item.product_id?.slice(-6)}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">{item.product_barcode || item.product?.barcode || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center text-xs font-bold">₹{item.purchase_cost}</td>
                                            <td className="px-4 py-4 text-center text-xs font-bold">₹{item.selling_price}</td>
                                            <td className="px-4 py-4 text-center text-xs font-black">{item.quantity}</td>
                                            <td className="px-4 py-4 text-right text-sm font-black text-primary">₹{item.subtotal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="panel">
                        <h6 className="text-base font-bold mb-5 border-b pb-2 uppercase tracking-tight text-gray-400">Order Summary</h6>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Subtotal</span>
                                <span className="font-bold">₹{(purchase.grand_total - purchase.tax_amount - purchase.shipping_amount + purchase.discount_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Order Tax</span>
                                <span className="font-bold text-danger">+ ₹{purchase.tax_amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Discount</span>
                                <span className="font-bold text-success">- ₹{purchase.discount_amount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase">Shipping</span>
                                <span className="font-bold">+ ₹{purchase.shipping_amount}</span>
                            </div>
                            <div className="pt-4 border-t mt-4 flex flex-col items-end px-4 bg-primary/5 py-4 rounded-xl border border-primary/10">
                                <span className="text-[10px] font-black uppercase text-gray-400 mb-1">Grand Total</span>
                                <span className="text-3xl font-black text-primary">₹{Number(purchase.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {purchase.invoice_url && (
                        <div className="panel group">
                            <h6 className="text-base font-bold mb-4 border-b pb-2 uppercase tracking-tight text-gray-400">Attached Invoice</h6>
                            <a 
                                href={purchase.invoice_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-dashed hover:border-primary transition-all"
                            >
                                <div className="bg-white dark:bg-black p-2 rounded shadow-sm">
                                    <IconFile className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Click to view/download</p>
                                    <p className="text-xs font-bold truncate">Supplier Invoice File</p>
                                </div>
                            </a>
                        </div>
                    )}

                    <div className="panel">
                        <h6 className="text-base font-bold mb-3 uppercase tracking-tight text-gray-400">Notes</h6>
                        <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-lg border italic text-xs min-h-[100px]">
                            {purchase.notes || 'No notes added for this purchase.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchase;
