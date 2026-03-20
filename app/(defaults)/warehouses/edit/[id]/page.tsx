'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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

const EditWarehouse = () => {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : '';
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
            if (!id) return;
            try {
                setFetching(true);
                
                // Fetch managers first (non-critical)
                try {
                    const [wm, pm, am] = await Promise.all([
                        callApi('/management/admin/list?role=warehouse_manager&limit=100', 'GET'),
                        callApi('/management/admin/list?role=product_manager&limit=100', 'GET'),
                        callApi('/management/admin/list?role=account_manager&limit=100', 'GET')
                    ]);
                    if (wm?.data) setWarehouseManagers(wm.data);
                    if (pm?.data) setProductManagers(pm.data);
                    if (am?.data) setAccountManagers(am.data);
                } catch (e) {
                    console.error('Non-critical error fetching managers:', e);
                }

                // Try to get data from localStorage first (List navigation)
                const savedData = localStorage.getItem(`edit_warehouse_${id}`);
                let localLoaded = false;
                if (savedData) {
                    const data = JSON.parse(savedData);
                    setFormData({
                        name: data.name || '',
                        address: data.address || '',
                        city: data.city || '',
                        contact_number: data.contact_number || '',
                        email: data.email || '',
                        warehouse_manager_id: data.warehouse_manager_id || '',
                        product_manager_id: data.product_manager_id || '',
                        account_manager_id: data.account_manager_id || '',
                        latitude: data.latitude ? String(data.latitude) : '',
                        longitude: data.longitude ? String(data.longitude) : '',
                        capacity: data.capacity_num ? String(data.capacity_num) : '',
                    });
                    setFetching(false); // Stop main spinner immediately
                    localLoaded = true;
                }

                // Fetch Warehouse details (critical fallback)
                let warehouseRes;
                try {
                    // Try plural first
                    warehouseRes = await callApi(`/management/admin/warehouses/${id}`, 'GET');
                } catch (e: any) {
                    if (e.message?.includes('404')) {
                        try {
                            // Try singular if plural fails with 404
                            warehouseRes = await callApi(`/management/admin/warehouse/${id}`, 'GET');
                        } catch (e2: any) {
                             if (!localLoaded) throw e2;
                        }
                    } else if (!localLoaded) {
                        throw e;
                    }
                }
                const w = warehouseRes?.data || warehouseRes; // Handle both structures

                if (w && (w.id || w._id || w.name)) {
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
                } else if (!localLoaded) {
                     throw new Error('Warehouse data not found');
                }
            } catch (error: any) {
                console.error('Error fetching warehouse details:', error);
                showMessage(error.message || 'Failed to load warehouse data', 'danger');
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
            const response = await callApi(`/management/admin/warehouses/${id}`, 'PATCH', {
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
            <div className="panel flex items-center justify-between mb-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <h5 className="text-base font-semibold dark:text-white-light leading-none">Edit Warehouse</h5>
                    <div className="bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-widest">
                         #{id?.toUpperCase().slice(-8)}
                    </div>
                </div>
                <Link href="/warehouses/list" className="btn btn-outline-primary gap-2 px-4 py-1.5 text-xs uppercase font-bold">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <div className="panel shadow-sm">
                <form id="warehouse-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="md:col-span-2 lg:col-span-2">
                            <label htmlFor="name" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Warehouse Name *</label>
                            <input id="name" type="text" placeholder="Enter Warehouse Name" className="form-input py-1.5 text-xs" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div>
                            <label htmlFor="capacity" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Storage Capacity</label>
                            <input id="capacity" type="number" placeholder="Enter Max Units" className="form-input py-1.5 text-xs" value={formData.capacity} onChange={handleChange} />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="address" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Full Physical Address *</label>
                            <textarea id="address" placeholder="Enter Full Address" className="form-textarea py-1.5 text-xs min-h-[80px]" value={formData.address} onChange={handleChange} required />
                        </div>

                        <div>
                            <label htmlFor="city" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">City</label>
                            <input id="city" type="text" placeholder="Enter City" className="form-input py-1.5 text-xs" value={formData.city} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="contact_number" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Contact Number</label>
                            <input id="contact_number" type="text" placeholder="Enter Contact Number" className="form-input py-1.5 text-xs" value={formData.contact_number} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="email" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Facility Email</label>
                            <input id="email" type="email" placeholder="warehouse@kuiklo.com" className="form-input py-1.5 text-xs" value={formData.email} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="latitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Latitude</label>
                            <input id="latitude" type="text" placeholder="e.g. 19.0760" className="form-input py-1.5 text-xs" value={formData.latitude} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="longitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Longitude</label>
                            <input id="longitude" type="text" placeholder="e.g. 72.8777" className="form-input py-1.5 text-xs" value={formData.longitude} onChange={handleChange} />
                        </div>

                        <div className="hidden lg:block"></div>

                        <div className="md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="warehouse_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Warehouse Manager</label>
                                    <select id="warehouse_manager_id" className="form-select py-1.5 text-xs" value={formData.warehouse_manager_id} onChange={handleChange}>
                                        <option value="">Select Manager</option>
                                        {warehouseManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="product_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Inventory Lead</label>
                                    <select id="product_manager_id" className="form-select py-1.5 text-xs" value={formData.product_manager_id} onChange={handleChange}>
                                        <option value="">Select Lead</option>
                                        {productManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="account_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1 block">Finance Lead</label>
                                    <select id="account_manager_id" className="form-select py-1.5 text-xs" value={formData.account_manager_id} onChange={handleChange}>
                                        <option value="">Select Lead</option>
                                        {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-2">
                        <button type="button" className="btn btn-outline-danger px-4 py-1.5 text-xs uppercase font-bold" onClick={() => router.push('/warehouses/list')} disabled={loading}>
                            Discard
                        </button>
                        <button type="submit" className="btn btn-primary px-4 py-1.5 text-xs gap-1.5 uppercase font-bold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? (
                                <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3.5 h-3.5"></span>
                            ) : (
                                <IconSave className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : 'Save Warehouse'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditWarehouse;
