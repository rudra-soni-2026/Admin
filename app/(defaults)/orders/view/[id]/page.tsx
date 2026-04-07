'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import IconPrinter from '@/components/icon/icon-printer';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import Swal from 'sweetalert2';

const OrderDetail = () => {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [perms, setPerms] = useState<any>(null);
    
    // ✏️ Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                const stored = localStorage.getItem(`view_order_${params.id}`);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setOrder(parsed);
                        setLoading(false);
                        return;
                    } catch (e) { console.error("Parse Error", e); }
                }

                const response = await callApi('/management/admin/orders?limit=100', 'GET');
                if (response && response.orders) {
                    const found = response.orders.find((o: any) => (o.id || o._id || o.originalId) === params.id);
                    if (found) {
                        setOrder(found);
                        localStorage.setItem(`view_order_${params.id}`, JSON.stringify(found));
                    } else {
                        router.push('/orders/list');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetchOrderDetail();
    }, [params.id, router]);

    if (loading || !order) {
        return <div className="p-10 text-center animate-pulse">Loading...</div>;
    }

    const calc = typeof order.calculation_details === 'string' ? JSON.parse(order.calculation_details) : (order.calculation_details || {});
    const addr = typeof order.order_address === 'string' ? JSON.parse(order.order_address) : (order.order_address || order.address || {});
    const items = isEditing ? editItems : (order.items || order.products || order.orderItems || order.OrderItems || []);

    const groupedItems: { [key: string]: any[] } = items.reduce((acc: any, item: any) => {
        const cat = item.categoryName || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});
    
    const addressLine1 = [order.house_no || order.address_line_1 || addr.house_no || addr.address_line_1 || addr.streetNumber].filter(Boolean).join(' ');
    const addressLine2 = [order.street || order.address_line_2 || addr.street || addr.address_line_2 || addr.streetName || addr.subLocality].filter(Boolean).join(' ');
    const cityArea = [addr.city || addr.locality, addr.state || addr.adminArea, addr.pincode || addr.postalCode].filter(Boolean).join(', ');
    const fullAddress = [addressLine1, addressLine2, cityArea].filter(Boolean).join(', ');

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin' && uRole !== 'store_manager' && uRole !== 'warehouse_manager') return true;
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    // 🛠️ Action Handlers
    const startEditing = () => {
        const initialItems = (order.items || order.products || order.orderItems || order.OrderItems || []).map((it: any) => ({
            ...it,
            productId: it.productId || it.product_id || it.product?.id,
            productName: it.product_name || it.productName || it.name || it.product?.name,
            unit_amount: it.unit_amount || it.price || it.selling_price || 0
        }));
        setEditItems(initialItems);
        setIsEditing(true);
    };

    const updateQty = (idx: number, delta: number) => {
        const newItems = [...editItems];
        if (newItems[idx].quantity + delta >= 1) {
            newItems[idx].quantity += delta;
            setEditItems(newItems);
        }
    };

    const removeItem = (idx: number) => {
        if (editItems.length <= 1) {
            Swal.fire('Error', 'Cannot remove last item. Please cancel the order if needed.', 'warning');
            return;
        }
        setEditItems(editItems.filter((_, i) => i !== idx));
    };

    const saveChanges = async () => {
        try {
            setIsSaving(true);
            const payload = {
                orderId: order.id || order._id || order.originalId,
                items: editItems.map((it: any) => ({ productId: it.productId, quantity: it.quantity }))
            };
            const response = await callApi('/management/store-manager/order/edit-items', 'PATCH', payload);
            if (response.status === 'success') {
                setOrder(response.data);
                setIsEditing(false);
                Swal.fire({ icon: 'success', title: 'Order Updated!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white dark:bg-[#1b2e4b] border border-gray-100 dark:border-none shadow-sm text-black dark:text-white-light font-sans rounded-none relative">
            {isEditing && (
                <div className="absolute top-0 left-0 w-full h-1 bg-warning animate-pulse"></div>
            )}

            {/* 1. Header with Status & ID */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white/10 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => isEditing ? setIsEditing(false) : router.back()} className="hover:opacity-60 text-black dark:text-white">
                        <IconArrowBackward className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white line-clamp-1">
                            {isEditing ? 'Editing Order Items' : `Order #${order.order_id || params.id.toString().substring(0, 8).toUpperCase()}`}
                        </h1>
                        <p className="text-[12px] font-bold text-gray-400 uppercase">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-1.5 bg-gray-100 text-black text-[12px] font-black uppercase hover:bg-gray-200 transition-all ml-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={isSaving}
                                className="px-6 py-1.5 bg-primary text-white text-[12px] font-black uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            {!['delivered', 'cancelled'].includes(order.status) && hasPerm('orders', 'update') && (
                                <button
                                    onClick={startEditing}
                                    className="px-4 py-1.5 bg-warning text-white text-[12px] font-black uppercase hover:opacity-80 transition-all flex items-center gap-2"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Edit Order
                                </button>
                            )}
                            {order.user_invoice_url && (
                                <a 
                                    href={order.user_invoice_url} 
                                    target="_blank" 
                                    className="px-4 py-1.5 bg-black dark:bg-white dark:text-black text-white text-[12px] font-black uppercase hover:opacity-80 transition-all flex items-center gap-2"
                                >
                                    <IconPrinter className="h-4 w-4" />
                                    Invoice
                                </a>
                            )}
                            <div className="px-4 py-1.5 border-2 border-black dark:border-white/40 text-[12px] font-black uppercase">
                                {order.status?.replace('_', ' ')}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 2. Top Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-8 border-b border-gray-100 dark:border-white/5">
                <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Customer</h4>
                    <p className="text-[14px] font-black uppercase">{order.customerName || order.user?.name || 'Guest User'}</p>
                    <p className="text-[12px] font-bold text-gray-500 mt-1">{order.customerPhone || order.user?.phone || '9155244224'}</p>
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Delivery Address</h4>
                    <p className="text-[13px] font-bold leading-relaxed">
                        {order.formatted_address || addr.formattedAddress || fullAddress || 'Address Not Provided'}
                        {addr.landmark && <><br /><span className="text-primary font-black uppercase text-[11px]">Landmark: {addr.landmark}</span></>}
                    </p>
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Delivery Partner</h4>
                    {order.rider && order.rider !== '-' ? (
                        <div>
                            <p className="text-[14px] font-black uppercase">
                                {typeof order.rider === 'object' ? (order.rider.user?.name || order.rider.name || 'Rider') : order.rider}
                            </p>
                            {order.rider.user?.phone && <p className="text-[11px] font-bold text-gray-500">{order.rider.user.phone}</p>}
                            <span className="text-[10px] font-black text-success uppercase">Rider Assigned</span>
                        </div>
                    ) : <p className="text-[14px] font-bold text-gray-300 italic">Not Assigned</p>}
                </div>
            </div>

            {/* 3. Items Table */}
            <div className="mb-10">
                <h4 className="text-[11px] font-black text-gray-400 uppercase mb-6 tracking-widest">
                    {isEditing ? 'Edit Products & Quantities' : 'Order Items'}
                </h4>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5 italic">
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase">Item</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-center w-[120px]">Qty</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-right">Price</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-right pr-4">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {Object.entries(groupedItems).map(([catName, groupItems]) => (
                            <React.Fragment key={catName}>
                                <tr className="bg-gray-50/50 dark:bg-white/5">
                                    <td colSpan={4} className="py-2 px-4 text-[11px] font-black uppercase text-primary tracking-widest border-l-4 border-primary">
                                        {catName}
                                    </td>
                                </tr>
                                {groupItems.map((item: any, idx: number) => {
                                    const realIdx = items.indexOf(item);
                                    const name = item.productName || item.product_name || 'Product';
                                    const price = Number(item.unit_amount || 0);
                                    const qty = Number(item.quantity || 1);
                                    return (
                                        <tr key={realIdx} className={`group ${isEditing ? 'bg-warning/5 animate-fade-in' : ''}`}>
                                            <td className="py-5 pl-4 relative">
                                                <p className="text-[14px] font-black uppercase tracking-tight">{name}</p>
                                                {isEditing && (
                                                    <button 
                                                        onClick={() => removeItem(realIdx)}
                                                        className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-danger hover:bg-danger/5 rounded-full transition-all"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-5 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm h-10 w-[100px] mx-auto overflow-hidden">
                                                        <button 
                                                            onClick={() => updateQty(realIdx, -1)}
                                                            className="w-10 h-full flex items-center justify-center hover:bg-danger/5 text-gray-400 hover:text-danger transition-all border-r border-gray-100 dark:border-white/5"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="flex-1 text-[13px] font-black text-black dark:text-white">{qty}</span>
                                                        <button 
                                                            onClick={() => updateQty(realIdx, 1)}
                                                            className="w-10 h-full flex items-center justify-center hover:bg-success/5 text-gray-400 hover:text-success transition-all border-l border-gray-100 dark:border-white/5"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[14px] font-bold">x{qty}</span>
                                                )}
                                            </td>
                                            <td className="py-5 text-right text-[14px] font-bold text-gray-500">₹{price}</td>
                                            <td className="py-5 text-right text-[15px] font-black tracking-tighter pr-4">₹{(price * qty).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. Total Summary */}
            {!isEditing && (
                <div className="flex justify-end">
                    <div className="w-full max-w-[280px] space-y-4">
                        <div className="flex justify-between text-[13px] font-bold text-gray-500 uppercase">
                            <span>Subtotal</span>
                            <span>₹{calc.subtotal || order.subTotal || 0}</span>
                        </div>
                        <div className="flex justify-between text-[13px] font-bold text-success uppercase">
                            <span>Delivery</span>
                            <span>+₹{calc.delivery_fee || 0}</span>
                        </div>
                        {calc.handling_fee > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-success uppercase">
                            <span>Handling Fee</span>
                            <span>+₹{calc.handling_fee}</span>
                        </div>
                    )}
                    {calc.small_cart_fee > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-success uppercase">
                            <span>Small Cart Fee</span>
                            <span>+₹{calc.small_cart_fee}</span>
                        </div>
                    )}
                    {calc.platform_fee > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-success uppercase">
                            <span>Platform Fee</span>
                            <span>+₹{calc.platform_fee}</span>
                        </div>
                    )}
                    {calc.discount > 0 && (
                        <div className="flex justify-between text-[13px] font-bold text-danger uppercase">
                            <span>Discount</span>
                            <span>-₹{calc.discount}</span>
                        </div>
                    )}
                    <div className="pt-6 border-t-2 border-black dark:border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Total Amount</p>
                            <p className="text-4xl font-black tracking-tighter mt-1">₹{calc.total || order.totalAmount || 0}</p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-black dark:text-white text-[10px] font-black uppercase">{order.paymentMethod || 'COD'}</span>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default OrderDetail;
