'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

const AddSupplier = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        tax_id: '',
        isActive: true,
        password: 'defaultPassword123!',
        role: 'supplier'
    });

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
            const response = await callApi('/management/admin/suppliers', 'POST', formData);

            if (response && response.status === 'success') {
                showMessage(`Supplier created successfully`, 'success');
                router.push('/suppliers/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while creating supplier.', 'danger');
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
                    <span>Inventory & Products</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/suppliers/list" className="text-primary hover:underline">Supplier List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Add Supplier</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <h5 className="text-base font-semibold dark:text-white-light">Create New Supplier</h5>
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
                                className="form-input py-1.5 text-xs" 
                                value={formData.email}
                                onChange={handleChange}
                            />
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
                                placeholder="Regsitration Number" 
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
                        <div className="md:col-span-2">
                            <label htmlFor="address" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Full Address</label>
                            <textarea 
                                id="address" 
                                rows={2} 
                                placeholder="Street, Area, Pincode" 
                                className="form-textarea py-1.5 text-xs" 
                                value={formData.address}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button 
                            type="button" 
                            className="btn btn-outline-danger px-4 py-1.5 text-xs uppercase font-bold" 
                            onClick={() => router.push('/suppliers/list')}
                            disabled={loading}
                        >
                            Discard
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary px-4 py-1.5 text-xs gap-1.5 uppercase font-bold"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3.5 h-3.5"></span>
                            ) : (
                                <IconSave className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : `Save Supplier`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplier;
