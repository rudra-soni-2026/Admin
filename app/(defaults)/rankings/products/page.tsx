'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import { ReactSortable } from 'react-sortablejs';
import Swal from 'sweetalert2';
import IconSave from '@/components/icon/icon-save';
import IconSearch from '@/components/icon/icon-search';

const ProductRanking = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingCats, setLoadingCats] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        fetchCategories('');
    }, []);

    // Search effect for categories
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchCategories(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchCategories = async (query: string) => {
        try {
            setLoadingCats(true);
            const response = await callApi(`/management/admin/all-level-two-categories?search=${encodeURIComponent(query)}`, 'GET');
            if (response && response.data) setCategories(response.data);
            else setCategories([]);
        } catch (error) { setCategories([]); } finally { setLoadingCats(false); }
    };

    const fetchProducts = async (catId: string) => {
        try {
            setLoading(true);
            const response = await callApi(`/products/categorys/${catId}?limit=500`, 'GET');
            if (response && response.data) {
                setProducts(response.data.map((p: any) => ({ ...p, id: p._id || p.id })));
            } else { setProducts([]); }
        } catch (error) { setProducts([]); } finally { setLoading(false); }
    };

    const handleSelectCategory = (id: string) => {
        setSelectedCategoryId(id);
        fetchProducts(id);
    };

    const handleSaveOrder = async () => {
        if (!selectedCategoryId || products.length === 0) return;
        try {
            setSaving(true);
            const orders = products.map((p, index) => ({ id: p._id || p.id, order: index + 1 }));
            await callApi('/management/admin/productss/bulk-order', 'PATCH', { orders, categoryId: selectedCategoryId });
            Swal.fire({ icon: 'success', title: 'Ranking Saved', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Failed to Save', text: error.message });
        } finally { setSaving(false); }
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

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-xs font-black uppercase tracking-widest">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
                <li className="text-gray-400 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Product Ranking</span></li>
            </ul>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-200px)] min-h-[600px]">

                {/* 1. DIRECT SEARCHABLE CATEGORY LIST */}
                <div className="lg:col-span-4 xl:col-span-3 panel shadow-sm border-none p-0 overflow-hidden flex flex-col rounded-xl">
                    <div className="p-3 border-b bg-gray-50/50 dark:bg-black/20">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Categories..."
                                className="form-input rounded-lg text-[11px] pl-10 font-black uppercase py-2.5 border-none bg-white dark:bg-gray-800 shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <IconSearch className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-gray-50/10">
                        {loadingCats ? (
                            <div className="p-10 text-center"><span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-6 h-6 inline-block"></span></div>
                        ) : categories.length === 0 ? (
                            <div className="p-10 text-center grayscale opacity-30 flex flex-col items-center">
                                <IconSearch className="w-10 h-10 mb-2" />
                                <p className="text-[10px] uppercase font-black tracking-widest leading-none text-gray-400">Not Found</p>
                            </div>
                        ) : (
                            categories.map(cat => (
                                <div
                                    key={cat._id}
                                    onClick={() => handleSelectCategory(cat._id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedCategoryId === cat._id ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white z-10' : 'hover:bg-gray-100 hover:border-gray-200 border-transparent text-gray-700'}`}
                                >
                                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/20 bg-white p-0.5 shadow-sm">
                                        <img src={cat.image || '/assets/images/profile-12.jpeg'} className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-tight truncate leading-tight">{cat.name}</p>
                                        <p className={`text-[8px] font-bold mt-1 ${selectedCategoryId === cat._id ? 'text-white/60' : 'text-gray-400'}`}>ID: {cat._id?.slice(-8)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. PRODUCT RANKING CANVAS */}
                <div className="lg:col-span-8 xl:col-span-9 panel shadow-sm border-none p-0 overflow-hidden flex flex-col rounded-xl">
                    <div className="p-3 border-b bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">Rank Products</span>
                            {selectedCategoryId && <span className="text-[9px] font-black uppercase text-primary mt-1">{categories.find(c => c._id === selectedCategoryId)?.name}</span>}
                        </div>
                        {selectedCategoryId && products.length > 0 && (
                            <button
                                onClick={handleSaveOrder}
                                disabled={saving || !hasPerm('products', 'update')}
                                className={`btn btn-primary btn-sm py-2 px-6 shadow-lg shadow-primary/20 rounded-lg text-[10px] font-black uppercase gap-2 transition-transform active:scale-95 ${!hasPerm('products', 'update') ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                            >
                                {saving ? <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-3.5 h-3.5"></span> : <IconSave className="w-3.5 h-3.5" />}
                                {saving ? 'Saving...' : 'Save Ranking'}
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/20">
                        {!selectedCategoryId ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 grayscale">
                                <IconSearch className="w-16 h-16 mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest">Select Category</p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10 mb-2"></span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Fetching Products...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="py-20 text-center grayscale opacity-30 text-[10px] font-black uppercase tracking-widest italic text-gray-400 whitespace-pre leading-none">Category is Empty</div>
                        ) : (
                            <ReactSortable list={products} setList={setProducts} animation={250} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {products.map((p, idx) => (
                                    <div key={p.id} className="flex flex-col p-3.5 bg-white dark:bg-black rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-grab hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all select-none group relative overflow-hidden">
                                        <div className="absolute top-2 right-2 w-7 h-7 bg-primary text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg z-10">
                                            {idx + 1}
                                        </div>
                                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-50 dark:border-gray-800 mb-3 bg-gray-50 shadow-inner p-2 group-hover:bg-white transition-colors">
                                            <img src={p.image || '/assets/images/profile-12.jpeg'} className="w-full h-full object-contain" alt="" />
                                        </div>
                                        <div className="px-1 text-center font-black uppercase truncate">
                                            <div className="text-[11px] text-black dark:text-white truncate mb-1 leading-tight">{p.name}</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-primary italic">₹{p.price || 0}</span>
                                                <span className="text-[8px] font-bold text-gray-300 tracking-tighter">ID: {p._id?.slice(-8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </ReactSortable>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductRanking;
