'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Select from 'react-select';
import { DataTable } from 'mantine-datatable';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconMinus from '@/components/icon/icon-minus';
import IconPlus from '@/components/icon/icon-plus';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconBox from '@/components/icon/icon-box';
import moment from 'moment';

const StockRequestPage = () => {
    // Basic States
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [storedRole, setStoredRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);

    // Inventory States
    const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
    const [storeInventory, setStoreInventory] = useState<any[]>([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    
    // Request States
    const [requestLoading, setRequestLoading] = useState(false);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Initial Fetch
    useEffect(() => {
        fetchInitialData();
        const role = localStorage.getItem('role');
        const userString = localStorage.getItem('userData');
        if (role) setStoredRole(role);
        if (userString) {
            try { setUserData(JSON.parse(userString)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (storedRole && userData && (warehouses.length > 0 || stores.length > 0)) {
            const assignedId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || userData.warehouseId || userData.warehouse_id;

            if (storedRole === 'store_manager' && stores.length > 0) {
                const myStore = stores.find(s => String(s.value) === String(assignedId));
                if (myStore) setSelectedStore(myStore);
            } else if (storedRole === 'warehouse_manager' && warehouses.length > 0) {
                const myWh = warehouses.find(w => String(w.value) === String(assignedId));
                if (myWh) setSelectedWarehouse(myWh);
            }
        }
    }, [storedRole, userData, warehouses, stores]);

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

    const fetchComparisonInventory = async (warehouseId: string, storeId: string) => {
        try {
            setInventoryLoading(true);
            const [whResp, stResp] = await Promise.all([
                callApi(`/management/admin/warehouse-inventory?warehouse_id=${warehouseId}&limit=1000`, 'GET'),
                callApi(`/management/admin/inventory?storeId=${storeId}&limit=1000`, 'GET') 
            ]);
            
            if (whResp?.data) setWarehouseInventory(whResp.data);
            if (stResp?.data) setStoreInventory(stResp.data);
        } catch (error) {
            console.error('Error fetching comparison:', error);
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWarehouse && selectedStore) {
            fetchComparisonInventory(selectedWarehouse.value, selectedStore.value);
        }
    }, [selectedWarehouse, selectedStore]);

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
        const qty = Math.max(0, val);
        setQuantities({ ...quantities, [productId]: qty });
    };

    const handleRequest = async () => {
        if (!selectedWarehouse || !selectedStore) {
            showMessage('Select Warehouse & Store first.', 'error');
            return;
        }

        if (selectedRecords.length === 0) {
            showMessage('Select at least one product.', 'error');
            return;
        }

        try {
            setRequestLoading(true);
            const items = selectedRecords.map(record => ({
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

            const response = await callApi('/management/admin/inventory-transfers', 'POST', payload);

            if (response?.status === 'success') {
                showMessage('Stock Transfer initiated successfully.', 'success');
                setTimeout(() => {
                    window.location.href = '/inventory/transfer';
                }, 1500);
            } else {
                showMessage(response?.message || 'Error occurred.', 'error');
            }
        } catch (error: any) {
            showMessage(error?.message || 'Something went wrong.', 'error');
        } finally {
            setRequestLoading(false);
        }
    };

    const getStoreStock = (productId: string) => {
        const item = storeInventory.find(i => String(i.productId) === String(productId));
        return item ? (item.stockCount || 0) : 0;
    };

    const filteredInventory = warehouseInventory.filter(item =>
        item.product?.name?.toLowerCase().includes(search.toLowerCase())
    ).map(item => ({
        ...item,
        store_stock: getStoreStock(item.product_id)
    }));

    const columns = [
        {
            accessor: 'product',
            title: 'Product',
            render: ({ product, product_id }: any) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded bg-gray-50 border shrink-0">
                        <img src={product?.image || '/assets/images/profile-1.jpeg'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                        <div className="text-sm font-black text-black uppercase tracking-tighter">{product?.name || 'Product'}</div>
                        <div className="text-[10px] font-bold text-gray-400">ID: {product_id?.slice(-8)}</div>
                    </div>
                </div>
            )
        },
        {
            accessor: 'stock_count',
            title: 'W.House Stock',
            textAlignment: 'center',
            render: (record: any) => (
                <span className={`text-base font-black ${record.stock_count <= 2 ? 'text-danger animate-pulse' : 'text-gray-600'}`}>
                    {record.stock_count}
                </span>
            )
        },
        {
            accessor: 'store_stock',
            title: 'Current Store',
            textAlignment: 'center',
            render: (record: any) => (
                <span className={`text-base font-bold ${record.store_stock <= 2 ? 'text-warning' : 'text-success'}`}>
                    {record.store_stock}
                </span>
            )
        },
        {
            accessor: 'qty',
            title: 'Send Qty',
            textAlignment: 'center',
            render: (record: any) => {
                const isSelected = selectedRecords.some(r => r.product_id === record.product_id);
                if (!isSelected) return <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Select to Edit</span>;
                const qty = quantities[record.product_id] || 0;
                return (
                    <div className="flex items-center justify-center gap-1 bg-white border-2 border-primary/20 rounded-lg p-1 scale-90 mx-auto w-32 shadow-sm">
                        <button onClick={() => handleQuantityChange(record.product_id, qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-danger/10 rounded text-danger"><IconMinus className="w-4 h-4" /></button>
                        <input type="number" className="w-12 text-center font-black border-none bg-transparent p-0 focus:ring-0" value={qty} onChange={(e) => handleQuantityChange(record.product_id, parseInt(e.target.value) || 0)} />
                        <button onClick={() => handleQuantityChange(record.product_id, qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-success/10 rounded text-success"><IconPlus className="w-4 h-4" /></button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight">Stock Fulfillment Dashboard</h1>
                    <p className="text-sm font-bold text-gray-500 italic tracking-widest">Compare levels and move stock from warehouse to stores</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel border-none shadow-sm rounded-3xl bg-white/60 backdrop-blur-md p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">1. Select Destination Store</label>
                                <Select options={stores} value={selectedStore} isDisabled={storedRole === 'store_manager'} onChange={setSelectedStore} placeholder="Choose Target Store" className="font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">2. Select Source Warehouse</label>
                                <Select options={warehouses} value={selectedWarehouse} isDisabled={storedRole === 'warehouse_manager'} onChange={setSelectedWarehouse} placeholder="Choose Source Warehouse" className="font-bold" />
                            </div>
                        </div>

                        {selectedWarehouse && selectedStore ? (
                            <div className="animate__animated animate__fadeIn">
                                <div className="flex items-center justify-between mb-6">
                                    <h6 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <IconBox className="w-4 h-4" /> inventory Comparison
                                    </h6>
                                    <div className="relative">
                                        <input type="text" placeholder="Search products..." className="form-input py-2 ltr:pl-10 rtl:pr-10 w-64 text-xs font-bold border-none bg-gray-100 rounded-full" value={search} onChange={(e) => setSearch(e.target.value)} />
                                        <IconBox className="w-4 h-4 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 opacity-20" />
                                    </div>
                                </div>
                                <div className="datatables bg-white/40 rounded-2xl overflow-hidden">
                                    <DataTable
                                        records={filteredInventory}
                                        columns={columns as any}
                                        fetching={inventoryLoading}
                                        selectedRecords={selectedRecords}
                                        onSelectedRecordsChange={setSelectedRecords}
                                        minHeight={400}
                                        withBorder={false}
                                        borderRadius="xl"
                                        className="table-hover"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                                <div className="p-6 bg-white rounded-full shadow-2xl mb-4 text-primary opacity-20">
                                    <IconBox className="w-16 h-16" />
                                </div>
                                <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Comparison View Locked</h3>
                                <p className="text-sm font-bold text-gray-400/60 mt-1 italic italic">Select a store and warehouse to begin fulfillment.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Command Panel */}
                <div className="space-y-4">
                    <div className="panel bg-[#111827] text-white shadow-xl border border-white/5 p-6 rounded-[2rem] sticky top-24 overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Dispatch</h3>
                                <div className="h-1 w-8 bg-primary rounded-full"></div>
                            </div>
                            <IconBox className="w-6 h-6 text-primary opacity-30" />
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-xl bg-success/20 flex items-center justify-center text-success text-[10px] font-bold italic">TO</div>
                                <div className="flex-1 overflow-hidden">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none mb-1 tracking-widest">Store</span>
                                    <div className="font-bold text-xs truncate text-gray-100">{selectedStore?.label || '---'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold italic">FROM</div>
                                <div className="flex-1 overflow-hidden">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none mb-1 tracking-widest">Warehouse</span>
                                    <div className="font-bold text-xs truncate text-gray-100">{selectedWarehouse?.label || '---'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-1 mb-6">
                            <div>
                                <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">Selected Count</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-black leading-none ${selectedRecords.length > 0 ? 'text-primary' : 'text-gray-700'}`}>
                                        {selectedRecords.length}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Items</span>
                                </div>
                            </div>
                            {selectedRecords.length > 0 && (
                                <div className="bg-success/20 text-success text-[9px] font-black px-2 py-1 rounded-md border border-success/30 uppercase">
                                    Ready
                                </div>
                            )}
                        </div>

                        <button
                            disabled={selectedRecords.length === 0 || requestLoading || !selectedWarehouse || !selectedStore}
                            onClick={handleRequest}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all
                                ${selectedRecords.length === 0 
                                    ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed' 
                                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {requestLoading ? '...' : (selectedRecords.length > 0 ? 'Initiate Dispatch' : 'Choose Items')}
                        </button>
                    </div>

                    <div className="panel border-none shadow-sm bg-primary/5 p-6 rounded-3xl">
                        <h4 className="font-black text-primary mb-2 text-xs uppercase italic tracking-widest">Efficiency Tip</h4>
                        <p className="text-[11px] font-bold text-primary/70 leading-relaxed italic">
                            Red blinking items in W.House indicate critical shortages. Ensure you don't exhaust warehouse stock beyond minimum safety levels.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockRequestPage;
