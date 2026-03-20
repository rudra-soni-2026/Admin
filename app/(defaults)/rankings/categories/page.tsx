'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import { ReactSortable } from 'react-sortablejs';
import Swal from 'sweetalert2';
import IconSave from '@/components/icon/icon-save';
import IconCaretDown from '@/components/icon/icon-caret-down';

const CategoryRanking = () => {
    const [roots, setRoots] = useState<any[]>([]);
    const [subs, setSubs] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    
    const [selectedRoot, setSelectedRoot] = useState<any>(null);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRoots();
    }, []);

    const fetchRoots = async () => {
        try {
            setLoading(true);
            const response = await callApi('/products/parent-categories?level=0&limit=100', 'GET');
            if (response && response.data) {
                setRoots(response.data.map((c: any) => ({ ...c, id: c._id })));
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchSubs = async (rootId: string) => {
        try {
            setSelectedSub(null);
            setItems([]);
            const response = await callApi(`management/admin/sub-categories/${rootId}`, 'GET');
            if (response?.data?.subCategories) {
                setSubs(response.data.subCategories.map((c: any) => ({ ...c, id: c._id })));
            } else { setSubs([]); }
        } catch (error) { setSubs([]); }
    };

    const fetchItems = async (subId: string) => {
        try {
            const response = await callApi(`management/admin/sub-categories/${subId}`, 'GET');
            if (response?.data?.subCategories) {
                setItems(response.data.subCategories.map((c: any) => ({ ...c, id: c._id })));
            } else { setItems([]); }
        } catch (error) { setItems([]); }
    };

    const handleSelectRoot = (item: any) => {
        setSelectedRoot(item);
        fetchSubs(item._id);
    };

    const handleSelectSub = (item: any) => {
        setSelectedSub(item);
        fetchItems(item._id);
    };

    const handleSaveRanking = async (list: any[], level: number, type: string) => {
        try {
            setSaving(true);
            // Updating indices based on the new order in the list
            const orders = list.map((item, index) => ({
                id: item._id,
                order: index + 1
            }));

            // Using the new bulk update endpoint
            const response = await callApi('/management/admin/categories/bulk-order', 'PATCH', { 
                orders,
                level
            });
            
            if (response) {
                Swal.fire({ icon: 'success', title: `${type} Ranking Saved`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Failed to Save', text: error.message });
        } finally { setSaving(false); }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-sm">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Rankings</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Category Ranking</span></li>
            </ul>

            {/* <div className="panel border-none shadow-sm mb-6 bg-gradient-to-r from-primary/5 to-transparent">
                <h5 className="text-xl font-black uppercase tracking-tight"> Ranking</h5>
                <p className="text-[10px] font-bold uppercase text-gray-400 mt-1 tracking-widest">Organize categories by dragging them locally within their groups</p>
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ROOT CATEGORIES */}
                <div className="panel shadow-sm border-none flex flex-col h-[600px] p-0 overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-black/20">
                        <span className="text-xs font-black uppercase tracking-widest">1. Roots</span>
                        <button onClick={() => handleSaveRanking(roots, 0, 'Root')} className="btn btn-primary btn-sm py-1 px-3 text-[10px] font-bold uppercase gap-1">
                            <IconSave className="w-3 h-3" /> Save Roots
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading && roots.length === 0 ? <div className="p-4 text-center text-xs animate-pulse">Loading Roots...</div> : (
                            <ReactSortable list={roots} setList={setRoots} animation={200} className="space-y-2">
                                {roots.map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelectRoot(item)}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all cursor-pointer group ${selectedRoot?._id === item._id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black uppercase tracking-tight truncate ${selectedRoot?._id === item._id ? 'text-primary' : 'text-gray-700'}`}>{item.name}</p>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </ReactSortable>
                        )}
                    </div>
                </div>

                {/* SUB CATEGORIES */}
                <div className="panel shadow-sm border-none flex flex-col h-[600px] p-0 overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-black/20">
                        <span className="text-xs font-black uppercase tracking-widest">2. Sub Categories</span>
                        {selectedRoot && subs.length > 0 && (
                            <button onClick={() => handleSaveRanking(subs, 1, 'Sub')} className="btn btn-info btn-sm py-1 px-3 text-[10px] font-bold uppercase gap-1">
                                <IconSave className="w-3 h-3" /> Save Subs
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {!selectedRoot ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                                <IconCaretDown className="w-8 h-8 rotate-90 mb-2 opacity-20" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">Select a Root to see its Sub-categories</p>
                            </div>
                        ) : subs.length === 0 ? (
                            <div className="p-4 text-center text-[11px] text-gray-400 italic">No subcategories found for this root.</div>
                        ) : (
                            <ReactSortable list={subs} setList={setSubs} animation={200} className="space-y-2">
                                {subs.map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelectSub(item)}
                                        className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all cursor-pointer group ${selectedSub?._id === item._id ? 'border-info bg-info/5' : 'border-transparent hover:border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border">
                                            <img src={item.image || '/assets/images/profile-12.jpeg'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${selectedSub?._id === item._id ? 'text-info' : 'text-gray-700'}`}>{item.name}</p>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </ReactSortable>
                        )}
                    </div>
                </div>

                {/* ITEMS / SUB-ITEMS */}
                <div className="panel shadow-sm border-none flex flex-col h-[600px] p-0 overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-black/20">
                        <span className="text-xs font-black uppercase tracking-widest">3. Product Items</span>
                        {selectedSub && items.length > 0 && (
                            <button onClick={() => handleSaveRanking(items, 2, 'Item')} className="btn btn-warning btn-sm py-1 px-3 text-[10px] font-bold uppercase gap-1">
                                <IconSave className="w-3 h-3" /> Save Items
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {!selectedSub ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                                <IconCaretDown className="w-8 h-8 rotate-90 mb-2 opacity-20" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">Select a Sub-category to see items</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="p-4 text-center text-[11px] text-gray-400 italic">No sub-items found.</div>
                        ) : (
                            <ReactSortable list={items} setList={setItems} animation={200} className="space-y-2">
                                {items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center gap-3 p-2 rounded-xl border-2 border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-grab group"
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                            <img src={item.image || '/assets/images/profile-12.jpeg'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-700 truncate">{item.name}</p>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
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

export default CategoryRanking;
