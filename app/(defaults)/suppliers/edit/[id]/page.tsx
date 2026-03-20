'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

const EditSupplier = () => {
    const router = useRouter();
    const params = useParams();
    const supplierId = params.id;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        city: '',
        tax_id: '',
        status: 'active',
        role: 'supplier'
    });

    useEffect(() => {
        const fetchSupplierData = async () => {
            try {
                setFetching(true);
                
                // Try to get data from localStorage first (List navigation)
                const savedData = localStorage.getItem(`edit_supplier_${supplierId}`);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    setFormData({
                        name: data.name || '',
                        contact_person: data.contact_person || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        city: data.city || '',
                        tax_id: data.tax_id || '',
                        status: (data.status || 'Active').toLowerCase(),
                        role: 'supplier'
                    });
                    setFetching(false);
                    return;
                }

                // Fallback to API if someone goes directly to the URL
                const response = await callApi(`/management/admin/suppliers/${supplierId}`, 'GET');
                if (response && response.data) {
                    const data = response.data;
                    setFormData({
                        name: data.name || '',
                        contact_person: data.contact_person || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        city: data.city || '',
                        tax_id: data.tax_id || '',
                        status: data.isBanned ? 'inactive' : 'active',
                        role: data.role || 'supplier'
                    });
                }
            } catch (error) {
                console.error('Error fetching supplier:', error);
                // If both fail, we show an error
                if (!localStorage.getItem(`edit_supplier_${supplierId}`)) {
                   showMessage('Could not find supplier data. Redirecting back...', 'danger');
                   setTimeout(() => router.push('/suppliers/list'), 2000);
                }
            } finally {
                setFetching(false);
            }
        };

        if (supplierId) {
            fetchSupplierData();
        }
    }, [supplierId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
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
                container: 'toast-container',
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
        
        if (!formData.name) {
            showMessage('Please fill in the Supplier Name.', 'danger');
            return;
        }

        try {
            setLoading(true);
            // Payload for update - Removing isBanned as it's handled on list page
            const payload = {
                ...formData
            };

            const response = await callApi(`/management/admin/suppliers/${supplierId}`, 'PATCH', payload);

            if (response && response.status === 'success') {
                localStorage.removeItem(`edit_supplier_${supplierId}`); // Clear the temp storage
                showMessage(`Supplier updated successfully`, 'success');
                router.push('/suppliers/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while updating supplier.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center p-10 min-h-[400px]">
                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10"></span>
            </div>
        );
    }

    return (
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Inventory & Products</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/suppliers/list" className="text-primary hover:underline">Supplier List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Edit Supplier</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h5 className="text-base font-semibold dark:text-white-light text-primary">Edit Supplier: {formData.name}</h5>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formData.status === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                        {formData.status}
                    </div>
                </div>
                <Link href="/suppliers/list" className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Supplier / Business Name *</label>
                            <input 
                                id="name" 
                                type="text" 
                                placeholder="Enter Company or Business Name" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="contact_person" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Contact Person Name</label>
                            <input 
                                id="contact_person" 
                                type="text" 
                                placeholder="Manager or Owner Name" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.contact_person}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Email Address</label>
                          <input 
                                id="email" 
                                type="email" 
                                placeholder="supplier@example.com" 
                                className="form-input py-1.5 text-xs bg-gray-50 dark:bg-black cursor-not-allowed" 
                                value={formData.email}
                                readOnly
                            />
                            <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Registration email cannot be changed for security reasons.</p>
                        </div>
                        <div>
                            <label htmlFor="phone" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Phone Number</label>
                          <input 
                                id="phone" 
                                type="text" 
                                placeholder="+91 XXXXXXXXXX" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="tax_id" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">TAX / GSTIN / PAN ID</label>
                            <input 
                                id="tax_id" 
                                type="text" 
                                placeholder="Registration Number" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.tax_id}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">City</label>
                            <input 
                                id="city" 
                                type="text" 
                                placeholder="Enter City" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.city}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <div className="text-[11px] text-gray-400 italic">
                            Last identification ID: {supplierId}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button 
                                type="button" 
                                className="btn btn-outline-danger px-4 py-1.5 text-xs uppercase font-bold" 
                                onClick={() => router.push('/suppliers/list')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary px-4 py-1.5 text-xs gap-1.5 uppercase font-bold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3.5 h-3.5"></span>
                                ) : (
                                    <IconSave className="h-4 w-4" />
                                )}
                                {loading ? 'Updating...' : `Update Supplier`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSupplier;
