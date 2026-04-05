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
        { utc: '', product_id: '', name: '', hsn: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }
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

    useEffect(() => {
        if (warehouses.length > 0) {
            const userDataStr = localStorage.getItem('userData');
            const storedRole = localStorage.getItem('role');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const userRole = (storedRole || userData.role || '').toLowerCase().replace(' ', '_');
                const assignedId = userData.assignedId || userData.assigned_id || userData.warehouse_id || userData.assigned_warehouse_id;
                if ((userRole.includes('account_manager') || userRole.includes('accountant')) && assignedId) {
                    setFormData(prev => {
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
        setOrderItems([{ utc: '', product_id: '', name: '', hsn: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }, ...orderItems]);
    };

    const removeItem = (index: number) => {
        let newItems = [...orderItems];
        newItems.splice(index, 1);
        if (newItems.length === 0) {
            newItems = [{ utc: '', product_id: '', name: '', hsn: '', image: '', price: 0, sell_price: 0, quantity: 1, cgst: 0, sgst: 0, igst: 0, cess: 0, subtotal: 0, isSearching: false, searchedUtc: '' }];
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
                const finalItem = {
                    ...updatedItems[index],
                    product_id: product._id || product.id,
                    name: product.name || variant.unit_label || 'Unnamed Item',
                    hsn: product.hsn || product.hsn_code || variant.hsn || '',
                    image: product.image || variant.image || '/assets/images/profile-1.jpeg',
                    price: variant.original_price || product.original_price || 0,
                    sell_price: variant.price || product.price || 0,
                    isSearching: false
                };
                finalItem.subtotal = calculateSubtotal(finalItem);
                updatedItems[index] = finalItem;
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

    const calculateSubtotal = (item: any) => {
        const cost = Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        const base = cost * qty;
        const cgst = Number(item.cgst) || 0;
        const sgst = Number(item.sgst) || 0;
        const igst = Number(item.igst) || 0;
        const cess = Number(item.cess) || 0;
        const taxAmount = base * (cgst + sgst + igst + cess) / 100;
        return base + taxAmount;
    };

    const getLandedCost = (item: any) => {
        const cost = Number(item.price) || 0;
        const cgst = Number(item.cgst) || 0;
        const sgst = Number(item.sgst) || 0;
        const igst = Number(item.igst) || 0;
        const cess = Number(item.cess) || 0;
        const taxAmount = cost * (cgst + sgst + igst + cess) / 100;
        return cost + taxAmount;
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;

        const landed = getLandedCost(newItems[index]);

        // Auto-calculate Sell Price if Margin changes (Based on Landed Cost)
        if (field === 'margin' || field === 'price' || field === 'cgst' || field === 'sgst' || field === 'igst' || field === 'cess') {
            const margin = Number(newItems[index].margin) || 0;
            if (margin > 0) {
                newItems[index].sell_price = (landed * (1 + margin / 100)).toFixed(2);
            }
        }

        // Auto-calculate Margin if Sell Price is manually changed (Against Landed Cost)
        if (field === 'sell_price') {
            const sell = Number(value) || 0;
            if (landed > 0 && sell > 0) {
                newItems[index].margin = (((sell - landed) / landed) * 100).toFixed(1);
            }
        }

        if (field === 'utc' && (value.length >= 8 && value.length <= 16)) {
            fetchProductByUtc(value, index);
        }
        newItems[index].subtotal = calculateSubtotal(newItems[index]);
        setOrderItems(newItems);
    };

    const calculateGrandTotal = () => {
        const itemsTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
        return itemsTotal + Number(formData.shipping) - Number(formData.discount);
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
            let invoiceUrl = '';
            if (formData.invoice) {
                if (formData.invoice.size > 1024 * 1024) {
                    showMessage('Invoice file size exceeds 1MB limit.', 'danger');
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
                tax_amount: 0,
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
                    hsn: item.hsn,
                    margin_percent: Number(item.margin),
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
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/purchase/list" className="text-primary hover:underline">Purchase Management</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Create Purchase</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-6">
                <h5 className="text-lg font-bold dark:text-white-light">Create New Purchase Order</h5>
                <Link href="/purchase/list" className="btn btn-outline-primary shadow-none btn-sm uppercase font-bold">
                    <IconArrowBackward className="h-4 w-4 mr-2" /> Back
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Metadata Top Panel - Full Width */}
                <div className="panel p-4 border-none shadow-sm dark:bg-[#0e1726]">
                    <h6 className="text-[11px] font-extrabold uppercase mb-3 text-primary tracking-wider border-b pb-1.5">Purchase Order Details</h6>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="date" className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Date *</label>
                            <input id="date" type="date" className="form-input h-9 text-xs" value={formData.date} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <label htmlFor="reference_no" className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Ref No</label>
                            <input id="reference_no" type="text" placeholder="PO-00001" className="form-input h-9 text-xs" value={formData.reference_no} onChange={handleFormChange} />
                        </div>
                        <div>
                            <label htmlFor="warehouse_id" className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Delivery Location *</label>
                            {((localStorage.getItem('role') || '').toLowerCase().includes('account_manager') || (localStorage.getItem('role') || '').toLowerCase().includes('accountant')) && formData.warehouse_id ? (
                                <div className="form-input h-9 bg-gray-50 text-[10px] flex items-center text-primary font-bold">{warehouses.find(w => (w.id === formData.warehouse_id || w._id === formData.warehouse_id))?.name || '...'}</div>
                            ) : (
                                <select id="warehouse_id" className="form-select h-9 text-xs" value={formData.warehouse_id} onChange={handleFormChange} required>
                                    <option value="">Select Location</option>
                                    {warehouses.map(w => <option key={w.id || w._id} value={w.id || w._id}>{w.name}</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label htmlFor="supplier_id" className="text-[10px] font-bold text-gray-500 uppercase mb-1 block flex justify-between">
                                Supplier *
                                <button type="button" className="text-primary hover:underline lowercase text-[9px]" onClick={() => setFormData(prev => ({ ...prev, is_new_supplier: !prev.is_new_supplier }))}>
                                    {formData.is_new_supplier ? 'Existing' : '+ Add'}
                                </button>
                            </label>
                            {!formData.is_new_supplier ? (
                                <select id="supplier_id" className="form-select h-9 text-xs" value={formData.supplier_id} onChange={handleFormChange} required={!formData.is_new_supplier}>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name.toUpperCase()}</option>)}
                                </select>
                            ) : (
                                <div className="space-y-1 p-1 bg-gray-50 dark:bg-black/20 rounded border border-dashed flex gap-1">
                                    <input id="new_supplier_name" type="text" placeholder="Name" className="form-input h-7 text-[10px] flex-1" value={formData.new_supplier_name} onChange={handleFormChange} required />
                                    <input id="new_supplier_email" type="email" placeholder="Email" className="form-input h-7 text-[10px] flex-1" value={formData.new_supplier_email} onChange={handleFormChange} required />
                                    <input id="new_supplier_phone" type="text" placeholder="Phone" className="form-input h-7 text-[10px] flex-1" value={formData.new_supplier_phone} onChange={handleFormChange} required />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Items Panel - Horizontal Scroll Support */}
                <div className="panel p-0 border-none shadow-sm dark:bg-[#0e1726] overflow-x-auto custom-scrollbar">
                    <div className="flex items-center justify-between p-3 border-b">
                        <h6 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <IconListCheck className="h-4 w-4" />
                            Inventory Management
                        </h6>
                        <button type="button" className="text-[10px] font-black hover:underline uppercase text-primary" onClick={addItem}>
                            + Add New Row
                        </button>
                    </div>

                    {/* Professional High-Density Header - 11 Column Unified Layout */}
                    <div className="grid grid-cols-[40px_100px_1fr_65px_85px_55px_85px_65px_240px_90px_40px] gap-2 px-4 py-2 bg-gray-50 dark:bg-black/20 border-b text-[8px] font-black text-gray-400 uppercase tracking-tighter items-center">
                        <div className="text-center">IMG</div>
                        <div className="pl-1">BARCODE</div>
                        <div className="text-left">PRODUCT NAME</div>
                        <div className="text-center">HSN</div>
                        <div className="text-center">COST (UNIT)</div>
                        <div className="text-center">MARGIN</div>
                        <div className="text-center">SELL (UNIT)</div>
                        <div className="text-center">QTY</div>
                        <div className="text-center">GST RATE & DETAILS (PER UNIT)</div>
                        <div className="text-right">TOTAL</div>
                        <div className="text-center"></div>
                    </div>

                    <div className="p-1">
                        {orderItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-[40px_100px_1fr_65px_85px_55px_85px_65px_240px_90px_40px] gap-2 px-3 py-2 bg-white dark:bg-black/10 border-b border-gray-100 last:border-b-0 items-center transition-all hover:bg-gray-50/50">
                                {/* Img */}
                                <div className="w-10 h-10 bg-gray-100/50 rounded flex items-center justify-center border border-gray-100 p-1">
                                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain" /> : <IconBox className="w-4 h-4 text-gray-300" />}
                                </div>

                                {/* Barcode */}
                                <input type="text" placeholder="Code" readOnly={!!item.product_id}
                                    className={`form-input h-8 py-0 px-2 text-[10px] font-black rounded-md border-gray-100 ${item.product_id ? 'bg-transparent border-transparent' : 'bg-gray-50 focus:bg-white'}`}
                                    value={item.utc || ''} onChange={(e) => handleItemChange(index, 'utc', e.target.value)} />

                                {/* Product Name */}
                                <div className="flex flex-col min-w-0">
                                    <input type="text" placeholder="Product..." 
                                        readOnly={!!item.product_id}
                                        className={`form-input h-8 py-0 px-2 text-[11px] font-black rounded-md border-gray-100 truncate ${item.product_id ? 'bg-transparent border-transparent' : 'bg-gray-50 focus:bg-white text-primary'}`}
                                        value={item.name || ''} 
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)} 
                                    />
                                </div>

                                {/* HSN */}
                                <input type="text" placeholder="HSN"
                                    className="form-input h-8 py-0 px-1 text-center text-[10px] font-bold rounded-md border-gray-100 bg-gray-50 uppercase"
                                    value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />

                                {/* Cost (Unit) */}
                                <div className="flex flex-col relative group/cost pt-0">
                                    <div className="absolute -top-1.5 left-0 right-0 text-center pointer-events-none">
                                        <span className="text-[7.5px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-1 rounded-sm border border-primary/10">Net:₹{getLandedCost(item).toFixed(0)}</span>
                                    </div>
                                    <input type="text" 
                                        className="form-input h-8 px-1 text-center text-[11px] font-black rounded-md border-gray-100 bg-white hover:border-primary/40 shadow-sm" 
                                        value={item.price || ''} 
                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)} 
                                    />
                                </div>

                                {/* Margin */}
                                <div className="relative text-center">
                                    <input type="text" placeholder="%" 
                                        className="form-input h-8 text-center text-[11px] font-black rounded-md border-primary/10 bg-primary/5 shadow-inner"
                                        value={item.margin || ''} 
                                        onChange={(e) => handleItemChange(index, 'margin', e.target.value)} 
                                    />
                                </div>

                                {/* Sell (Unit) */}
                                <div className="relative">
                                    <input type="text" 
                                        className="form-input h-8 px-1 text-center text-[11px] font-black rounded-md border-gray-100 bg-white hover:border-primary/40 shadow-sm" 
                                        value={item.sell_price || ''} 
                                        onChange={(e) => handleItemChange(index, 'sell_price', e.target.value)} 
                                    />
                                </div>

                                {/* Qty */}
                                <div className="flex items-center h-8 bg-gray-100/50 rounded-md border border-gray-100 overflow-hidden">
                                    <input type="text" className="bg-transparent text-[11px] text-center font-black w-full outline-none" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                </div>

                                {/* GST Unified Line Box */}
                                <div className="flex gap-1.5 p-1.5 bg-gray-50/50 dark:bg-black/40 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-primary/20">
                                    {['cgst', 'sgst', 'igst', 'cess'].map((tax) => {
                                        const unitTax = (Number(item.price) * Number(item[tax as keyof typeof item])) / 100;
                                        return (
                                            <div key={tax} className="flex flex-col relative group/tax pt-0 flex-1 min-w-0">
                                                <div className="absolute -top-3 left-0 right-0 text-center pointer-events-none">
                                                    <span className="text-[6.5px] font-black text-gray-400 uppercase tracking-tighter bg-white px-0.5 rounded border border-gray-100 leading-none">{tax}</span>
                                                </div>
                                                <input type="text"
                                                    className="form-input h-7 px-0 text-center text-[10px] font-black rounded-lg border-gray-100 bg-white focus:border-primary shadow-xs transition-all"
                                                    value={item[tax as keyof typeof item] || ''}
                                                    onChange={(e) => handleItemChange(index, tax, e.target.value)} 
                                                />
                                                <span className="absolute -bottom-1.5 left-0 right-0 text-center text-[6px] font-black text-primary/60 opacity-0 group-hover/tax:opacity-100 transition-opacity">₹{unitTax.toFixed(1)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Line Total */}
                                <div className="text-right flex flex-col items-end pr-1">
                                    <span className="text-[13px] font-black text-primary tracking-tighter leading-none">₹{item.subtotal.toFixed(0)}</span>
                                    <span className="text-[5.5px] font-black text-gray-300 uppercase mt-0.5">Subtotal</span>
                                </div>

                                {/* Delete */}
                                <div className="flex justify-center">
                                    <button type="button" className="w-7 h-7 rounded-full hover:bg-danger/10 text-danger flex items-center justify-center transition-all group" onClick={() => removeItem(index)}>
                                        <IconTrashLines className="w-4 h-4 group-hover:scale-125" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Summary & Documentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Notes & File - Left */}
                    <div className="space-y-4">
                        <div className="panel p-3 border-none shadow-sm dark:bg-[#0e1726]">
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase mb-2 block border-b pb-1">Attachments & Notes</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <div className="relative group overflow-hidden bg-gray-50 dark:bg-black/20 rounded border border-dashed p-3 h-20 flex flex-col items-center justify-center">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept=".pdf,image/*" />
                                    <IconFile className="w-5 h-5 text-primary opacity-50 mb-1" />
                                    <span className="text-[9px] font-bold text-gray-500 uppercase truncate w-full text-center">
                                        {formData.invoice ? formData.invoice.name : 'Upload Invoice'}
                                    </span>
                                    {formData.invoice && (
                                        <button type="button" className="text-[8px] text-danger font-bold uppercase mt-1 z-20" onClick={() => setFormData(prev => ({ ...prev, invoice: null }))}>[Remove]</button>
                                    )}
                                </div>
                                <textarea id="notes" rows={4} className="form-textarea py-2 text-xs h-20" placeholder="Internal purchase notes..." value={formData.notes} onChange={handleFormChange}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Status & Totals - Right */}
                    <div className="panel p-4 border-none shadow-sm dark:bg-[#0e1726]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="status" className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Purchase Status</label>
                                    <select id="status" className="form-select h-8 text-[11px] font-bold uppercase" value={formData.status} onChange={handleFormChange}>
                                        <option value="received">Received</option>
                                        <option value="pending">Pending</option>
                                        <option value="ordered">Ordered</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <div className="bg-primary/5 rounded border p-3 flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest leading-none mb-1">Grand Total</span>
                                        <span className="text-2xl font-black text-primary">₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 border-l pl-4 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Discount</span>
                                    <input id="discount" type="string" className="form-input h-7 w-24 text-xs text-right font-bold" value={formData.discount} onChange={handleFormChange} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Shipping</span>
                                    <input id="shipping" type="string" className="form-input h-7 w-24 text-xs text-right font-bold" value={formData.shipping} onChange={handleFormChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel sticky bottom-0 z-10 flex justify-end gap-3 shadow-none mt-4 border-t py-3 bg-white/90 dark:bg-black/90">
                    <button type="button" className="btn btn-outline-danger px-6 uppercase font-bold text-[10px]" onClick={() => router.push('/purchase/list')}>Discard</button>
                    <button type="submit" className="btn btn-primary px-8 h-9 uppercase font-bold text-[10px] flex items-center gap-2" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3 h-3" /> : <IconSave className="w-3 h-3" />}
                        {loading ? 'Processing...' : 'Save Purchase'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPurchase;
