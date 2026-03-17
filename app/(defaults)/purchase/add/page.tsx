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
        { utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, subtotal: 0, isSearching: false, searchedUtc: '' }
    ]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [sRes, wRes, stRes] = await Promise.all([
                callApi('/management/admin/suppliers', 'GET'),
                callApi('/management/admin/warehouse-inventory', 'GET'),
                callApi('/management/admin/store-inventory', 'GET')
            ]);

            if (sRes?.data) setSuppliers(sRes.data);
            
            const combinedLocations = [
                ...(Array.isArray(wRes?.data) ? wRes.data.map((i: any) => ({ 
                    id: i.warehouse_id || i.warehouse?.id || i.id || i._id,
                    name: i.warehouse?.name || i.name || 'Unknown Warehouse',
                    type: 'Warehouse' 
                })) : []),
                ...(Array.isArray(stRes?.data) ? stRes.data.map((i: any) => ({ 
                    id: i.store_id || i.store?.id || i.id || i._id,
                    name: i.store?.name || i.name || 'Unknown Store',
                    type: 'Store' 
                })) : [])
            ];
            setWarehouses(combinedLocations);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleFormChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const addItem = () => {
        setOrderItems([{ utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, subtotal: 0, isSearching: false, searchedUtc: '' }, ...orderItems]);
    };

    const removeItem = (index: number) => {
        let newItems = [...orderItems];
        newItems.splice(index, 1);
        if (newItems.length === 0) {
            newItems = [{ utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, subtotal: 0, isSearching: false, searchedUtc: '' }];
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
            const product = res?.product || res;

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

                    const emptyItem = { utc: '', product_id: '', name: '', image: '', price: 0, sell_price: 0, quantity: 1, subtotal: 0, isSearching: false, searchedUtc: '' };
                    
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
        if (field === 'price' || field === 'quantity') {
            newItems[index].subtotal = Number(newItems[index].price) * Number(newItems[index].quantity);
        }
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
                                    <select id="warehouse_id" className="form-select font-semibold" value={formData.warehouse_id} onChange={handleFormChange} required>
                                        <option value="">Select Location</option>
                                        {warehouses.map(w => (
                                            <option key={w.id || w._id} value={w.id || w._id}>
                                                {w.name} ({w.type})
                                            </option>
                                        ))}
                                    </select>
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
                                    <label htmlFor="invoice" className="text-xs font-bold uppercase mb-1 block">Upload Invoice (PDF/Image)</label>
                                    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-light/10 rounded-lg border border-dashed border-gray-300 group hover:border-primary transition-colors cursor-pointer relative">
                                        <div className="bg-white dark:bg-black p-2 rounded-lg shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                            <IconFile className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-primary transition-colors">
                                                {formData.invoice ? 'Filename' : 'Click to upload invoice'}
                                            </p>
                                            <p className="text-xs font-bold truncate">
                                                {formData.invoice ? formData.invoice.name : 'No file selected (Optional)'}
                                            </p>
                                        </div>
                                        {formData.invoice && (
                                            <button type="button" className="text-danger hover:scale-110 p-1" onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, invoice: null })); }}>
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        )}
                                        <input
                                            id="invoice"
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept=".pdf,image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setFormData(prev => ({ ...prev, invoice: file }));
                                            }}
                                        />
                                    </div>
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
                                    <div key={index} className={`flex items-center h-13 gap-2 p-1 px-3 bg-white dark:bg-[#0e1726] border rounded-xl transition-all ${item.product_id ? 'border-success/20 bg-success/5 shadow-none' : 'border-gray-100 dark:border-gray-800'}`}>
                                        
                                        {/* 1. Medium Image */}
                                        <div className="w-9 h-9 flex-shrink-0 bg-gray-50 dark:bg-black/20 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">
                                            {item.image ? (
                                                <img src={item.image} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <IconBox className="w-5 h-5 text-gray-200" />
                                            )}
                                        </div>

                                        {/* 2. Barcode & Name */}
                                        <div className="w-40 flex-shrink-0 flex flex-col justify-center">
                                            <input 
                                                type="text" 
                                                placeholder="Scan..." 
                                                autoFocus={index === 0}
                                                readOnly={!!item.product_id}
                                                className={`form-input h-7 py-0.5 px-2 text-[11px] font-black tracking-widest rounded-lg border-gray-200 dark:border-gray-700 ${item.product_id ? 'bg-transparent border-transparent cursor-default' : 'bg-gray-50 focus:border-primary'}`} 
                                                value={item.utc || ''} 
                                                onChange={(e) => {
                                                    const newItems = [...orderItems];
                                                    newItems[index].utc = e.target.value;
                                                    setOrderItems(newItems);
                                                }}
                                            />
                                            <div className="h-3.5 flex items-center overflow-hidden pl-1 mt-0.5">
                                                {item.name ? (
                                                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase truncate block w-full">
                                                        {item.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Ready</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Controls (Compact but Readable) */}
                                        <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase">Cost</span>
                                                <input type="text" className="form-input h-8 w-14 text-center text-xs font-black rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-black" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase">Sell</span>
                                                <input type="text" className="form-input h-8 w-14 text-center text-xs font-black rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-black" value={item.sell_price} onChange={(e) => handleItemChange(index, 'sell_price', e.target.value)} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase">Qty</span>
                                                <div className="flex items-center w-20 h-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                                    <button type="button" className="w-7 h-full hover:bg-gray-50 font-bold border-r border-gray-100 dark:border-gray-800" onClick={() => handleItemChange(index, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))}>-</button>
                                                    <input type="text" className="bg-transparent text-xs text-center font-black w-full outline-none" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                                    <button type="button" className="w-7 h-full hover:bg-gray-50 font-bold border-l border-gray-100 dark:border-gray-800" onClick={() => handleItemChange(index, 'quantity', (Number(item.quantity) || 0) + 1)}>+</button>
                                                </div>
                                            </div>
                                            <div className="w-16 text-right border-l pl-3 dark:border-gray-800">
                                                <span className="text-sm font-black text-primary truncate block">₹{item.subtotal.toFixed(0)}</span>
                                            </div>
                                        </div>

                                        {/* 4. Delete (Prominent Red) */}
                                        <div className="flex-shrink-0">
                                            <button 
                                                type="button" 
                                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger border border-danger/10 hover:bg-danger hover:text-white transition-all shadow-sm" 
                                                onClick={() => removeItem(index)} 
                                                title="Delete"
                                            >
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="space-y-6">
                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Order Summary</h6>
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
                                        <label htmlFor="order_tax" className="text-xs font-bold uppercase mb-1 block">Order Tax</label>
                                        <input id="order_tax" type="number" className="form-input" value={formData.order_tax} onChange={handleFormChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="discount" className="text-xs font-bold uppercase mb-1 block">Discount</label>
                                        <input id="discount" type="number" className="form-input" value={formData.discount} onChange={handleFormChange} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="shipping" className="text-xs font-bold uppercase mb-1 block">Shipping Cost</label>
                                    <input id="shipping" type="number" className="form-input" value={formData.shipping} onChange={handleFormChange} />
                                </div>
                                <div className="pt-4 border-t mt-4 flex justify-between items-center px-4 bg-primary/5 py-4 rounded-xl border border-primary/10">
                                    <span className="text-sm font-bold uppercase text-gray-500">Grand Total</span>
                                    <span className="text-3xl font-black text-primary">₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <label htmlFor="notes" className="text-xs font-bold uppercase mb-1 block">Purchase Notes</label>
                            <textarea id="notes" rows={3} className="form-textarea" placeholder="Add any details..." value={formData.notes} onChange={handleFormChange}></textarea>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="panel sticky bottom-0 z-10 flex justify-end gap-3 shadow-xl mt-8 border-t border-gray-100 py-4 bg-white/80 backdrop-blur-md dark:bg-black/80">
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
