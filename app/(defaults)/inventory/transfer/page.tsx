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
import IconRefresh2 from '@/components/icon/icon-refresh';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';

const InventoryTransfer = () => {
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
    
    // History States
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Initial Fetch
    useEffect(() => {
        fetchInitialData();
        fetchTransferHistory();
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

    const fetchTransferHistory = async () => {
        try {
            setHistoryLoading(true);
            const response = await callApi(`/management/admin/inventory-transfers?page=${historyPage}&limit=${historyPageSize}`, 'GET');
            if (response?.data) {
                setHistoryData(response.data);
                setHistoryTotal(response.totalCount || 0);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
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

    useEffect(() => {
        fetchTransferHistory();
    }, [historyPage, historyPageSize]);

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
                text: 'Transfer shuru karne ke liye kam se kam ek product select karein.',
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
                    title: 'Transfer Success!',
                    text: 'Inventory successfully move ho chuki hai.',
                    icon: 'success',
                    customClass: { popup: 'sweet-alerts' },
                    confirmButtonColor: '#4361ee'
                });
                // Reset and Refresh
                fetchWarehouseInventory(selectedWarehouse.value);
                setSelectedRecords([]);
                setQuantities({});
                fetchTransferHistory();
            } else {
                Swal.fire('Transfer Failed', response?.message || 'Kuch galti hui.', 'error');
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

    const totalTransferUnits = selectedRecords.reduce((acc, r) => acc + (quantities[r.product_id] || 1), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Stock Transfer History</h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => fetchTransferHistory()}>
                        Refresh Logs
                    </button>
                </div>
            </div>

            {/* History Log - MOVED TO TOP */}
            <div className="panel overflow-hidden">
                <div className="datatables">
                    <DataTable
                        className="table-hover whitespace-nowrap"
                        records={historyData}
                        columns={[
                            { 
                                accessor: 'id', 
                                title: 'Reference', 
                                render: ({ id }: any) => <span className="font-bold text-primary">#TR-{id?.toString().slice(-6).toUpperCase()}</span>
                            },
                            { 
                                accessor: 'source', 
                                title: 'Source → Destination', 
                                render: (record: any) => (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{record.source_warehouse?.name || 'N/A'}</span>
                                        <IconArrowForward className="w-3 h-3 text-gray-400" />
                                        <span className="font-semibold text-gray-600">{record.destination_store?.name || 'N/A'}</span>
                                    </div>
                                )
                            },
                            { 
                                accessor: 'items', 
                                title: 'Items', 
                                render: (record: any) => <span>{record.items?.length || 0} Products</span>
                            },
                            { 
                                accessor: 'created_at', 
                                title: 'Date & Time', 
                                render: ({ created_at }: any) => (
                                    <div className="text-xs">
                                        {new Date(created_at).toLocaleDateString()} {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                textAlignment: 'right',
                                render: () => <span className="badge badge-outline-success">DELIVERED</span>
                            }
                        ]}
                        fetching={historyLoading}
                        totalRecords={historyTotal}
                        recordsPerPage={historyPageSize}
                        page={historyPage}
                        onPageChange={(p) => setHistoryPage(p)}
                        recordsPerPageOptions={[10, 20, 50]}
                        onRecordsPerPageChange={setHistoryPageSize}
                        minHeight={200}
                    />
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* New Transfer Form */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel">
                        <h2 className="text-lg font-bold mb-4">Step 1: Select Locations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold mb-1 block">From Warehouse</label>
                                <Select
                                    placeholder="Select Source..."
                                    options={warehouses}
                                    value={selectedWarehouse}
                                    onChange={(val) => setSelectedWarehouse(val)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block">To Store</label>
                                <Select
                                    placeholder="Select Destination..."
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
                                            render: ({ product }: any) => <span className="font-bold">{product?.name || 'N/A'}</span>
                                        },
                                        {
                                            accessor: 'stock_count',
                                            title: 'Stock',
                                            render: ({ stock_count }: any) => <span className="text-sm">{stock_count} units</span>
                                        },
                                        {
                                            accessor: 'qty',
                                            title: 'Transfer Qty',
                                            textAlignment: 'center',
                                            render: (record: any) => {
                                                const isSelected = selectedRecords.some(r => r.product_id === record.product_id);
                                                if (!isSelected) return <span className="text-xs text-gray-400">Not Selected</span>;
                                                const qty = quantities[record.product_id] || 1;
                                                return (
                                                    <div className="flex items-center justify-center gap-2 border rounded p-1">
                                                        <button onClick={() => handleQuantityChange(record.product_id, qty - 1, record.stock_count)}><IconMinus className="w-3 h-3" /></button>
                                                        <span className="w-8 text-center font-bold">{qty}</span>
                                                        <button onClick={() => handleQuantityChange(record.product_id, qty + 1, record.stock_count)}><IconPlus className="w-3 h-3" /></button>
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
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <p>Please select a warehouse above to see available stock.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel bg-primary text-white">
                        <h3 className="text-lg font-bold mb-4">Transfer Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Source:</span>
                                <span className="font-bold">{selectedWarehouse?.label || 'None'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Target:</span>
                                <span className="font-bold">{selectedStore?.label || 'None'}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-white/20">
                                <span>Selected:</span>
                                <span className="font-bold">{selectedRecords.length} Products</span>
                            </div>
                            <button
                                onClick={handleTransfer}
                                disabled={transferLoading || selectedRecords.length === 0}
                                className="btn btn-dark w-full mt-4"
                            >
                                {transferLoading ? 'Transferring...' : 'Send Stock Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryTransfer;
