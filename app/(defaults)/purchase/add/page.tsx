'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSettings from '@/components/icon/icon-settings';
import IconBox from '@/components/icon/icon-box';
import IconListCheck from '@/components/icon/icon-list-check';
import IconNotes from '@/components/icon/icon-notes';
import IconFile from '@/components/icon/icon-file';
import IconFolder from '@/components/icon/icon-folder';

const AddPurchase = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        warehouse_id: '',
        reference_no: '',
        status: 'received',
        order_tax: 0,
        discount: 0,
        shipping: 0,
        notes: '',
        is_new_supplier: false,
        new_supplier_name: '',
        new_supplier_email: '',
        new_supplier_phone: '',
        invoice: null as File | null,
    });

    const [orderItems, setOrderItems] = useState<any[]>([
        { utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }
    ]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [sRes, wRes] = await Promise.all([
                callApi('/management/admin/suppliers', 'GET'),
                callApi('/management/admin/warehouses?limit=100', 'GET')
            ]);

            if (sRes?.data) setSuppliers(sRes.data);

            if (Array.isArray(wRes?.data)) {
                setWarehouses(wRes.data.map((i: any) => ({
                    id: i.id || i._id,
                    name: i.name || 'Unknown Warehouse',
                    type: 'Warehouse'
                })));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    // Auto-select warehouse for Accountant Manager
    useEffect(() => {
        if (warehouses.length > 0) {
            const userDataStr = localStorage.getItem('userData');
            const storedRole = localStorage.getItem('role');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const userRole = (storedRole || userData.role || '').toLowerCase().replace(' ', '_');
                const assignedId = userData.assignedId || userData.assigned_id || userData.warehouse_id || userData.assigned_warehouse_id;

                // Flexible check for account_manager role and assignedId presence
                if ((userRole.includes('account_manager') || userRole.includes('accountant')) && assignedId) {
                    setFormData(prev => {
                        // Matching state with assignedId from userData
                        if (!prev.warehouse_id) {
                            return { ...prev, warehouse_id: assignedId };
                        }
                        return prev;
                    });
                }
            }
        }
    }, [warehouses]);

    const handleFormChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: any) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, invoice: file }));
    };

    const addItem = () => {
        setOrderItems([{ utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }, ...orderItems]);
    };

    const removeItem = (index: number) => {
        let newItems = [...orderItems];
        newItems.splice(index, 1);
        if (newItems.length === 0) {
            newItems = [{ utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }];
        }
        setOrderItems(newItems);
    };

    const fetchProductByUtc = async (utc: string, index: number) => {
        if (!utc || utc.length < 8) return;
        try {
            const newItems = [...orderItems];
            newItems[index].isSearching = true;
            newItems[index].searchedUtc = utc;
            setOrderItems(newItems);

            const res = await callApi(`/products/utc/${utc}`, 'GET');
            const productData = res?.product || res?.data || res;
            const product = Array.isArray(productData) ? productData[0] : productData;

            if (product && (product._id || product.id)) {
                const variant = product.variants?.find((v: any) => v.barcode === utc || v.utc_id === utc) || product.variants?.[0] || {};
                
                const updatedItems = [...orderItems];
                updatedItems[index] = {
                    ...updatedItems[index],
                    product_id: product._id || product.id,
                    name: product.name || variant.unit_label || 'Unnamed Item',
                    image: product.image || variant.image || '/assets/images/profile-1.jpeg',
                    price: variant.original_price || product.original_price || 0,
                    sell_price: variant.price || product.price || 0,
                    isSearching: false
                };
                setOrderItems(updatedItems);
                showMessage('Product details fetched!', 'success');
            } else {
                const failedItems = [...orderItems];
                failedItems[index].isSearching = false;
                setOrderItems(failedItems);
            }
        } catch (error) {
            console.error('Error fetching product by UTC:', error);
            const failedItems = [...orderItems];
            failedItems[index].isSearching = false;
            setOrderItems(failedItems);
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;

        if (field === 'utc' && (value.length >= 8 && value.length <= 16)) {
            fetchProductByUtc(value, index);
        }

        const price = Number(newItems[index].price) || 0;
        const qty = Number(newItems[index].quantity) || 0;
        const cgst = Number(newItems[index].cgst) || 0;
        const sgst = Number(newItems[index].sgst) || 0;
        const igst = Number(newItems[index].igst) || 0;
        const cess = Number(newItems[index].cess) || 0;

        const totalTaxPercent = cgst + sgst + igst + cess;
        const baseAmount = price * qty;
        const taxAmount = (baseAmount * totalTaxPercent) / 100;

        newItems[index].subtotal = baseAmount + taxAmount;
        setOrderItems(newItems);
    };

    const calculateGrandTotal = () => {
        const itemsTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
        return itemsTotal + Number(formData.order_tax) + Number(formData.shipping) - Number(formData.discount);
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.supplier_id || !formData.warehouse_id || orderItems.some(item => !item.product_id)) {
            showMessage('Please fill in all required fields.', 'danger');
            return;
        }

        try {
            setLoading(true);

            let supplierId = formData.supplier_id;

            // 1. If new supplier, create them first (using the updated endpoint if needed, but keeping existing logic as requested)
            if (formData.is_new_supplier) {
                const supplierData = {
                    name: formData.new_supplier_name,
                    email: formData.new_supplier_email,
                    phone: formData.new_supplier_phone,
                    role: 'supplier',
                    password: 'Supplier@123'
                };
                const supplierRes = await callApi('/management/admin/suppliers', 'POST', supplierData);
                if (supplierRes && supplierRes.status === 'success') {
                    supplierId = supplierRes.data.id || supplierRes.data._id;
                } else {
                    throw new Error('Failed to create new supplier');
                }
            }

            // 2. Upload Invoice if present
            let invoiceUrl = '';
            if (formData.invoice) {
                // Check invoice size (limit to 1MB)
                if (formData.invoice.size > 1024 * 1024) {
                    showMessage('Invoice file size exceeds 1MB limit. Please upload a smaller file.', 'danger');
                    setLoading(false);
                    return;
                }
                const uploadData = new FormData();
                uploadData.append('images', formData.invoice);
                const uploadRes = await callApi('/upload', 'POST', uploadData);
                if (uploadRes && uploadRes.status === 'success' && uploadRes.data?.[0]?.url) {
                    invoiceUrl = uploadRes.data[0].url;
                }
            }

            // 3. Prepare Final Payload
            const statusMap: Record<string, string> = {
                'received': 'Received',
                'pending': 'Pending',
                'ordered': 'Ordered'
            };

            const payload = {
                reference_no: formData.reference_no || `PO-${Date.now().toString().slice(-6)}`,
                purchase_date: formData.date,
                warehouse_id: formData.warehouse_id,
                supplier_id: supplierId,
                status: statusMap[formData.status] || 'Received',
                tax_amount: Number(formData.order_tax) || 0,
                discount_amount: Number(formData.discount) || 0,
                shipping_amount: Number(formData.shipping) || 0,
                grand_total: calculateGrandTotal(),
                notes: formData.notes,
                invoice_url: invoiceUrl,
                items: orderItems.map(item => ({
                    product_id: item.product_id,
                    purchase_cost: Number(item.price),
                    selling_price: Number(item.sell_price),
                    quantity: Number(item.quantity),
                    cgst_percent: Number(item.cgst),
                    sgst_percent: Number(item.sgst),
                    igst_percent: Number(item.igst),
                    cess_percent: Number(item.cess),
                    subtotal: Number(item.subtotal)
                }))
            };

            const response = await callApi('/management/admin/purchases', 'POST', payload);

            if (response && (response.status === 'success' || response.id)) {
                showMessage('Purchase created successfully', 'success');
                router.push('/purchase/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse items-center">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/purchase/list" className="text-primary hover:underline">Purchase Management</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Create Purchase</span>
                </li>
            </ul>

            <div className="panel flex items-center justify-between mb-6">
                <h5 className="text-lg font-bold dark:text-white-light">Create New Purchase Order</h5>
                <Link href="/purchase/list" className="btn btn-outline-primary shadow-none btn-sm uppercase font-bold">
                    <IconArrowBackward className="h-4 w-4 mr-2" /> Back
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column: Form Details */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="panel p-4">
                            <h6 className="text-sm font-bold mb-4 border-b pb-2">Purchase Details</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="date" className="text-[10px] font-bold uppercase mb-1 block text-gray-500">Date *</label>
                                    <input id="date" type="date" className="form-input py-1.5 text-xs" value={formData.date} onChange={handleFormChange} required />
                                </div>
                                <div>
                                    <label htmlFor="reference_no" className="text-[10px] font-bold uppercase mb-1 block text-gray-500">Reference No</label>
                                    <input id="reference_no" type="text" placeholder="PO-00001" className="form-input py-1.5 text-xs" value={formData.reference_no} onChange={handleFormChange} />
                                </div>
                                <div>
                                    <label htmlFor="warehouse_id" className="text-[10px] font-bold uppercase mb-1 block text-gray-500">Location *</label>
                                    {((localStorage.getItem('role') || '').toLowerCase().includes('account_manager') || (localStorage.getItem('role') || '').toLowerCase().includes('accountant')) && formData.warehouse_id ? (
                                        <div className="form-input py-1.5 bg-gray-50 border-gray-200 font-bold uppercase text-[10px] h-9 flex items-center">
                                            {warehouses.find(w => w.id === formData.warehouse_id)?.name || 'Fetching...'}
                                        </div>
                                    ) : (
                                        <select id="warehouse_id" className="form-select py-1.5 text-xs font-semibold" value={formData.warehouse_id} onChange={handleFormChange} required>
                                            <option value="">Select Location</option>
                                            {warehouses.map(w => (
                                                <option key={w.id || w._id} value={w.id || w._id}>
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="supplier_id" className="text-[10px] font-bold uppercase mb-1 block text-gray-500 flex justify-between items-center">
                                        Supplier *
                                        <button type="button" className="text-primary hover:underline lowercase font-normal text-[9px]" onClick={() => setFormData(prev => ({ ...prev, is_new_supplier: !prev.is_new_supplier }))}>
                                            {formData.is_new_supplier ? 'Select Existing' : '+ Add New'}
                                        </button>
                                    </label>
                                    {!formData.is_new_supplier ? (
                                        <select id="supplier_id" className="form-select py-1.5 text-xs font-semibold" value={formData.supplier_id} onChange={handleFormChange} required={!formData.is_new_supplier}>
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <div className="space-y-1.5 p-2 bg-gray-50 dark:bg-dark-light/10 rounded-lg border border-dashed border-gray-200">
                                            <input id="new_supplier_name" type="text" placeholder="Name" className="form-input py-1 text-[11px]" value={formData.new_supplier_name} onChange={handleFormChange} required />
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <input id="new_supplier_email" type="email" placeholder="Email" className="form-input py-1 text-[11px]" value={formData.new_supplier_email} onChange={handleFormChange} required />
                                                <input id="new_supplier_phone" type="text" placeholder="Phone" className="form-input py-1 text-[11px]" value={formData.new_supplier_phone} onChange={handleFormChange} required />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="text-[10px] font-bold uppercase mb-1 block text-gray-500">Purchase Notes</label>
                                    <textarea id="notes" rows={1} className="form-textarea py-1.5 text-xs" placeholder="Add any details..." value={formData.notes} onChange={handleFormChange}></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <h6 className="text-xs font-bold uppercase tracking-tight text-gray-500">Order Items</h6>
                                <button type="button" className="btn btn-primary btn-xs rounded-full px-3" onClick={addItem}>
                                    <IconPlus className="w-3 h-3 mr-1" /> Add Item
                                </button>
                            </div>

                            <div className="space-y-2">
                                {orderItems.map((item, index) => (
                                    <div key={index} className={`flex items-center gap-3 p-2 bg-white dark:bg-[#0e1726] border rounded-xl transition-all hover:shadow-md ${item.product_id ? 'border-success/30 bg-success/5' : 'border-gray-200 dark:border-gray-800'}`}>

                                        {/* Image & Basic Info */}
                                        <div className="w-8 h-8 flex-shrink-0 bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">
                                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain" /> : <IconBox className="w-4 h-4 text-gray-300" />}
                                        </div>

                                        {/* Barcode/UTC Search */}
                                        <div className="w-32 flex-shrink-0">
                                            <input
                                                type="text"
                                                placeholder="UTC / Barcode"
                                                autoFocus={index === 0}
                                                readOnly={!!item.product_id}
                                                className={`form-input h-8 py-1 px-2 text-[10px] font-bold tracking-tight rounded-lg w-full ${item.product_id ? 'bg-transparent border-none text-primary p-0' : 'bg-gray-50 border-gray-100 focus:border-primary'}`}
                                                value={item.utc || ''}
                                                onChange={(e) => handleItemChange(index, 'utc', e.target.value)}
                                            />
                                        </div>

                                        {/* Product Name */}
                                        <div className="flex-1 min-w-0">
                                            {item.name ? (
                                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 uppercase truncate block">
                                                    {item.name}
                                                </span>
                                            ) : item.isSearching ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="animate-spin h-2 w-2 border border-primary border-t-transparent rounded-full"></span>
                                                    <span className="text-[9px] text-primary font-bold animate-pulse">Searching for product...</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] text-gray-400 italic">Scan to identify item...</span>
                                            )}
                                        </div>

                                        {/* Cost & Sell */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-20">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold">₹</span>
                                                <input type="number" placeholder="Cost" className="form-input h-8 pl-4 pr-1 text-center text-[10px] font-bold rounded-lg border-gray-100" value={item.price || ''} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                            </div>
                                            <div className="relative w-20">
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold">₹</span>
                                                <input type="number" placeholder="Sell" className="form-input h-8 pl-4 pr-1 text-center text-[10px] font-bold rounded-lg border-gray-100" value={item.sell_price || ''} onChange={(e) => handleItemChange(index, 'sell_price', e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div className="flex items-center w-24 h-8 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                                            <button type="button" className="w-8 h-full hover:bg-gray-100 dark:hover:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-xs" onClick={() => handleItemChange(index, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))}>−</button>
                                            <input type="number" className="bg-transparent text-[10px] text-center font-bold w-full outline-none p-0 border-none" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                            <button type="button" className="w-8 h-full hover:bg-gray-100 dark:hover:bg-gray-900 border-l border-gray-200 dark:border-gray-800 text-xs" onClick={() => handleItemChange(index, 'quantity', (Number(item.quantity) || 0) + 1)}>+</button>
                                        </div>

                                        {/* Taxes (Compact) */}
                                        <div className="flex items-center p-1 bg-gray-100/50 dark:bg-black/20 rounded-lg gap-1 border border-gray-200 dark:border-gray-800">
                                            {['cgst', 'sgst', 'igst', 'cess'].map((tax) => (
                                                <input
                                                    key={tax}
                                                    type="number"
                                                    placeholder={tax.toUpperCase()}
                                                    className="form-input h-6 w-9 p-0 text-center text-[9px] font-bold rounded border-transparent bg-transparent hover:bg-white"
                                                    value={item[tax as keyof typeof item] || ''}
                                                    onChange={(e) => handleItemChange(index, tax, e.target.value)}
                                                />
                                            ))}
                                        </div>

                                        {/* Subtotal */}
                                        <div className="w-20 text-right">
                                            <span className="text-[11px] font-black text-primary">₹{item.subtotal.toFixed(2)}</span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            className="w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center"
                                            onClick={() => removeItem(index)}
                                        >
                                            <IconTrashLines className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3 Width) */}
                    <div className="space-y-6">
                        <div className="panel p-4">
                            <h6 className="text-[11px] font-bold uppercase mb-4 border-b pb-2">Order Summary</h6>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="status" className="text-[10px] font-bold uppercase mb-1 block text-gray-500">Status</label>
                                    <select id="status" className="form-select py-1.5 text-xs font-semibold" value={formData.status} onChange={handleFormChange}>
                                        <option value="received">Received</option>
                                        <option value="pending">Pending</option>
                                        <option value="ordered">Ordered</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="order_tax" className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Order Tax</label>
                                        <input id="order_tax" type="number" className="form-input py-1 text-xs font-bold" value={formData.order_tax} onChange={handleFormChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="discount" className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Discount</label>
                                        <input id="discount" type="number" className="form-input py-1 text-xs font-bold" value={formData.discount} onChange={handleFormChange} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="shipping" className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Shipping</label>
                                    <input id="shipping" type="number" className="form-input py-1 text-xs font-bold" value={formData.shipping} onChange={handleFormChange} />
                                </div>
                                <div className="pt-3 border-t mt-3 flex justify-between items-center px-3 bg-primary/5 py-2.5 rounded-lg border border-primary/10">
                                    <span className="text-[9px] font-bold uppercase text-gray-400">Total</span>
                                    <span className="text-lg font-black text-primary">₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="panel p-4">
                            <h6 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest border-b pb-1">Attachments</h6>
                            <div className="flex flex-col gap-2">
                                <div className="relative group overflow-hidden bg-gray-50 dark:bg-black/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all p-3 text-center cursor-pointer">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                        accept=".pdf,image/*"
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                        <IconFile className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                            {formData.invoice ? formData.invoice.name : 'Upload Invoice'}
                                        </span>
                                    </div>
                                </div>
                                {formData.invoice && (
                                    <button
                                        type="button"
                                        className="text-[9px] text-danger hover:underline font-bold self-center"
                                        onClick={() => setFormData(prev => ({ ...prev, invoice: null }))}
                                    >
                                        Remove File
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="panel sticky bottom-0 z-10 flex justify-end gap-3 shadow-xl mt-8 border-t border-gray-100 py-4 bg-white/80 backdrop-blur-md dark:bg-black/80 rounded-t-none">
                    <button type="button" className="btn btn-outline-danger px-8 uppercase font-bold text-xs" onClick={() => router.push('/purchase/list')}>
                        Discard
                    </button>
                    <button type="submit" className="btn btn-primary px-10 h-10 uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-primary/20 shadow-md" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4" /> : <IconSave className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Save Purchase'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPurchase;
