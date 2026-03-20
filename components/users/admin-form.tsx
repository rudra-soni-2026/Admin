'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

interface AdminFormProps {
    role?: string;
    title?: string;
    redirectPath?: string;
    id?: string;
    editData?: any;
}

const AdminForm = (props: AdminFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: props.role || 'admin'
    });

    const isEdit = !!props.id;

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            const loadData = async () => {
                try {
                    // Try localStorage first
                    const cached = localStorage.getItem(`edit_user_${props.id}`);
                    if (cached) {
                        const data = JSON.parse(cached);
                        setFormData({
                            name: data.user?.name || data.name || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            password: '', // Password stays empty on edit unless user changes it
                            role: props.role || data.role || 'admin'
                        });
                    }
                    // In real app, you'd ALSO fetch from API here
                } catch (e) {
                    console.error('Error loading edit data', e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [props.id]);

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
        
        if (!formData.name || !formData.email || !formData.phone || (!isEdit && !formData.password)) {
            showMessage('Please fill in all required fields.', 'danger');
            return;
        }

        try {
            setLoading(true);
            let response;
            if (isEdit) {
                // Remove password from payload if it's empty during edit
                const payload: any = { ...formData };
                if (!payload.password) delete payload.password;
                
                // Generic user update endpoint based on role or plural users
                let endpoint = `/management/admin/users/${props.id}`;
                if (props.role === 'store_manager') endpoint = `/management/admin/users/${props.id}`; // Common for all
                
                response = await callApi(endpoint, 'PATCH', payload);
            } else {
                response = await callApi('/auth/admin/join', 'POST', formData);
            }

            if (response && (response.status === 'success' || response.id)) {
                showMessage(`${props.title || 'Admin'} ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                router.push(props.redirectPath || '/admins/list');
            }
        } catch (error: any) {
            showMessage(error.message || `Error occurred while ${isEdit ? 'updating' : 'creating'} admin.`, 'danger');
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
                    <span>{isEdit ? 'Edit' : 'Add'} {props.title || 'Admin'}</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-4 shadow-sm">
                <h5 className="text-base font-bold dark:text-white-light uppercase tracking-tight">{isEdit ? 'Update' : 'Create New'} {props.title || 'Admin'}</h5>
                <Link href={props.redirectPath || "/admins/list"} className="btn btn-outline-primary gap-2 btn-sm uppercase font-bold text-[10px]">
                    <IconArrowBackward className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            <div className="panel shadow-sm border-none">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            <label htmlFor="password" className="text-[12px] font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">
                                {isEdit ? 'New Password (Leave blank to keep current)' : 'Password'}
                            </label>
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
                            {loading ? 'Processing...' : isEdit ? `Update ${props.title || 'Admin'}` : `Save ${props.title || 'Admin'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminForm;
