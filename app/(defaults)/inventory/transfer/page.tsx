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
    // History States
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(10);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Initial Fetch
    useEffect(() => {
        fetchTransferHistory();
    }, [historyPage, historyPageSize]);

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Stock Transfer History</h1>
                <div className="flex gap-2">
                    <button className="btn btn-outline-primary" onClick={() => fetchTransferHistory()}>
                        <IconRefresh className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        Refresh Logs
                    </button>
                    <Link href="/inventory/request" className="btn btn-primary">
                        <IconPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        Create New Request
                    </Link>
                </div>
            </div>

            {/* History Log */}
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
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">From</span>
                                            <span className="font-semibold">{record.source_warehouse?.name || 'N/A'}</span>
                                        </div>
                                        <IconArrowForward className="w-3 h-3 text-gray-400 mx-2" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">To</span>
                                            <span className="font-semibold text-gray-600">{record.destination_store?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                )
                            },
                            { 
                                accessor: 'items', 
                                title: 'Items', 
                                render: (record: any) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-black">{record.items?.length || 0} Products</span>
                                        <span className="text-[10px] text-gray-400">Total Units: {record.items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}</span>
                                    </div>
                                )
                            },
                            { 
                                accessor: 'created_at', 
                                title: 'Date & Time', 
                                render: ({ created_at }: any) => (
                                    <div className="text-xs">
                                        <div className="font-bold">{new Date(created_at).toLocaleDateString()}</div>
                                        <div className="text-gray-400 text-[10px]">{new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                )
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                textAlignment: 'right',
                                render: () => (
                                    <span className="badge badge-outline-success rounded-full px-4 text-[10px] font-bold">
                                        COMPLETED
                                    </span>
                                )
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
        </div>
    );
};


export default InventoryTransfer;
