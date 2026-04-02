'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconUser from '@/components/icon/icon-user';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconMapPin from '@/components/icon/icon-map-pin';

// Sub-component for a Paginated Order Table
const OrderHistoryTable = ({ orders }: { orders: any[] }) => {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-white dark:bg-black rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm animate__animated animate__fadeIn">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-900 bg-gray-50/20">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 italic">Financial Activity Log</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-black/40 border-b border-gray-50 dark:border-gray-900">
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 border-none">Store Name</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 border-none">Date</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 border-none text-right">Value</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 border-none text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                        {currentOrders.length > 0 ? currentOrders.map((order: any, idx: number) => (
                            <tr 
                                key={idx} 
                                className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/orders/preview/${order.id}`)}
                            >
                                <td className="px-6 py-5">
                                    <p className="font-black uppercase tracking-tight text-[12px] group-hover:text-primary transition-colors">{order.store?.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.store?.city}</p>
                                </td>
                                <td className="px-6 py-5 font-bold text-gray-500 whitespace-nowrap text-[12px] italic">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5 text-right font-black text-sm tracking-tighter">₹{order.totalAmount}</td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border
                                        ${order.status === 'delivered' ? 'bg-success/5 border-success/10 text-success' :
                                            order.status === 'cancelled' ? 'bg-danger/5 border-danger/20 text-danger' :
                                                'bg-warning/5 border-warning/20 text-warning'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-[11px]">No activity history found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50/10 border-t border-gray-50 dark:border-gray-900 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Page {currentPage} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-[10px] font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                        >
                            Prev
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white rounded-lg text-[10px] font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomerDetail = () => {
    const params = useParams();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const response = await callApi(`/management/admin/users/${params.id}/details`, 'GET');
                if (response && response.data) {
                    setUserData(response.data);
                } else {
                    console.error('Failed to fetch user details');
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchUserData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold">User Not Found</h2>
                <button onClick={() => router.back()} className="btn btn-primary mt-4">Go Back</button>
            </div>
        );
    }

    const customer = userData.user;
    const addresses = userData.addresses || [];
    const orders = userData.orders || [];
    const stats = userData.stats || { totalOrders: 0, totalSpend: "0.00" };

    return (
        <div className="animate__animated animate__fadeIn p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white dark:bg-black rounded-xl shadow-sm hover:bg-gray-50 transition-all border border-gray-100 dark:border-gray-800"
                    >
                        <IconArrowBackward className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight italic">Customer Details</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {params.id}</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${customer.isBanned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {customer.isBanned ? 'Banned' : 'Account Active'}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                    { id: 'overview', label: 'Overview', icon: <IconUser className="h-4 w-4" /> },
                    { id: 'orders', label: 'Order History', icon: <IconShoppingBag className="h-4 w-4" /> },
                    { id: 'addresses', label: 'Addresses', icon: <IconMapPin className="h-4 w-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all duration-200 border-2
                            ${activeTab === tab.id
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm'
                                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 dark:bg-black dark:border-gray-800'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate__animated animate__fadeInUp animate__faster text-black">
                        {/* Summary Card */}
                        <div className="bg-white dark:bg-black p-6 rounded-xl border-2 border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                            <IconShoppingBag className="absolute -right-4 -bottom-4 h-32 w-32 text-gray-100 dark:text-gray-900 group-hover:scale-105 transition-transform duration-500" />
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total spend</p>
                                    <p className="text-4xl font-black tracking-tighter">₹{stats.totalSpend}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50 dark:border-gray-900">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Orders</p>
                                        <p className="text-xl font-black uppercase italic">{stats.totalOrders}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Joined Date</p>
                                        <p className="text-xl font-black uppercase italic">
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-black p-6 rounded-xl border-2 border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-50 dark:border-gray-900">
                                <div className="h-12 w-12 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
                                    <IconUser className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">{customer.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Registered User</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                                    <p className="text-[14px] font-black tracking-tight">{customer.phone}</p>
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                    <p className="text-[14px] font-black tracking-tight truncate">{customer.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6 animate__animated animate__fadeInUp animate__faster text-black">
                        {/* Store Wise Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(userData.storeWiseAnalysis || []).map((store: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-black p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                                    <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-black">{store.storeName?.charAt(0)}</div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Store Participation</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-black uppercase tracking-tight truncate max-w-[120px]">{store.storeName}</p>
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-[9px] font-black italic">{store.orderCount} Orders</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order History Table with Pagination */}
                        <OrderHistoryTable orders={orders} />
                    </div>
                )}

                {activeTab === 'addresses' && (
                    <div className="animate__animated animate__fadeInUp animate__faster text-black">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {addresses.length > 0 ? addresses.map((addr: any, idx: number) => (
                                <div key={idx} className="bg-white dark:bg-black p-5 rounded-xl border-2 border-gray-50 dark:border-gray-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase rounded dark:bg-white dark:text-black">{addr.type}</span>
                                        {addr.isActive && <span className="text-[9px] font-black text-success uppercase italic tracking-widest">Active Hub</span>}
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-700 dark:text-gray-400 leading-relaxed mb-4 min-h-[40px]">
                                        {addr.formattedAddress}
                                    </p>
                                    <div className="pt-4 border-t border-gray-50 dark:border-gray-900 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Recipient</p>
                                            <p className="text-[11px] font-black tracking-tight">{addr.userName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Phone Link</p>
                                            <p className="text-[11px] font-black tracking-tight">{addr.userMobile}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No addresses found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;
