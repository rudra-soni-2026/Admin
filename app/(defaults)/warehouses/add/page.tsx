'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

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
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/warehouses/list" className="text-primary hover:underline">Warehouse List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Add Warehouse</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <h5 className="text-base font-semibold dark:text-white-light">Create New Warehouse</h5>
                <Link href="/warehouses/list" className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Warehouse Name *</label>
                            <input id="name" type="text" placeholder="Enter Warehouse Name" className="form-input py-1.5 text-xs" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Full Address *</label>
                            <textarea id="address" placeholder="Enter Warehouse Address" className="form-textarea py-1.5 text-xs min-h-[80px]" value={formData.address} onChange={handleChange} required />
                        </div>

                        <div>
                            <label htmlFor="city" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">City</label>
                            <input id="city" type="text" placeholder="Enter City" className="form-input py-1.5 text-xs" value={formData.city} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="email" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Email Address</label>
                            <input id="email" type="email" placeholder="Enter Email" className="form-input py-1.5 text-xs" value={formData.email} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="contact_number" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Contact Number</label>
                            <input id="contact_number" type="text" placeholder="Enter Contact Number" className="form-input py-1.5 text-xs" value={formData.contact_number} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="capacity" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Capacity (Sqft/Units)</label>
                            <input id="capacity" type="number" placeholder="Enter Capacity" className="form-input py-1.5 text-xs" value={formData.capacity} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="latitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Latitude</label>
                            <input id="latitude" type="text" placeholder="e.g. 19.0760" className="form-input py-1.5 text-xs" value={formData.latitude} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="longitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Longitude</label>
                            <input id="longitude" type="text" placeholder="e.g. 72.8777" className="form-input py-1.5 text-xs" value={formData.longitude} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="warehouse_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Warehouse Manager</label>
                            <select id="warehouse_manager_id" className="form-select py-1.5 text-xs" value={formData.warehouse_manager_id} onChange={handleChange}>
                                <option value="">Select Manager</option>
                                {warehouseManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="product_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Product Manager</label>
                            <select id="product_manager_id" className="form-select py-1.5 text-xs" value={formData.product_manager_id} onChange={handleChange}>
                                <option value="">Select Manager</option>
                                {productManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="account_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Account Manager</label>
                            <select id="account_manager_id" className="form-select py-1.5 text-xs" value={formData.account_manager_id} onChange={handleChange}>
                                <option value="">Select Manager</option>
                                {accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" className="btn btn-outline-danger px-4 py-1.5 text-xs" onClick={() => router.push('/warehouses/list')} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4 py-1.5 text-xs gap-1.5" disabled={loading}>
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

export default AddWarehouse;
