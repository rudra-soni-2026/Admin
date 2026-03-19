'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import IconHome from '@/components/icon/icon-home';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUser from '@/components/icon/icon-user';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconPhone from '@/components/icon/icon-phone';

const AddWarehouse = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Dropdown data
    const [warehouseManagers, setWarehouseManagers] = useState<any[]>([]);
    const [productManagers, setProductManagers] = useState<any[]>([]);
    const [accountManagers, setAccountManagers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        contact_number: '',
        email: '',
        warehouse_manager_id: '',
        product_manager_id: '',
        account_manager_id: '',
        latitude: '',
        longitude: '',
        capacity: '',
    });

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const [wm, pm, am] = await Promise.all([
                    callApi('/management/admin/list?role=warehouse_manager&limit=100', 'GET'),
                    callApi('/management/admin/list?role=product_manager&limit=100', 'GET'),
                    callApi('/management/admin/list?role=account_manager&limit=100', 'GET')
                ]);

                if (wm?.data) setWarehouseManagers(wm.data);
                if (pm?.data) setProductManagers(pm.data);
                if (am?.data) setAccountManagers(am.data);
            } catch (error) {
                console.error('Error fetching managers:', error);
            }
        };
        fetchManagers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
            customClass: {
                popup: `color-${type}`,
                container: 'no-radius-swal'
            },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.address) {
            showMessage('Name and Address are required.', 'danger');
            return;
        }

        try {
            setLoading(true);
            const response = await callApi('/management/admin/warehouses', 'POST', {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                warehouse_manager_id: formData.warehouse_manager_id || null,
                product_manager_id: formData.product_manager_id || null,
                account_manager_id: formData.account_manager_id || null,
            });

            if (response && response.status === 'success') {
                showMessage('Warehouse created successfully', 'success');
                router.push('/warehouses/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while creating warehouse.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate__animated animate__fadeIn text-black dark:text-white-dark">
            {/* Breadcrumbs - Sharp */}
            <ul className="flex space-x-2 rtl:space-x-reverse text-xs font-bold uppercase tracking-widest opacity-40">
                <li><Link href="/" className="hover:text-primary transition-colors">Admin</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link href="/warehouses/list" className="hover:text-primary transition-colors">Warehouses</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Create Facility</span></li>
            </ul>

            {/* Header Panel - Premium Sharp */}
            <div className="bg-white dark:bg-black/20 p-6 border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
                        <IconHome className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="text-xl font-black tracking-tight dark:text-white uppercase leading-none">New Warehouse</h5>
                        <p className="text-[10px] text-white-dark font-black tracking-widest uppercase mt-2 opacity-60 italic">Register a new storage facility</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.push('/warehouses/list')} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-400">
                        Discard
                    </button>
                    <button type="submit" form="warehouse-form" className="btn btn-primary gap-2 px-8 py-2.5 rounded-none font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span> : <IconSave className="w-4 h-4" />}
                        {loading ? 'Processing...' : 'Deploy Facility'}
                    </button>
                </div>
            </div>

            <form id="warehouse-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 space-y-8 shadow-sm relative overflow-hidden group/panel">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/panel:opacity-10 transition-opacity">
                            <IconHome className="w-24 h-24" />
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <IconInfoCircle className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase underline decoration-primary/30 decoration-2 underline-offset-8">Facility Identity</h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 group">
                                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Warehouse Name *</label>
                                    <input id="name" type="text" placeholder="e.g. Mumbai Logistics Hub" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm tracking-tight" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="md:col-span-2 group">
                                    <label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Full Physical Address *</label>
                                    <textarea id="address" rows={3} placeholder="Full street address, building number, landmark, etc." className="form-textarea rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.address} onChange={handleChange} required />
                                </div>
                                <div className="group">
                                    <label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">City Location</label>
                                    <input id="city" type="text" placeholder="e.g. Mumbai" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.city} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Storage Capacity (Total Units)</label>
                                    <input id="capacity" type="number" placeholder="Enter max unit limit" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.capacity} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <IconMapPin className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase underline decoration-primary/30 decoration-2 underline-offset-8">Geospatial Mapping</h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group">
                                    <label htmlFor="latitude" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Latitude Coordinate</label>
                                    <input id="latitude" type="text" placeholder="e.g. 19.0760" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.latitude} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="longitude" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Longitude Coordinate</label>
                                    <input id="longitude" type="text" placeholder="e.g. 72.8777" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.longitude} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Managers */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <IconPhone className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase underline decoration-primary/30 decoration-2 underline-offset-8">Hotline Info</h6>
                            </div>
                            <div className="space-y-6">
                                <div className="group">
                                    <label htmlFor="contact_number" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Primary Contact</label>
                                    <input id="contact_number" type="text" placeholder="+91 00000 00000" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.contact_number} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Facility Email</label>
                                    <input id="email" type="email" placeholder="warehouse@kuiklo.com" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-4 font-bold text-sm" value={formData.email} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-8">
                                <IconUser className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase underline decoration-primary/30 decoration-2 underline-offset-8">Leadership Roles</h6>
                            </div>
                            <div className="space-y-6">
                                <div className="group">
                                    <label htmlFor="warehouse_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Warehouse Manager</label>
                                    <select id="warehouse_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary py-4 font-bold text-sm" value={formData.warehouse_manager_id} onChange={handleChange}>
                                        <option value="">Select Manager</option>
                                        {warehouseManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="group">
                                    <label htmlFor="product_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Inventory Manager</label>
                                    <select id="product_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary py-4 font-bold text-sm" value={formData.product_manager_id} onChange={handleChange}>
                                        <option value="">Select Manager</option>
                                        {productManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="group">
                                    <label htmlFor="account_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Account Manager</label>
                                    <select id="account_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary py-4 font-bold text-sm" value={formData.account_manager_id} onChange={handleChange}>
                                        <option value="">Select Manager</option>
                                        {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddWarehouse;
