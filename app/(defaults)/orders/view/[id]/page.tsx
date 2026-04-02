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

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                const stored = localStorage.getItem(`view_order_${params.id}`);
                if (stored) {
                    setOrder(JSON.parse(stored));
                    setLoading(false);
                    return;
                }
                const response = await callApi(`/management/admin/orders?limit=100`, 'GET');
                if (response && response.orders) {
                    const found = response.orders.find((o: any) => (o.id || o._id) === params.id);
                    if (found) setOrder(found);
                    else router.push('/orders/list');
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
    const items = order.items || order.products || order.orderItems || [];

    // 🏷️ Group items by Category
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

    return (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white border border-gray-100 shadow-sm text-black font-sans rounded-none">
            {/* 1. Header with Status & ID */}
            <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="hover:opacity-60">
                        <IconArrowBackward className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Order #{order.order_id || params.id}</h1>
                        <p className="text-[12px] font-bold text-gray-400 uppercase">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 border-2 border-black text-[12px] font-black uppercase">
                        {order.status?.replace('_', ' ')}
                    </div>
                </div>
            </div>

            {/* 2. Top Info Grid: Customer, Address, Rider */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-8 border-b border-gray-100">
                <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Customer</h4>
                    <p className="text-[14px] font-black uppercase">{order.customerName || order.user?.name || 'Guest User'}</p>
                    <p className="text-[12px] font-bold text-gray-500 mt-1">{order.customerPhone || order.user?.phone || 'N/A'}</p>
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
                            <p className="text-[14px] font-black uppercase">{typeof order.rider === 'object' ? order.rider.name : order.rider}</p>
                            <span className="text-[10px] font-black text-success uppercase">Rider Assigned</span>
                        </div>
                    ) : <p className="text-[14px] font-bold text-gray-300 italic">Not Assigned</p>}
                </div>
            </div>

            {/* 3. Items Table */}
            <div className="mb-10">
                <h4 className="text-[11px] font-black text-gray-400 uppercase mb-6 tracking-widest">Order Items</h4>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 italic">
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase">Item</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-center">Qty</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-right">Price</th>
                            <th className="py-3 text-[12px] font-black text-gray-400 uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {Object.entries(groupedItems).map(([catName, groupItems]) => (
                            <React.Fragment key={catName}>
                                <tr className="bg-gray-50/50">
                                    <td colSpan={4} className="py-2 px-4 text-[11px] font-black uppercase text-primary tracking-widest border-l-4 border-primary">
                                        {catName}
                                    </td>
                                </tr>
                                {groupItems.map((item: any, idx: number) => {
                                    const name = item.product_name || item.Product_name || item.item_name || item.productName || item.name || item.product?.name || item.item?.name || 'Product';
                                    const price = Number(item.unit_amount || item.price || 0);
                                    const qty = Number(item.quantity || 1);
                                    return (
                                        <tr key={idx} className="group">
                                            <td className="py-5 pl-4">
                                                <p className="text-[14px] font-black uppercase tracking-tight">{name}</p>
                                            </td>
                                            <td className="py-5 text-center text-[14px] font-bold">x{qty}</td>
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
                    <div className="pt-6 border-t-2 border-black flex justify-between items-end">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Total Amount</p>
                            <p className="text-4xl font-black tracking-tighter mt-1">₹{calc.total || order.totalAmount || 0}</p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-black text-[10px] font-black uppercase">{order.paymentMethod || 'COD'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
