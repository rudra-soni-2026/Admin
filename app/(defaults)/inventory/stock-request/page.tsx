'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Select from 'react-select';
import { DataTable } from 'mantine-datatable';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconSearch from '@/components/icon/icon-search';
import IconRefresh from '@/components/icon/icon-refresh';
import IconBox from '@/components/icon/icon-box';
import IconMinus from '@/components/icon/icon-minus';
import IconPlus from '@/components/icon/icon-plus';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

const StockRequestPage = () => {
    // Basic States
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    
    // Inventory States
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    
    // Request States
    const [requestLoading, setRequestLoading] = useState(false);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Initial Fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [whResponse, storeResponse] = await Promise.all([
                callApi('/management/admin/warehouses?limit=500', 'GET'),
                callApi('/management/admin/stores?limit=500', 'GET')
            ]);

            if (whResponse?.data) {
                setWarehouses(whResponse.data.map((w: any) => ({ 
                    value: w.id, 
                    label: w.name,
                })));
            }

            if (storeResponse?.data) {
                setStores(storeResponse.data.map((s: any) => ({ 
                    value: s.id, 
                    label: s.name,
                })));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const fetchWarehouseInventory = async (warehouseId: string) => {
        try {
            setInventoryLoading(true);
            const response = await callApi(`/management/admin/warehouse-inventory?warehouse_id=${warehouseId}&limit=500`, 'GET');
            if (response?.data) {
                setInventoryData(response.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWarehouse) {
            fetchWarehouseInventory(selectedWarehouse.value);
            setSelectedRecords([]);
            setQuantities({});
        } else {
            setInventoryData([]);
            setSelectedRecords([]);
            setQuantities({});
        }
    }, [selectedWarehouse]);

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleQuantityChange = (productId: string, val: number) => {
        const qty = Math.max(1, val);
        setQuantities({ ...quantities, [productId]: qty });
    };

    const handleRequest = async () => {
        if (!selectedWarehouse || !selectedStore) {
            showMessage('Warehouse aur Store select karna zaroori hai.', 'error');
            return;
        }

        const validRecords = selectedRecords;
        if (validRecords.length === 0) {
            showMessage('Kam se kam ek product select karein.', 'error');
            return;
        }

        try {
            setRequestLoading(true);
            const items = validRecords.map(record => ({
                product_id: record.product_id,
                quantity: quantities[record.product_id] || 1,
                product_name: record.product?.name || 'N/A',
                product_image: record.product?.image || ''
            }));

            const payload = {
                source_warehouse_id: selectedWarehouse.value,
                destination_store_id: selectedStore.value,
                items
            };

            const response = await callApi('/management/admin/stock-request', 'POST', payload);
            
            if (response?.success) {
                showMessage('Stock request successfully bhej di gayi hai.', 'success');
                setTimeout(() => {
                    window.location.href = '/inventory/transfer';
                }, 1500);
            } else {
                showMessage(response?.message || 'Kuch galti hui.', 'error');
            }
        } catch (error: any) {
            showMessage(error?.message || 'Something went wrong.', 'error');
        } finally {
            setRequestLoading(false);
        }
    };

    const filteredInventory = inventoryData.filter(item => 
        item.product?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Request For Stock</h1>
                    <p className="text-gray-500 text-sm font-medium italic">Store Manager: Raise a request to get stock from warehouse.</p>
                </div>
                <Link href="/inventory/transfer" className="btn btn-outline-primary shadow-sm gap-2">
                    <IconArrowBackward className="w-4 h-4" />
                    Back to History
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel border-none shadow-sm bg-white/60 backdrop-blur-md">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Selection Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black mb-1 block uppercase tracking-widest text-gray-400">Target Store (Pulls to)</label>
                                <Select
                                    placeholder="Select your store"
                                    options={stores}
                                    value={selectedStore}
                                    onChange={(val) => setSelectedStore(val)}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black mb-1 block uppercase tracking-widest text-gray-400">Source Warehouse (Request From)</label>
                                <Select
                                    placeholder="Which warehouse has stock?"
                                    options={warehouses}
                                    value={selectedWarehouse}
                                    onChange={(val) => setSelectedWarehouse(val)}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="panel min-h-[400px] border-none shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Select Product Items
                            </h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search warehouse stock..."
                                    className="form-input py-2 ltr:pl-10 rtl:pr-10 bg-gray-50 border-none shadow-inner"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <IconSearch className="w-4 h-4 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 opacity-30" />
                            </div>
                        </div>

                        {selectedWarehouse ? (
                            <div className="datatables">
                                <DataTable
                                    className="table-hover whitespace-nowrap"
                                    records={filteredInventory}
                                    columns={[
                                        {
                                            accessor: 'product',
                                            title: 'Product',
                                            render: ({ product }: any) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 overflow-hidden rounded-lg shrink-0 border border-gray-100 shadow-sm bg-gray-50 p-1">
                                                        <img src={product?.image || '/assets/images/profile-1.jpeg'} alt="" className="h-full w-full object-contain" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs">{product?.name || 'N/A'}</span>
                                                        <span className="text-[9px] text-primary font-black uppercase tracking-wider">{product?.unit_label || 'NO UNIT'}</span>
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            accessor: 'qty',
                                            title: 'Request Qty',
                                            textAlignment: 'center',
                                            render: (record: any) => {
                                                const isSelected = selectedRecords.some(r => r.product_id === record.product_id);
                                                if (!isSelected) return <span className="text-[10px] text-gray-300 font-bold uppercase">Not Selected</span>;
                                                const qty = quantities[record.product_id] || 1;
                                                return (
                                                    <div className="flex items-center justify-center gap-1 border rounded-lg p-0.5 bg-gray-50 min-w-[100px] scale-90 mx-auto">
                                                        <button 
                                                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white transition-all shadow-sm"
                                                            onClick={() => handleQuantityChange(record.product_id, qty - 1)}
                                                        >
                                                            <IconMinus className="w-3 h-3 text-danger" />
                                                        </button>
                                                        <input 
                                                            type="number"
                                                            className="w-10 text-center font-black text-xs bg-transparent border-none p-0 focus:ring-0"
                                                            value={qty}
                                                            onChange={(e) => handleQuantityChange(record.product_id, parseInt(e.target.value) || 0)}
                                                        />
                                                        <button 
                                                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white transition-all shadow-sm"
                                                            onClick={() => handleQuantityChange(record.product_id, qty + 1)}
                                                        >
                                                            <IconPlus className="w-3 h-3 text-success" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        }
                                    ]}
                                    fetching={inventoryLoading}
                                    selectedRecords={selectedRecords}
                                    onSelectedRecordsChange={(recs) => setSelectedRecords(recs)}
                                    minHeight={250}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="bg-white p-4 rounded-full shadow-md mb-2">
                                    <IconBox className="w-8 h-8 text-primary/40" />
                                </div>
                                <p className="font-bold text-gray-500">Pick a Source Warehouse first.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel bg-[#1a1a1a] text-white shadow-2xl border-none p-6 rounded-2xl">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <IconBox className="w-6 h-6 text-primary" />
                            Request Card
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">From</span>
                                    <span className="font-bold truncate max-w-[150px]">{selectedWarehouse?.label || '---'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">To</span>
                                    <span className="font-bold truncate max-w-[150px] text-primary">{selectedStore?.label || '---'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-4 bg-white/5 rounded-xl px-4 border border-white/5">
                                <span className="font-bold">Items:</span>
                                <span className="text-2xl font-black text-primary uppercase">{selectedRecords.length}</span>
                            </div>

                            <button
                                onClick={handleRequest}
                                disabled={requestLoading || selectedRecords.length === 0}
                                className="btn btn-primary w-full py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {requestLoading ? 'Sending...' : 'Raise Request Now'}
                            </button>
                        </div>
                    </div>

                    <div className="panel border-none shadow-sm shadow-primary/5 bg-primary/5">
                        <h4 className="font-black text-primary mb-3 text-[11px] uppercase tracking-widest">Info Tip</h4>
                        <p className="text-xs font-semibold text-primary/70 leading-relaxed italic">
                            Ye request Warehouse Manager ko dikhegi. Unke approve karte hi stock aapke store mein transfer ho jayega.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockRequestPage;
