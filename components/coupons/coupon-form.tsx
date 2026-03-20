'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import AsyncSelect from 'react-select/async';

interface CouponFormProps {
    id?: string;
    editData?: any;
}

const CouponForm = (props: CouponFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', 
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        expiryDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        description: '',
        targetType: 'ALL', 
        targetIds: [] as any[],
        usageLimit: 0,
        usagePerUser: 1,
        isActive: true
    });

    const isEdit = !!props.id;

    useEffect(() => {
        if (isEdit && props.editData) {
            setFormData({
                ...formData,
                ...props.editData,
                expiryDate: props.editData.expiryDate ? new Date(props.editData.expiryDate) : formData.expiryDate,
                targetIds: props.editData.targetIds || []
            });
        }
    }, [props.id, props.editData]);

    const loadUserOptions = async (inputValue: string) => {
        try {
            // Using a higher limit for default display
            const response = await callApi(`/management/admin/users?role=customer&search=${inputValue || ''}&limit=50`, 'GET');
            if (response && response.data) {
                return response.data.map((u: any) => ({
                    value: u.id || u._id,
                    label: `${u.name} - ${u.phone || u.email || 'No Phone'}`
                }));
            }
            return [];
        } catch (error) { return []; }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [id]: (e.target as HTMLInputElement).checked });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { 
                ...formData, 
                targetIds: formData.targetIds.map(u => typeof u === 'object' ? u.value : u)
            };
            const response = await callApi(isEdit ? `/management/admin/coupons/${props.id}` : '/management/admin/coupons', isEdit ? 'PATCH' : 'POST', payload);
            if (response) {
                Swal.fire({ icon: 'success', title: `Coupon ${isEdit ? 'Updated' : 'Created'}`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                router.push('/coupons/list');
            }
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-sm">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Promotions</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Coupons</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4 shadow-sm border-none">
                <h5 className="text-base font-bold uppercase tracking-tight">{isEdit ? 'Update' : 'Create'} Coupon</h5>
                <Link href="/coupons/list" className="btn btn-outline-primary btn-sm uppercase font-bold text-[10px] gap-2">
                    <IconArrowBackward className="h-4 w-4" /> Back to list
                </Link>
            </div>

            <div className="panel shadow-sm border-none">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Coupon Code</label>
                            <input id="code" type="text" placeholder="WELCOME20" className="form-input text-xs uppercase" value={formData.code} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Discount Type</label>
                            <select id="discountType" className="form-select text-xs" value={formData.discountType} onChange={handleChange}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Discount Value</label>
                            <input id="value" type="number" className="form-input text-xs" value={formData.value} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Min Order Value</label>
                            <input id="minOrder" type="number" className="form-input text-xs" value={formData.minOrder} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Max Discount Amount</label>
                            <input id="maxDiscount" type="number" className="form-input text-xs" value={formData.maxDiscount} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Audience Group</label>
                            <select id="targetType" className="form-select text-xs" value={formData.targetType} onChange={handleChange}>
                                <option value="ALL">ALL USERS</option>
                                <option value="NEW_USER">NEW USERS ONLY</option>
                                <option value="SINGLE">SINGLE USER</option>
                                <option value="MULTIPLE">SELECTED GROUP</option>
                            </select>
                        </div>

                        {/* Async User Selection */}
                        {(formData.targetType === 'SINGLE' || formData.targetType === 'MULTIPLE') && (
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[11px] font-bold uppercase text-primary">Select Target Customer(s)</label>
                                <AsyncSelect
                                    isMulti={formData.targetType === 'MULTIPLE'}
                                    cacheOptions
                                    loadOptions={loadUserOptions}
                                    defaultOptions={true} // Automatically load first batch
                                    placeholder="Click to see list or Type to search..."
                                    className="text-xs font-bold"
                                    value={formData.targetIds.length > 0 ? (Array.isArray(formData.targetIds) && typeof formData.targetIds[0] === 'object' ? formData.targetIds : null) : null}
                                    onChange={(opt: any) => setFormData({...formData, targetIds: Array.isArray(opt) ? opt : (opt ? [opt] : [])})}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Usage Limit (Global)</label>
                            <input id="usageLimit" type="number" className="form-input text-xs" value={formData.usageLimit} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Usage Per User</label>
                            <input id="usagePerUser" type="number" className="form-input text-xs" value={formData.usagePerUser} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Expiry Date</label>
                            <Flatpickr value={formData.expiryDate} options={{ dateFormat: 'Y-m-d', minDate: 'today' }} className="form-input text-xs" onChange={(d) => setFormData({...formData, expiryDate: d[0]})} />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <span className="text-[11px] font-bold uppercase text-gray-500">Active Status</span>
                            <label className="w-10 h-5 relative cursor-pointer">
                                <input type="checkbox" id="isActive" className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer" checked={formData.isActive} onChange={handleChange} />
                                <span className="outline_switch bg-gray-200 dark:bg-dark block h-full rounded-full before:absolute before:left-0.5 before:bg-white before:bottom-0.5 before:w-4 before:h-4 before:rounded-full before:transition-all before:duration-300 peer-checked:before:left-5 peer-checked:bg-primary"></span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Description</label>
                        <textarea id="description" rows={2} className="form-textarea text-xs" value={formData.description} onChange={handleChange}></textarea>
                    </div>

                    <div className="flex gap-2 pt-4 justify-end border-t mt-4">
                        <button type="button" className="btn btn-outline-danger px-6 py-1.5 text-xs" onClick={() => router.push('/coupons/list')}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary px-8 py-1.5 text-xs gap-2">
                            {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-3.5 h-3.5"></span> : <IconSave className="w-4 h-4" />}
                            {loading ? 'Processing...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CouponForm;
