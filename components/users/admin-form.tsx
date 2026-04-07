'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import Select from 'react-select';
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
    const [fetchingOptions, setFetchingOptions] = useState(false);

    // Optimized State Management
    const [storeOptions, setStoreOptions] = useState<any[]>([]);
    const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>({
        name: '', email: '', phone: '', password: '',
        role: props.role || 'admin',
        storeIds: ['ALL_STORES'],
        warehouseIds: ['ALL_WAREHOUSES'],
        permissions: {}
    });

    const isEdit = !!props.id;

    // Memoize static module list to prevent re-renders
    const permissionMap = useMemo(() => [
        { id: 'dashboard', label: 'Dashboard', group: 'Core' },
        { id: 'users', label: 'Customers', group: 'Core' },
        { id: 'admins', label: 'Admins', group: 'Teams' },
        { id: 'product_managers', label: 'Product Managers', group: 'Teams' },
        { id: 'accountant_managers', label: 'Accountant Managers', group: 'Teams' },
        { id: 'warehouse_managers', label: 'Warehouse Managers', group: 'Teams' },
        { id: 'store_managers', label: 'Store Managers', group: 'Teams' },
        { id: 'riders', label: 'Riders', group: 'Teams' },
        { id: 'warehouses', label: 'Warehouses', group: 'Places' },
        { id: 'stores', label: 'Stores', group: 'Places' },
        { id: 'orders', label: 'Orders', group: 'Operations' },
        { id: 'purchase', label: 'Purchases', group: 'Operations' },
        { id: 'suppliers', label: 'Suppliers', group: 'Operations' },
        { id: 'warehouse_inventory', label: 'Warehouse Inventory', group: 'Inventory' },
        { id: 'store_inventory', label: 'Store Inventory', group: 'Inventory' },
        { id: 'inventory_transfer', label: 'Inventory Transfer', group: 'Inventory' },
        { id: 'products', label: 'Products', group: 'Catalog' },
        { id: 'categories', label: 'Categories', group: 'Catalog' },
        { id: 'offers', label: 'Offers', group: 'Catalog' },
        { id: 'notifications', label: 'Notifications', group: 'Marketing' },
        { id: 'coupons', label: 'Coupons', group: 'Marketing' },
        { id: 'product_ranking', label: 'Product Ranking', group: 'Marketing' },
        { id: 'category_ranking', label: 'Category Ranking', group: 'Marketing' },
        { id: 'settings', label: 'Company Settings', group: 'System' },
    ], []);

    const actions = useMemo(() => [
        { key: 'create', label: 'Create' },
        { key: 'read', label: 'View' },
        { key: 'update', label: 'Edit' },
        { key: 'delete', label: 'Delete' },
    ], []);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setFetchingOptions(true);
                const [storesRes, warehousesRes] = await Promise.all([
                    callApi('/management/admin/stores?limit=1000', 'GET'),
                    callApi('/management/admin/warehouses?limit=1000', 'GET')
                ]);

                if (storesRes?.data) {
                    setStoreOptions([{ value: 'ALL_STORES', label: '✨ ALL STORES' }, ...storesRes.data.map((s: any) => ({ value: s.id, label: s.name }))]);
                }
                if (warehousesRes?.data) {
                    setWarehouseOptions([{ value: 'ALL_WAREHOUSES', label: '✨ ALL WAREHOUSES' }, ...warehousesRes.data.map((w: any) => ({ value: w.id, label: w.name }))]);
                }
            } catch (error) { console.error('Error fetching options:', error); } finally { setFetchingOptions(false); }
        };

        fetchOptions();

        if (isEdit) {
            const loadData = async () => {
                try {
                    setLoading(true);
                    let data: any = null;
                    const cached = localStorage.getItem(`edit_user_${props.id}`);
                    if (cached) data = JSON.parse(cached);

                    // Fetch from API to ensure we have the latest and all fields
                    const res = await callApi(`/management/admin/users/${props.id}`, 'GET');
                    if (res) data = res;

                    if (data) {
                        setFormData((prev: any) => {
                            // Drill down into nested 'data' property if it exists
                            const rawData = data.data || data.user || data;

                            let sIds = rawData.storeIds || ['ALL_STORES'];
                            if (typeof sIds === 'string') try { sIds = JSON.parse(sIds); } catch (e) { }

                            let wIds = rawData.warehouseIds || ['ALL_WAREHOUSES'];
                            if (typeof wIds === 'string') try { wIds = JSON.parse(wIds); } catch (e) { }

                            let perms = rawData.permissions || {};
                            if (typeof perms === 'string') try { perms = JSON.parse(perms); } catch (e) { }

                            return {
                                ...prev,
                                name: rawData.name || rawData.adminName || rawData.admin_name || rawData.fullName || '',
                                email: rawData.email || '',
                                phone: rawData.phone || rawData.contact_number || rawData.phone_number || '',
                                role: rawData.role || props.role || 'admin',
                                storeIds: sIds,
                                warehouseIds: wIds,
                                permissions: perms
                            };
                        });
                    }
                } catch (error) { console.error('Error loading edit data:', error); } finally { setLoading(false); }
            };
            loadData();
        }
    }, [props.id]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    }, []);

    const handleSelectChange = useCallback((field: string, selectedOptions: any) => {
        let values = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
        const allVal = field === 'storeIds' ? 'ALL_STORES' : 'ALL_WAREHOUSES';
        const wasAllSelected = formData[field].includes(allVal);
        const isAllSelectedNow = values.includes(allVal);

        if (!wasAllSelected && isAllSelectedNow) values = [allVal];
        else if (wasAllSelected && values.length > 1) values = values.filter((v: string) => v !== allVal);

        setFormData((prev: any) => ({ ...prev, [field]: values }));
    }, [formData.storeIds, formData.warehouseIds]);

    const handlePermissionToggle = useCallback((moduleId: string, actionKey: string) => {
        setFormData((prev: any) => {
            const currentPerms = { ...(prev.permissions || {}) };
            const modulePerms = { ...(currentPerms[moduleId] || { create: false, read: false, update: false, delete: false }) };
            modulePerms[actionKey] = !modulePerms[actionKey];
            currentPerms[moduleId] = modulePerms;
            return { ...prev, permissions: currentPerms };
        });
    }, []);

    const handleModuleFullAccess = useCallback((moduleId: string, state: boolean) => {
        setFormData((prev: any) => {
            const currentPerms = { ...(prev.permissions || {}) };
            currentPerms[moduleId] = { create: state, read: state, update: state, delete: state };
            return { ...prev, permissions: currentPerms };
        });
    }, []);

    const isModuleFullySelected = (moduleId: string) => {
        const p = formData.permissions[moduleId];
        return p && p.create && p.read && p.update && p.delete;
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
            customClass: { container: 'toast-container', popup: `color-${type}` },
        });
        toast.fire({ icon: type, title: msg });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone || (!isEdit && !formData.password)) {
            showMessage('Please fill in all required fields.', 'danger');
            return;
        }
        try {
            setLoading(true);
            const payload = { ...formData };
            if (isEdit && !payload.password) delete payload.password;
            const res = await callApi(isEdit ? `/management/admin/users/${props.id}` : '/auth/admin/join', isEdit ? 'PATCH' : 'POST', payload);
            if (res && (res.status === 'success' || res.id)) {
                showMessage(`${props.title || 'Admin'} ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                router.push(props.redirectPath || '/admins/list');
            }
        } catch (error: any) { showMessage(error.message || `Error occurred.`, 'danger'); } finally { setLoading(false); }
    };

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            border: '1px solid #e0e6ed', borderRadius: '8px', padding: '2px 4px', boxShadow: 'none',
            '&:hover': { border: '#4361ee 1px solid' },
            fontSize: '12px', fontWeight: 'bold'
        }),
        multiValue: (base: any) => ({ ...base, backgroundColor: '#4361ee', borderRadius: '4px' }),
        multiValueLabel: (base: any) => ({ ...base, color: 'white', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }),
        multiValueRemove: (base: any) => ({ ...base, color: 'white', '&:hover': { backgroundColor: '#334ecb', color: 'white' } })
    };

    const canSeeStoreScope = formData.permissions?.stores?.read;
    const canSeeWarehouseScope = formData.permissions?.warehouses?.read;

    return (
        <div>
            <ul className="mb-4 flex space-x-2 text-xs font-bold uppercase tracking-tight text-gray-400">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>User Manager</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><Link href={props.redirectPath || "/admins/list"} className="text-primary hover:underline">{props.title || 'Admin'} List</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-700"><span>{isEdit ? 'Edit' : 'Add'} Administrator</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4 shadow-sm py-3 transition-all duration-300">
                <h5 className="text-[14px] font-black dark:text-white-light uppercase tracking-widest">{isEdit ? 'Update' : 'Create'} {props.title || 'Admin'}</h5>
                <Link href={props.redirectPath || "/admins/list"} className="btn btn-outline-primary gap-2 btn-xs uppercase font-black rounded-lg">
                    <IconArrowBackward className="h-3 w-3" />
                    Back
                </Link>
            </div>

            <div className="panel shadow-sm border-none p-6 animate-fade-in">
                <form onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-10">
                        {['name', 'email', 'phone', 'password'].map((id) => (
                            <div key={id}>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                                    {id === 'password' ? (isEdit ? 'New Password' : 'Password') : id.replace('_', ' ')}
                                </label>
                                <input
                                    id={id}
                                    type={id === 'password' ? 'password' : 'text'}
                                    placeholder={`Enter ${id}...`}
                                    className="form-input py-2 text-xs font-bold rounded-lg border-gray-200 focus:border-black transition-all"
                                    value={formData[id]}
                                    onChange={handleInputChange}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Conditional Territory Scope Management */}
                    {(canSeeStoreScope || canSeeWarehouseScope) && (
                        <div className="mb-10 p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-100 animate__animated animate__fadeInDown">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 block italic">Territory Assignment (Scope)</label>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {canSeeStoreScope && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">Accessible Stores {fetchingOptions && <span className="animate-spin h-3 w-3 border-2 border-primary border-l-transparent rounded-full"></span>}</label>
                                        <Select isMulti placeholder="Select Stores..." options={storeOptions} styles={selectStyles} value={storeOptions.filter(opt => formData.storeIds.includes(opt.value))} onChange={(val) => handleSelectChange('storeIds', val)} />
                                    </div>
                                )}
                                {canSeeWarehouseScope && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">Accessible Warehouses {fetchingOptions && <span className="animate-spin h-3 w-3 border-2 border-primary border-l-transparent rounded-full"></span>}</label>
                                        <Select isMulti placeholder="Select Warehouses..." options={warehouseOptions} styles={selectStyles} value={warehouseOptions.filter(opt => formData.warehouseIds.includes(opt.value))} onChange={(val) => handleSelectChange('warehouseIds', val)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Optimised Permissions Matrix */}
                    {(formData.role === 'admin' || formData.role === 'super_admin' || formData.role === 'warehouse_manager') && (
                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-4 block border-l-4 border-black pl-3">Access Privileges</label>
                            <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
                                <table className="w-full text-left bg-white">
                                    <thead className="bg-gray-50 group">
                                        <tr className="border-b border-gray-100">
                                            <th className="p-3 text-[10px] font-black uppercase text-gray-400 w-1/3 pl-6">Module Name</th>
                                            {actions.map(action => (
                                                <th key={action.key} className="p-3 text-[10px] font-black uppercase text-gray-400 text-center">{action.label}</th>
                                            ))}
                                            <th className="p-3 text-[10px] font-black uppercase text-primary text-center bg-primary/5">All Access</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {permissionMap.map((module, mIdx) => {
                                            const isFirstInGroup = mIdx === 0 || permissionMap[mIdx - 1].group !== module.group;
                                            return (
                                                <React.Fragment key={module.id}>
                                                    {isFirstInGroup && (
                                                        <tr className="bg-gray-50/10">
                                                            <td colSpan={6} className="py-2 px-6 text-[9px] font-black text-primary uppercase tracking-widest italic">{module.group} Sector</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-gray-50/50 transition-all duration-200 group">
                                                        <td className="p-3 pl-8">
                                                            <span className="text-[12px] font-bold text-gray-500 uppercase group-hover:text-black transition-colors">{module.label}</span>
                                                        </td>
                                                        {actions.map(action => (
                                                            <td key={action.key} className="p-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-checkbox h-4 w-4 mx-auto rounded border-gray-200 cursor-pointer checked:bg-black transition-colors"
                                                                    checked={!!formData.permissions[module.id]?.[action.key]}
                                                                    onChange={() => handlePermissionToggle(module.id, action.key)}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="p-3 text-center bg-gray-50/5 border-l border-gray-50">
                                                            <div className="flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className={`form-checkbox h-4 w-4 mx-auto cursor-pointer transition-all duration-300 rounded-full border-2 ${isModuleFullySelected(module.id) ? 'bg-primary border-primary shadow-sm scale-110' : 'border-gray-200 hover:border-primary/50'}`}
                                                                    checked={isModuleFullySelected(module.id)}
                                                                    onChange={(e) => handleModuleFullAccess(module.id, e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Simplified Toggle for Store Manager */}
                    {formData.role === 'store_manager' && (
                        <div className="mt-8 border-t border-gray-100 pt-8 animate-fade-in">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-6 block border-l-4 border-warning pl-3">Store Manager Controls</label>
                            
                            <div className="p-6 bg-warning/5 rounded-2xl border border-warning/10 flex items-center justify-between">
                                <div>
                                    <h4 className="text-[13px] font-black uppercase text-gray-800 mb-1">Order Editing Access</h4>
                                    <p className="text-[11px] font-bold text-gray-400">Enable this to allow this manager to modify active orders (Quantity/Items).</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${!formData.permissions?.orders?.update ? 'text-danger' : 'text-gray-300'}`}>OFF</span>
                                    <label className="relative h-6 w-12 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="custom_switch peer hidden" 
                                            checked={!!formData.permissions?.orders?.update}
                                            onChange={() => {
                                                const current = !!formData.permissions?.orders?.update;
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    permissions: {
                                                        ...prev.permissions,
                                                        orders: { read: true, update: !current } // Ensure they can at least read orders if they have edit switch
                                                    }
                                                }));
                                            }}
                                        />
                                        <span className="block h-full w-full rounded-full bg-[#ebedf2] before:absolute before:left-1 before:bottom-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-warning peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark dark:peer-checked:before:bg-white"></span>
                                    </label>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${formData.permissions?.orders?.update ? 'text-success' : 'text-gray-300'}`}>ON</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" className="px-6 py-2 bg-white text-gray-300 border border-gray-100 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 font-black" onClick={() => router.push(props.redirectPath || '/admins/list')} disabled={loading}>Discard</button>
                        <button type="submit" className="px-8 py-2 bg-black text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] disabled:opacity-50" disabled={loading}>
                            {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3 h-3"></span> : <IconSave className="h-4 w-4" />}
                            {loading ? 'Processing...' : isEdit ? `Apply Updates` : (formData.role === 'admin' || formData.role === 'super_admin' ? `Grant Full Access` : `Create ${props.title}`)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminForm;
