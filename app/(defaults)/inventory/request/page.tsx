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

const StockRequest = () => {
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
    
    // Transfer States
    const [transferLoading, setTransferLoading] = useState(false);
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
                    city: w.city,
                    capacity: w.capacity 
                })));
            }

            if (storeResponse?.data) {
                setStores(storeResponse.data.map((s: any) => ({ 
                    value: s.id, 
                    label: s.name,
                    city: s.city 
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

    const handleQuantityChange = (productId: string, val: number, max: number) => {
        const qty = Math.max(1, Math.min(val, max));
        setQuantities({ ...quantities, [productId]: qty });
    };

    const handleTransfer = async () => {
        if (!selectedWarehouse || !selectedStore) {
            Swal.fire({
                title: 'Selection Required',
                text: 'Please select both source warehouse and destination store.',
                icon: 'warning',
                confirmButtonColor: '#4361ee'
            });
            return;
        }

        if (selectedRecords.length === 0) {
            Swal.fire({
                title: 'No Products Selected',
                text: 'Request shuru karne ke liye kam se kam ek product select karein.',
                icon: 'warning',
                confirmButtonColor: '#4361ee'
            });
            return;
        }

        try {
            setTransferLoading(true);
            const items = selectedRecords.map(record => ({
                product_id: record.product_id,
                quantity: quantities[record.product_id] || 1
            }));

            const payload = {
                source_warehouse_id: selectedWarehouse.value,
                destination_store_id: selectedStore.value,
                items
            };

            const response = await callApi('/management/admin/inventory-transfer', 'POST', payload);
            
            if (response?.success) {
                Swal.fire({
                    title: 'Request Success!',
                    text: 'Inventory transfer request successfully process ho chuki hai.',
                    icon: 'success',
                    customClass: { popup: 'sweet-alerts' },
                    confirmButtonColor: '#4361ee'
                }).then(() => {
                    window.location.href = '/inventory/transfer';
                });
            } else {
                Swal.fire('Request Failed', response?.message || 'Kuch galti hui.', 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', error?.message || 'Something went wrong.', 'error');
        } finally {
            setTransferLoading(false);
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
                    <h1 className="text-2xl font-bold">New Stock Request</h1>
                    <p className="text-gray-500 text-sm">Raise a request to move stock from warehouse to store.</p>
                </div>
                <Link href="/inventory/transfer" className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="w-4 h-4" />
                    Back to History
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel">
                        <h2 className="text-lg font-bold mb-4">Step 1: Select Locations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-gray-500">Source Warehouse</label>
                                <Select
                                    placeholder="Which warehouse has the stock?"
                                    options={warehouses}
                                    value={selectedWarehouse}
                                    onChange={(val) => setSelectedWarehouse(val)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-gray-500">Target Store</label>
                                <Select
                                    placeholder="Which store needs the stock?"
                                    options={stores}
                                    value={selectedStore}
                                    onChange={(val) => setSelectedStore(val)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="panel min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Step 2: Select Products</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="form-input py-2 ltr:pl-10 rtl:pr-10"
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
                                                <div className="flex items-center gap-2">
                                                    <IconBox className="w-4 h-4 text-gray-400" />
                                                    <span className="font-bold">{product?.name || 'N/A'}</span>
                                                </div>
                                            )
                                        },
                                        {
                                            accessor: 'stock_count',
                                            title: 'Current Stock',
                                            render: ({ stock_count }: any) => <span className={`font-semibold ${stock_count < 10 ? 'text-danger' : 'text-success'}`}>{stock_count} units</span>
                                        },
                                        {
                                            accessor: 'qty',
                                            title: 'Request Qty',
                                            textAlignment: 'center',
                                            render: (record: any) => {
                                                const isSelected = selectedRecords.some(r => r.product_id === record.product_id);
                                                if (!isSelected) return <span className="text-xs text-gray-400">Not Selected</span>;
                                                const qty = quantities[record.product_id] || 1;
                                                return (
                                                    <div className="flex items-center justify-center gap-2 border rounded-lg p-1 bg-gray-50">
                                                        <button 
                                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white transition-colors"
                                                            onClick={() => handleQuantityChange(record.product_id, qty - 1, record.stock_count)}
                                                        >
                                                            <IconMinus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-primary">{qty}</span>
                                                        <button 
                                                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white transition-colors"
                                                            onClick={() => handleQuantityChange(record.product_id, qty + 1, record.stock_count)}
                                                        >
                                                            <IconPlus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        }
                                    ]}
                                    fetching={inventoryLoading}
                                    selectedRecords={selectedRecords}
                                    onSelectedRecordsChange={setSelectedRecords}
                                    minHeight={250}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="font-medium">Please select a source warehouse first.</p>
                                <p className="text-xs">Select location from Step 1 to load inventory.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel bg-primary text-white shadow-xl shadow-primary/20">
                        <h3 className="text-lg font-bold mb-4">Request Summary</h3>
                        <div className="space-y-4 text-sm">
                            <div className="bg-white/10 p-3 rounded-lg">
                                <div className="flex justify-between mb-2">
                                    <span className="opacity-70 text-xs uppercase font-bold">Source</span>
                                    <span className="font-bold">{selectedWarehouse?.label || 'Not Selected'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-70 text-xs uppercase font-bold">Target</span>
                                    <span className="font-bold">{selectedStore?.label || 'Not Selected'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between py-2 border-t border-white/20">
                                <span className="font-medium">Selected Products:</span>
                                <span className="font-black text-lg">{selectedRecords.length}</span>
                            </div>

                            <button
                                onClick={handleTransfer}
                                disabled={transferLoading || selectedRecords.length === 0}
                                className="btn btn-dark w-full py-3 font-bold uppercase tracking-wider shadow-lg shadow-black/20"
                            >
                                {transferLoading ? 'Processing Request...' : 'Send Request Now'}
                            </button>
                        </div>
                    </div>

                    <div className="panel">
                        <h4 className="font-bold mb-3 text-sm border-b pb-2">Guidelines</h4>
                        <ul className="text-xs space-y-2 text-gray-500 italic">
                            <li>• Ensure the source warehouse has sufficient stock.</li>
                            <li>• Double check the target store before submitting.</li>
                            <li>• Request updates the inventory in real-time once processed.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockRequest;
