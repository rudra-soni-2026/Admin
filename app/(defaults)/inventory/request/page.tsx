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

const StockTransfer = () => {
    // Basic States
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    
    // Inventory States
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    
    // Pagination & Search States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    
    // Transfer States
    const [transferLoading, setTransferLoading] = useState(false);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Initial Fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto-select Warehouse for Warehouse Manager
    useEffect(() => {
        if (warehouses.length > 0) {
            const userDataString = localStorage.getItem('userData');
            const storedRole = localStorage.getItem('role');
            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    const userRole = (storedRole || userData.role || '').toLowerCase();
                    if (userRole.includes('warehouse_manager')) {
                        const assignedId = userData.assignedId || userData.assigned_id || userData.warehouse_id || userData.assigned_warehouse_id;
                        if (assignedId) {
                            const matched = warehouses.find(w => w.value === assignedId);
                            if (matched && !selectedWarehouse) {
                                setSelectedWarehouse(matched);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing userData:', e);
                }
            }
        }
    }, [warehouses, selectedWarehouse]);

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

    const fetchWarehouseInventory = async () => {
        if (!selectedWarehouse) return;
        try {
            setInventoryLoading(true);
            let query = `/management/admin/warehouse-inventory?warehouse_id=${selectedWarehouse.value}&page=${page}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;

            const response = await callApi(query, 'GET');
            
            if (response?.data) {
                setInventoryData(response.data);
                setTotalRecords(response.pagination?.total_items || response.totalCount || response.data.length);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setInventoryLoading(false);
        }
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (selectedWarehouse) {
            fetchWarehouseInventory();
        }
    }, [selectedWarehouse, page, pageSize, debouncedSearch]);

    useEffect(() => {
        if (selectedWarehouse) {
            setSelectedRecords([]);
            setQuantities({});
        } else {
            setInventoryData([]);
            setSelectedRecords([]);
            setQuantities({});
            setTotalRecords(0);
        }
    }, [selectedWarehouse]);

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: { container: 'toast-container' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleQuantityChange = (productId: string, val: number, max: number) => {
        if (max <= 0) {
            setQuantities({ ...quantities, [productId]: 0 });
            return;
        }
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

        const validRecords = selectedRecords.filter(r => r.stock_count > 0);
        if (validRecords.length === 0) {
            Swal.fire('Transfer Galti', 'Selected products ka stock khatam (0) hai.', 'error');
            return;
        }

        try {
            setTransferLoading(true);
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

            const response = await callApi('/management/admin/inventory-transfer', 'POST', payload);
            
            if (response?.success) {
                showMessage('Inventory stock successfully move ho chuka hai.', 'success');
                setTimeout(() => {
                    window.location.href = '/inventory/transfer';
                }, 1500);
            } else {
                showMessage(response?.message || 'Transfer failed.', 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', error?.message || 'Something went wrong.', 'error');
        } finally {
            setTransferLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Warehouse To Store Transfer</h1>
                    <p className="text-gray-500 text-sm font-medium">Instantly move stock from your warehouse to a specific store inventory.</p>
                </div>
                <Link href="/inventory/transfer" className="btn btn-outline-primary gap-2 shadow-sm">
                    <IconArrowBackward className="w-4 h-4" />
                    View Transfer Logs
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="panel border-none shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Select Transfer Locations
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-gray-500">Source Warehouse</label>
                                {(typeof window !== 'undefined' && localStorage.getItem('role')?.toLowerCase().includes('warehouse_manager')) && selectedWarehouse ? (
                                    <div className="form-input bg-gray-50 border-gray-200 font-black uppercase text-xs h-10 flex items-center shadow-sm">
                                        {selectedWarehouse.label}
                                    </div>
                                ) : (
                                    <Select
                                        placeholder="Which warehouse has the stock?"
                                        options={warehouses}
                                        value={selectedWarehouse}
                                        onChange={(val) => setSelectedWarehouse(val)}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block uppercase tracking-wider text-gray-500">Target Store</label>
                                <Select
                                    placeholder="Which store needs the stock?"
                                    options={stores}
                                    value={selectedStore}
                                    onChange={(val) => setSelectedStore(val)}
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
                                Select Products to Transfer
                            </h2>
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
                                    records={inventoryData}
                                    columns={[
                                        {
                                            accessor: 'product',
                                            title: 'Product',
                                            render: ({ product }: any) => (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 overflow-hidden rounded-md shrink-0 border border-gray-100 shadow-sm bg-gray-50">
                                                        <img src={product?.image || '/assets/images/profile-1.jpeg'} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs">{product?.name || 'N/A'}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{product?.unit_label || 'No Unit'}</span>
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            accessor: 'stock_count',
                                            title: 'Current Stock',
                                            render: (record: any) => (
                                                <div className="flex flex-col">
                                                    <span className={`font-black text-xs ${record.stock_count < 10 ? 'text-danger' : 'text-success'}`}>{record.stock_count || 0}</span>
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 leading-none">In Warehouse</span>
                                                </div>
                                            )
                                        },
                                        {
                                            accessor: 'qty',
                                            title: 'Transfer Qty',
                                            textAlignment: 'center',
                                            render: (record: any) => {
                                                const isSelected = selectedRecords.some(r => r.product_id === record.product_id);
                                                if (record.stock_count <= 0) return (
                                                    <span className="text-[9px] font-black text-white bg-danger/80 px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm animate-pulse">
                                                        STOCK OUT
                                                    </span>
                                                );
                                                if (!isSelected) return <span className="text-[10px] font-bold text-gray-300 uppercase">Not Selected</span>;
                                                const qty = quantities[record.product_id] || 1;
                                                return (
                                                    <div className="flex items-center justify-center gap-1 border rounded-lg p-1 bg-gray-50 max-w-[120px] mx-auto scale-90">
                                                        <button 
                                                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm shrink-0"
                                                            onClick={() => handleQuantityChange(record.product_id, qty - 1, record.stock_count)}
                                                        >
                                                            <IconMinus className="w-3.5 h-3.5 text-danger" />
                                                        </button>
                                                        
                                                        <input 
                                                            type="number" 
                                                            value={qty}
                                                            onChange={(e) => handleQuantityChange(record.product_id, parseInt(e.target.value) || 0, record.stock_count)}
                                                            className="w-12 text-center font-black text-primary text-sm bg-transparent border-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />

                                                        <button 
                                                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm shrink-0"
                                                            onClick={() => handleQuantityChange(record.product_id, qty + 1, record.stock_count)}
                                                        >
                                                            <IconPlus className="w-3.5 h-3.5 text-success" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        }
                                    ]}
                                    fetching={inventoryLoading}
                                    selectedRecords={selectedRecords}
                                    onSelectedRecordsChange={(recs) => {
                                        const filtered = recs.filter(r => r.stock_count > 0);
                                        setSelectedRecords(filtered);
                                    }}
                                    totalRecords={totalRecords}
                                    recordsPerPage={pageSize}
                                    page={page}
                                    onPageChange={(p) => setPage(p)}
                                    recordsPerPageOptions={[10, 20, 50, 100]}
                                    onRecordsPerPageChange={setPageSize}
                                    minHeight={250}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <div className="bg-white p-4 rounded-full shadow-md mb-4">
                                    <IconBox className="w-8 h-8 text-primary animate-pulse" />
                                </div>
                                <p className="font-black text-gray-700 text-lg">Product List Khali Hai</p>
                                <p className="text-sm text-gray-500 max-w-[280px] mt-1 italic font-medium">
                                    Pehle "Source Warehouse" select karein (Step 1), uske baad hi products ki list yaha dikhegi.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="panel bg-primary text-white shadow-xl shadow-primary/20 border-none">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <IconBox className="w-5 h-5" />
                            Transfer Summary
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <div className="flex justify-between mb-3">
                                    <span className="opacity-70 text-[10px] uppercase font-black tracking-widest">From (Warehouse)</span>
                                    <span className="font-black underline decoration-white/30 truncate max-w-[120px]">{selectedWarehouse?.label || '---'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-70 text-[10px] uppercase font-black tracking-widest">To (Store)</span>
                                    <span className="font-black underline decoration-white/30 truncate max-w-[120px]">{selectedStore?.label || '---'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between py-3 border-t border-white/20">
                                <span className="font-bold opacity-90">Total Products:</span>
                                <span className="font-black text-xl tracking-tighter">{selectedRecords.length} Items</span>
                            </div>

                            <button
                                onClick={handleTransfer}
                                disabled={transferLoading || selectedRecords.length === 0}
                                className="btn btn-dark w-full py-3.5 font-black uppercase tracking-widest shadow-lg shadow-black/30 hover:scale-[1.02] active:scale-95 transition-all text-[11px]"
                            >
                                {transferLoading ? 'Moving Stock...' : 'CONFRIM TRANSFER NOW'}
                            </button>
                        </div>
                    </div>

                    <div className="panel border-none shadow-sm">
                        <h4 className="font-black mb-3 text-[11px] uppercase tracking-widest text-gray-400 border-b pb-2">Guidelines</h4>
                        <ul className="text-xs space-y-3 font-medium text-gray-600">
                            <li className="flex gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Pehle Warehouse aur Store select karein.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Warehouse select karne ke baad available products dikhenge.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Stock transfer button dabate hi Store mein update ho jayega.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockTransfer;
