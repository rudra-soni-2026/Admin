'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

interface AddAdminProps {
    role?: string;
    title?: string;
    redirectPath?: string;
}

const AddAdmin = (props: AddAdminProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: props.role || 'admin'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            showMessage('Please fill in all required fields.', 'danger');
            return;
        }

        try {
            setLoading(true);
            const response = await callApi('/auth/admin/join', 'POST', formData);

            if (response && response.status === 'success') {
                showMessage(`${props.title || 'Admin'} created successfully`, 'success');
                router.push(props.redirectPath || '/admins/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while creating admin.', 'danger');
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
                    <span>User Manager</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href={props.redirectPath || "/admins/list"} className="text-primary hover:underline">{props.title || 'Admin'} List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Add {props.title || 'Admin'}</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <h5 className="text-base font-semibold dark:text-white-light">Create New {props.title || 'Admin'}</h5>
                <Link href={props.redirectPath || "/admins/list"} className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">{props.title || 'Admin'} Name</label>
                            <input 
                                id="name" 
                                type="text" 
                                placeholder={`Enter ${props.title || 'Admin'} Name`} 
                                className="form-input py-1.5 text-xs" 
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Email Address</label>
                          <input 
                                id="email" 
                                type="email" 
                                placeholder="Enter Email Address" 
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
                                placeholder="Enter Phone Number" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Password</label>
                            <input 
                                id="password" 
                                type="password" 
                                placeholder="Enter Password" 
                                className="form-input py-1.5 text-xs" 
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button 
                            type="button" 
                            className="btn btn-outline-danger px-4 py-1.5 text-xs" 
                            onClick={() => router.push(props.redirectPath || '/admins/list')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary px-4 py-1.5 text-xs gap-1.5"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3.5 h-3.5"></span>
                            ) : (
                                <IconSave className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : `Save ${props.title || 'Admin'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdmin;
