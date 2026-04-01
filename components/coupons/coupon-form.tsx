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
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', 
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        expiryDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        targetType: 'ALL', 
        targetIds: [] as any[],
        usageLimit: 0,
        usagePerUser: 1,
        isActive: true,
        applicability: 'ALL', // ALL, PRODUCTS, CATEGORIES
        productIds: [] as any[],
        categoryIds: [] as any[]
    });

    const isEdit = !!props.id;

    useEffect(() => {
        if (isEdit && props.editData) {
            setFormData({
                ...formData,
                ...props.editData,
                expiryDate: props.editData.expiryDate ? new Date(props.editData.expiryDate) : formData.expiryDate,
                targetIds: typeof props.editData.targetIds === 'string' ? JSON.parse(props.editData.targetIds) : (props.editData.targetIds || []),
                productIds: typeof props.editData.productIds === 'string' ? JSON.parse(props.editData.productIds) : (props.editData.productIds || []),
                categoryIds: typeof props.editData.categoryIds === 'string' ? JSON.parse(props.editData.categoryIds) : (props.editData.categoryIds || [])
            });
        }
    }, [props.id, props.editData]);

    const loadUserOptions = async (inputValue: string) => {
        try {
            const response = await callApi(`/management/admin/users?role=user&search=${inputValue || ''}&limit=50&isBanned=false`, 'GET');
            if (response && response.data) {
                return response.data.map((u: any) => ({
                    value: u.id || u._id,
                    label: `${u.name} - ${u.phone || u.email || 'No Phone'}`
                }));
            }
            return [];
        } catch (error) { return []; }
    };

    const loadProductOptions = async (inputValue: string) => {
        try {
            const response = await callApi(`/management/admin/products?search=${inputValue || ''}&limit=50&isActive=true`, 'GET');
            if (response && response.data) {
                return response.data.map((p: any) => ({
                    value: p.id || p._id,
                    label: `${p.name} (${p.brand || 'No Brand'}) - ₹${p.price}`
                }));
            }
            return [];
        } catch (error) { return []; }
    };

    const loadCategoryOptions = async (inputValue: string) => {
        try {
            const response = await callApi(`/products/parent-categories?level=0&limit=1000&isActive=true`, 'GET');
            if (response && response.data) {
                return response.data.map((c: any) => ({
                    value: c.id || c._id,
                    label: `${c.name} ${c.level ? '(Level ' + c.level + ')' : ''}`
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
                targetIds: formData.targetIds.map(u => typeof u === 'object' ? u.value : u),
                productIds: formData.productIds.map(p => typeof p === 'object' ? p.value : p),
                categoryIds: formData.categoryIds.map(c => typeof c === 'object' ? c.value : c)
            };
            const response = await callApi(isEdit ? `/management/admin/coupons/${props.id}` : '/management/admin/coupons', isEdit ? 'PATCH' : 'POST', payload);
            if (response) {
                if (isEdit) localStorage.removeItem(`edit_coupon_${props.id}`);
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
                                    defaultOptions={true}
                                    placeholder="Click to see list or Type to search..."
                                    className="text-xs font-bold"
                                    menuPortalTarget={isMounted ? document.body : null}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    value={formData.targetIds.length > 0 ? (Array.isArray(formData.targetIds) && typeof formData.targetIds[0] === 'object' ? formData.targetIds : null) : null}
                                    onChange={(opt: any) => setFormData({...formData, targetIds: Array.isArray(opt) ? opt : (opt ? [opt] : [])})}
                                />
                            </div>
                        )}

                        <div className="md:col-span-2 pt-4 mt-2 border-t border-dashed">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-gray-500 mb-1">Coupon Restricted To</label>
                                    <select id="applicability" className="form-select text-xs font-black text-primary" value={formData.applicability} onChange={handleChange}>
                                        <option value="ALL">ALL PRODUCTS (ENTIRE STORE)</option>
                                        <option value="PRODUCTS">SPECIFIC PRODUCTS ONLY</option>
                                        <option value="CATEGORIES">SPECIFIC CATEGORIES ONLY</option>
                                    </select>
                                </div>

                                {formData.applicability === 'PRODUCTS' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <label className="text-[11px] font-bold uppercase text-primary mb-1">Select Restricted Product(s)</label>
                                        <AsyncSelect
                                            isMulti
                                            cacheOptions
                                            loadOptions={loadProductOptions}
                                            defaultOptions={true}
                                            placeholder="Search products by name..."
                                            className="text-xs font-black"
                                            menuPortalTarget={isMounted ? document.body : null}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            value={formData.productIds.length > 0 ? (Array.isArray(formData.productIds) && typeof formData.productIds[0] === 'object' ? formData.productIds : null) : null}
                                            onChange={(opt: any) => setFormData({...formData, productIds: Array.isArray(opt) ? opt : (opt ? [opt] : [])})}
                                        />
                                    </div>
                                )}

                                {formData.applicability === 'CATEGORIES' && (
                                    <div className="animate__animated animate__fadeIn">
                                        <label className="text-[11px] font-bold uppercase text-primary mb-1">Select Restricted Category(ies)</label>
                                        <AsyncSelect
                                            isMulti
                                            cacheOptions
                                            loadOptions={loadCategoryOptions}
                                            defaultOptions={true}
                                            placeholder="Search categories..."
                                            className="text-xs font-black"
                                            menuPortalTarget={isMounted ? document.body : null}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            value={formData.categoryIds.length > 0 ? (Array.isArray(formData.categoryIds) && typeof formData.categoryIds[0] === 'object' ? formData.categoryIds : null) : null}
                                            onChange={(opt: any) => setFormData({...formData, categoryIds: Array.isArray(opt) ? opt : (opt ? [opt] : [])})}
                                        />
                                    </div>
                                )}
                             </div>
                        </div>

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
