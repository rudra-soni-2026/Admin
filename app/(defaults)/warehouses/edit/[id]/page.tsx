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
import IconSettings from '@/components/icon/icon-settings';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconPhone from '@/components/icon/icon-phone';

const EditWarehouse = ({ params }: { params: any }) => {
    const id = params.id;
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

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
        const fetchData = async () => {
            try {
                setFetching(true);
                const [wm, pm, am, warehouseRes] = await Promise.all([
                    callApi('/management/admin/list?role=warehouse_manager&limit=100', 'GET'),
                    callApi('/management/admin/list?role=product_manager&limit=100', 'GET'),
                    callApi('/management/admin/list?role=account_manager&limit=100', 'GET'),
                    callApi(`/management/admin/warehouses/${id}`, 'GET')
                ]);

                if (wm?.data) setWarehouseManagers(wm.data);
                if (pm?.data) setProductManagers(pm.data);
                if (am?.data) setAccountManagers(am.data);

                if (warehouseRes?.data) {
                    const w = warehouseRes.data;
                    setFormData({
                        name: w.name || '',
                        address: w.address || '',
                        city: w.city || '',
                        contact_number: w.contact_number || '',
                        email: w.email || '',
                        warehouse_manager_id: w.warehouse_manager_id || '',
                        product_manager_id: w.product_manager_id || '',
                        account_manager_id: w.account_manager_id || '',
                        latitude: w.latitude ? String(w.latitude) : '',
                        longitude: w.longitude ? String(w.longitude) : '',
                        capacity: w.capacity ? String(w.capacity) : '',
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                showMessage('Failed to load warehouse data', 'danger');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [id]);

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
            const response = await callApi(`/management/admin/warehouses/${id}`, 'PUT', {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                warehouse_manager_id: formData.warehouse_manager_id || null,
                product_manager_id: formData.product_manager_id || null,
                account_manager_id: formData.account_manager_id || null,
            });

            if (response && response.status === 'success') {
                showMessage('Warehouse updated successfully', 'success');
                router.push('/warehouses/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while updating warehouse.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full border-2 border-primary border-l-transparent w-10 h-10"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate__animated animate__fadeIn">
            {/* Breadcrumbs - Sharp */}
            <ul className="flex space-x-2 rtl:space-x-reverse text-xs font-bold uppercase tracking-widest opacity-40">
                <li><Link href="/" className="hover:text-primary">Admin</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link href="/warehouses/list" className="hover:text-primary">Warehouses</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Update Facility</span></li>
            </ul>

            {/* Header Panel - Premium Sharp */}
            <div className="bg-white dark:bg-black/20 p-6 border border-gray-100 dark:border-white/5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
                        <IconHome className="w-6 h-6" />
                    </div>
                    <div>
                        <h5 className="text-xl font-black tracking-tight dark:text-white uppercase">Update Warehouse</h5>
                        <p className="text-[10px] text-white-dark font-black tracking-widest uppercase mt-1 opacity-60">ID: {id.substring(id.length - 8).toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.push('/warehouses/list')} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-400">
                        Cancel
                    </button>
                    <button type="submit" form="warehouse-form" className="btn btn-primary gap-2 px-8 py-2.5 rounded-none font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span> : <IconSave className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Update Facility'}
                    </button>
                </div>
            </div>

            <form id="warehouse-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <IconInfoCircle className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase">Facility Details</h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 group">
                                    <label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Warehouse Identity *</label>
                                    <input id="name" type="text" placeholder="e.g. Mumbai Logistics Hub" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="md:col-span-2 group">
                                    <label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Physical Location *</label>
                                    <textarea id="address" rows={3} placeholder="Full street address, building number, etc." className="form-textarea rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.address} onChange={handleChange} required />
                                </div>
                                <div className="group">
                                    <label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Operational City</label>
                                    <input id="city" type="text" placeholder="e.g. Mumbai" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.city} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="capacity" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Storage Capacity (Units)</label>
                                    <input id="capacity" type="number" placeholder="Enter max units" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.capacity} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <IconMapPin className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase">Geo-Coordinate Mapping</h6>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group">
                                    <label htmlFor="latitude" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Latitude Coordinates</label>
                                    <input id="latitude" type="text" placeholder="e.g. 19.0760" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.latitude} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="longitude" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Longitude Coordinates</label>
                                    <input id="longitude" type="text" placeholder="e.g. 72.8777" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.longitude} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Managers */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-black/20 p-8 border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <IconPhone className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase">Communication</h6>
                            </div>
                            <div className="space-y-5">
                                <div className="group">
                                    <label htmlFor="contact_number" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Contact Hotline</label>
                                    <input id="contact_number" type="text" placeholder="+91 00000 00000" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.contact_number} onChange={handleChange} />
                                </div>
                                <div className="group">
                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Operational Email</label>
                                    <input id="email" type="email" placeholder="facility@kuiklo.com" className="form-input rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary px-4 py-3 font-bold" value={formData.email} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <IconUser className="w-5 h-5 text-primary" />
                                <h6 className="font-black tracking-tight text-sm uppercase">Leadership & Ownership</h6>
                            </div>
                            <div className="space-y-5">
                                <div className="group">
                                    <label htmlFor="warehouse_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Facility Manager</label>
                                    <select id="warehouse_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary font-bold" value={formData.warehouse_manager_id} onChange={handleChange}>
                                        <option value="">No Manager Assigned</option>
                                        {warehouseManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="group">
                                    <label htmlFor="product_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Inventory / Product Lead</label>
                                    <select id="product_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary font-bold" value={formData.product_manager_id} onChange={handleChange}>
                                        <option value="">No Product Lead Assigned</option>
                                        {productManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="group">
                                    <label htmlFor="account_manager_id" className="text-[10px] font-black uppercase tracking-widest text-white-dark mb-2 block group-focus-within:text-primary transition-colors">Finance / Account Lead</label>
                                    <select id="account_manager_id" className="form-select rounded-none border-gray-200 dark:border-white/10 bg-transparent focus:border-primary font-bold" value={formData.account_manager_id} onChange={handleChange}>
                                        <option value="">No Account Lead Assigned</option>
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

export default EditWarehouse;
