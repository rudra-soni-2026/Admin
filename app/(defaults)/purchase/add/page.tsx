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

    const handleUtcSearch = async (index: number, utc: string) => {
        if (!utc || utc.length < 8) return;

        try {
            const newItems = [...orderItems];
            newItems[index].isSearching = true;
            newItems[index].searchedUtc = utc; // Mark this UTC as searched immediately
            setOrderItems([...newItems]);

            const res = await callApi(`products/utc/${utc}`, 'GET');
            const product = res?.product || res?.data || res;

            const updatedItems = [...orderItems];
            updatedItems[index].isSearching = false;

            if (product && (product.id || product._id || product.name)) {
                const productId = product.id || product._id;
                const productName = product.name || product.product_name;
                const productPrice = product.original_price || product.price || 0;

                // 1. Check for Duplicate (excluding current row)
                const existingIndex = updatedItems.findIndex((item, idx) => idx !== index && item.product_id === productId);

                if (existingIndex !== -1) {
                    // DUPLICATE FOUND: Merge into existing row
                    const newItems = [...orderItems];
                    newItems[existingIndex].quantity = (Number(newItems[existingIndex].quantity) || 0) + 1;
                    newItems[existingIndex].subtotal = Number(newItems[existingIndex].price) * Number(newItems[existingIndex].quantity);
                    
                    // Clear the current scanning row since it was a merge
                    newItems[index] = { utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, subtotal: 0, isSearching: false, searchedUtc: '' };
                    
                    setOrderItems(newItems);

                    const toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 1500,
                        showCloseButton: true,
                        customClass: { popup: 'color-info border-info shadow-lg animate__animated animate__fadeInRight' },
                    });
                    toast.fire({ icon: 'info', title: `Increased quantity for: ${productName}` });
                } else {
                    // NEW UNIQUE PRODUCT: Update current row and add new row on top
                    const foundItem = {
                        ...updatedItems[index],
                        product_id: productId,
                        name: productName,
                        image: product.image || product.image_url || '',
                        price: 0, // Don't pre-fill cost
                        sell_price: 0, // Don't pre-fill sell price
                        subtotal: 0,
                        isSearching: false
                    };

                    const emptyItem = { utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' };
                    
                    setOrderItems(prev => {
                        const next = [...prev];
                        next[index] = foundItem;
                        return [emptyItem, ...next];
                    });

                    const toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 1500,
                        showCloseButton: true,
                        customClass: { popup: 'color-success border-success shadow-lg animate__animated animate__fadeInRight' },
                    });
                    toast.fire({ icon: 'success', title: `Added: ${productName}` });
                }
            } else {
                updatedItems[index].isSearching = false;
                updatedItems[index].utc = ''; // Clear the invalid barcode
                setOrderItems([...updatedItems]);

                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                    customClass: { popup: 'color-danger border-danger shadow-xl animate__animated animate__shakeX' },
                });
                toast.fire({ icon: 'error', title: 'Product Not Found!' });
            }
        } catch (error) {
            console.error('UTC Search Error:', error);
            const updatedItems = [...orderItems];
            updatedItems[index].isSearching = false;
            updatedItems[index].utc = ''; // Clear on error too
            setOrderItems([...updatedItems]);

            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                customClass: { popup: 'color-danger border-danger shadow-xl animate__animated animate__shakeX' },
            });
            toast.fire({ icon: 'error', title: 'Search Error or Not Found' });
        }
    };

    // Debounced Automatic Search
    useEffect(() => {
        const timers = orderItems.map((item, index) => {
            // Only search if the Barcode has changed and hasn't been searched yet
            if (item.utc && item.utc.length >= 8 && item.utc !== item.searchedUtc && !item.isSearching) {
                return setTimeout(() => handleUtcSearch(index, item.utc), 500);
            }
            return null;
        });
        return () => timers.forEach(t => t && clearTimeout(t));
    }, [orderItems]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        
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
                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Purchase Details</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className="text-xs font-bold uppercase mb-1 block">Date *</label>
                                    <input id="date" type="date" className="form-input" value={formData.date} onChange={handleFormChange} required />
                                </div>
                                <div>
                                    <label htmlFor="reference_no" className="text-xs font-bold uppercase mb-1 block">Reference No</label>
                                    <input id="reference_no" type="text" placeholder="PO-00001" className="form-input" value={formData.reference_no} onChange={handleFormChange} />
                                </div>
                                <div>
                                    <label htmlFor="warehouse_id" className="text-xs font-bold uppercase mb-1 block">Location *</label>
                                    {((localStorage.getItem('role') || '').toLowerCase().includes('account_manager') || (localStorage.getItem('role') || '').toLowerCase().includes('accountant')) && formData.warehouse_id ? (
                                        <div className="form-input bg-gray-50 border-gray-200 font-black uppercase text-xs h-10 flex items-center">
                                            {warehouses.find(w => w.id === formData.warehouse_id)?.name || 'Fetching Location...'}
                                        </div>
                                    ) : (
                                        <select id="warehouse_id" className="form-select font-semibold" value={formData.warehouse_id} onChange={handleFormChange} required>
                                            <option value="">Select Location</option>
                                            {warehouses.map(w => (
                                                <option key={w.id || w._id} value={w.id || w._id}>
                                                    {w.name} ({w.type})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="supplier_id" className="text-xs font-bold uppercase mb-1 block flex justify-between items-center">
                                        Supplier *
                                        <button type="button" className="text-primary hover:underline lowercase font-normal text-[10px]" onClick={() => setFormData(prev => ({ ...prev, is_new_supplier: !prev.is_new_supplier }))}>
                                            {formData.is_new_supplier ? 'Select Existing' : '+ Add New'}
                                        </button>
                                    </label>
                                    {!formData.is_new_supplier ? (
                                        <select id="supplier_id" className="form-select font-semibold" value={formData.supplier_id} onChange={handleFormChange} required={!formData.is_new_supplier}>
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <div className="space-y-2 p-3 bg-gray-50 dark:bg-dark-light/10 rounded-lg border border-dashed border-gray-200">
                                            <input id="new_supplier_name" type="text" placeholder="Name" className="form-input py-1.5 text-xs" value={formData.new_supplier_name} onChange={handleFormChange} required />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input id="new_supplier_email" type="email" placeholder="Email" className="form-input py-1.5 text-xs" value={formData.new_supplier_email} onChange={handleFormChange} required />
                                                <input id="new_supplier_phone" type="text" placeholder="Phone" className="form-input py-1.5 text-xs" value={formData.new_supplier_phone} onChange={handleFormChange} required />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="text-xs font-bold uppercase mb-1 block">Purchase Notes</label>
                                    <textarea id="notes" rows={2} className="form-textarea" placeholder="Add any details..." value={formData.notes} onChange={handleFormChange}></textarea>
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

                            <div className="space-y-4">
                                {orderItems.map((item, index) => (
                                    <div key={index} className={`flex flex-col p-4 bg-white dark:bg-[#0e1726] border-2 rounded-2xl transition-all shadow-md ${item.product_id ? 'border-success/30 bg-success/5' : 'border-gray-100 dark:border-gray-800'}`}>
                                        
                                        {/* Row Line 1: Primary Search & Identity */}
                                        <div className="flex items-center gap-5 mb-4 pb-4 border-b border-gray-50 dark:border-gray-900/40">
                                            <div className="w-12 h-12 flex-shrink-0 bg-gray-50 dark:bg-black/20 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shadow-inner">
                                                {item.image ? (
                                                    <img src={item.image} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <IconBox className="w-6 h-6 text-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Barcode Identification</span>
                                                    {item.isSearching && <span className="animate-spin rounded-full border-2 border-primary border-l-transparent w-2.5 h-2.5" />}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Scan / Enter UTC ID" 
                                                        autoFocus={index === 0}
                                                        readOnly={!!item.product_id}
                                                        className={`form-input h-9 py-2 px-3 text-xs font-black tracking-widest rounded-xl transition-all w-full max-w-sm ${item.product_id ? 'bg-transparent border-none text-primary p-0' : 'bg-gray-50 border-gray-200 focus:border-primary shadow-sm'}`} 
                                                        value={item.utc || ''} 
                                                        onChange={(e) => {
                                                            const newItems = [...orderItems];
                                                            newItems[index].utc = e.target.value;
                                                            setOrderItems(newItems);
                                                        }}
                                                    />
                                                    {item.name && (
                                                        <div className="bg-white dark:bg-black px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-gray-700 dark:text-gray-200 uppercase truncate max-w-[200px]">{item.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">Net Subtotal</span>
                                                    <span className="text-xl font-black text-primary block leading-none">₹{item.subtotal.toFixed(2)}</span>
                                                </div>
                                                <button type="button" className="w-10 h-10 rounded-2xl bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all shadow-sm flex items-center justify-center border border-danger/5" onClick={() => removeItem(index)}>
                                                    <IconTrashLines className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row Line 2: Financial Details - Zero Overlap Layout */}
                                        <div className="flex flex-wrap items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Cost ₹
                                                    </label>
                                                    <input type="number" className="form-input h-10 w-full text-center text-xs font-black rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-black transition-all focus:border-primary" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                                </div>
                                                <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                                        <span className="w-1.5 h-1.5 bg-success rounded-full" /> Sell ₹
                                                    </label>
                                                    <input type="number" className="form-input h-10 w-full text-center text-xs font-black rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-black transition-all focus:border-success" value={item.sell_price} onChange={(e) => handleItemChange(index, 'sell_price', e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Tax Percentages (Individual GST Buckets)</label>
                                                <div className="flex items-center p-1.5 bg-gray-50/50 dark:bg-black/40 rounded-2xl gap-2 border border-gray-100 dark:border-gray-800 shadow-inner">
                                                    {[
                                                        { label: 'CGST%', field: 'cgst' },
                                                        { label: 'SGST%', field: 'sgst' },
                                                        { label: 'IGST%', field: 'igst' },
                                                        { label: 'CESS%', field: 'cess' }
                                                    ].map((tax, tidx) => (
                                                        <div key={tax.field} className={`flex flex-col items-center flex-1 ${tidx > 0 ? 'border-l border-gray-200 dark:border-gray-800' : ''}`}>
                                                            <span className="text-[7px] font-bold text-gray-500 uppercase mb-1">{tax.label}</span>
                                                            <input type="number" className="form-input h-6 w-full p-0 text-center text-[10px] font-black rounded-lg border-transparent hover:border-gray-300 focus:bg-white" value={item[tax.field as keyof typeof item]} onChange={(e) => handleItemChange(index, tax.field, e.target.value)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Purchase Qty</label>
                                                <div className="flex items-center w-full h-10 bg-white dark:bg-black rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                                    <button type="button" className="w-10 h-full hover:bg-gray-50 text-gray-400 font-bold border-r border-gray-100 dark:border-gray-800 text-lg" onClick={() => handleItemChange(index, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))}>−</button>
                                                    <input type="number" className="bg-transparent text-sm text-center font-black w-full outline-none p-0 border-none px-2" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                                    <button type="button" className="w-10 h-full hover:bg-gray-50 text-gray-400 font-bold border-l border-gray-100 dark:border-gray-800 text-lg" onClick={() => handleItemChange(index, 'quantity', (Number(item.quantity) || 0) + 1)}>+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3 Width) */}
                    <div className="space-y-6">
                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2 text-gray-700 dark:text-white-light">Order Summary</h6>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="status" className="text-xs font-bold uppercase mb-1 block">Purchase Status</label>
                                    <select id="status" className="form-select font-semibold" value={formData.status} onChange={handleFormChange}>
                                        <option value="received">Received</option>
                                        <option value="pending">Pending</option>
                                        <option value="ordered">Ordered</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="order_tax" className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Order Tax</label>
                                        <input id="order_tax" type="number" className="form-input h-9 text-xs font-bold" value={formData.order_tax} onChange={handleFormChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="discount" className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Discount</label>
                                        <input id="discount" type="number" className="form-input h-9 text-xs font-bold" value={formData.discount} onChange={handleFormChange} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="shipping" className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Shipping Cost</label>
                                    <input id="shipping" type="number" className="form-input h-9 text-xs font-bold" value={formData.shipping} onChange={handleFormChange} />
                                </div>
                                <div className="pt-4 border-t mt-4 flex justify-between items-center px-4 bg-primary/5 py-3 rounded-xl border border-primary/10">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Grand Total</span>
                                    <span className="text-2xl font-black text-primary">₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Document Attachment</h6>
                            <div className="flex flex-col gap-3">
                                <label className="text-xs font-bold uppercase mb-1 block">Upload Invoice (PDF/Image)</label>
                                <div className="relative group overflow-hidden bg-gray-50 dark:bg-black/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all p-4 text-center cursor-pointer">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept=".pdf,image/*" />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <IconFile className="w-5 h-5" />
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-500 uppercase">{formData.invoice ? formData.invoice.name : 'Click to Upload Document'}</span>
                                        <p className="text-[9px] text-gray-400">Max size: 1MB (PDF, PNG, JPG)</p>
                                    </div>
                                </div>
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
