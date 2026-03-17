'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

const CategoryList = () => {
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCategories, setTotalCategories] = useState(0);
    const [todayCategories, setTodayCategories] = useState(0);

    // Filter States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');

    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [dateRange, setDateRange] = useState<any>('');

    // Navigation/Hierarchy State
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchCategories = async (currentPage: number) => {
        try {
            setLoading(true);
            // Fetch root categories
            let query = `/products/parent-categories?level=0&page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (status === 'active') query += `&isActive=true`;
            else if (status === 'inactive') query += `&isActive=false`;

            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }

            const response = await callApi(query, 'GET');

            if (response && response.data) {
                const mappedData = response.data.map((category: any) => ({
                    id: category._id ? `#${String(category._id).substring(18).toUpperCase()}` : '#UNKNOWN',
                    originalId: category._id,
                    name: category.name || 'Unknown Category',
                    image: category.image || '/assets/images/profile-12.jpeg',
                    status: category.isActive ? 'Active' : 'Inactive',
                    joinedDate: category.createdAt ? new Date(category.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
                    level: 0,
                    isExpanded: false,
                    raw: category
                }));
                setCategoryData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalCategory || mappedData.length);
                setTotalCategories(count);
                setTodayCategories(response.stats?.todayCategory || 0);
                setExpandedIds(new Set());
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || dateRange)) {
            setPage(1);
        } else {
            fetchCategories(page);
        }
    }, [page, debouncedSearch, status, dateRange]);

    const handleToggleExpand = async (item: any) => {
        const categoryId = item.originalId;
        const currentLevel = item.level;

        if (expandedIds.has(categoryId)) {
            // Collapse logic
            const newExpanded = new Set(expandedIds);
            newExpanded.delete(categoryId);
            setExpandedIds(newExpanded);

            setCategoryData(prev => {
                const index = prev.findIndex(cat => cat.originalId === categoryId);
                if (index === -1) return prev;
                
                const result = [...prev];
                result[index] = { ...result[index], isExpanded: false };
                
                let countToRemove = 0;
                for (let i = index + 1; i < result.length; i++) {
                    if (result[i].level > currentLevel) countToRemove++;
                    else break;
                }
                result.splice(index + 1, countToRemove);
                return result;
            });
        } else {
            // Expand logic
            if (currentLevel >= 2) return;

            try {
                const response = await callApi(`/products/sub-categories/${categoryId}`, 'GET');
                if (response?.data?.subCategories) {
                    const children = response.data.subCategories.map((child: any) => ({
                        id: child._id ? `#${String(child._id).substring(18).toUpperCase()}` : '#UNKNOWN',
                        originalId: child._id,
                        name: child.name || 'Unknown Sub',
                        image: child.image || '/assets/images/profile-12.jpeg',
                        status: child.isActive ? 'Active' : 'Inactive',
                        joinedDate: child.createdAt ? new Date(child.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
                        level: currentLevel + 1,
                        isExpanded: false,
                        raw: child
                    }));

                    setCategoryData(prev => {
                        const index = prev.findIndex(cat => cat.originalId === categoryId);
                        if (index === -1) return prev;
                        const result = [...prev];
                        result[index] = { ...result[index], isExpanded: true };
                        result.splice(index + 1, 0, ...children);
                        return result;
                    });

                    const newExpanded = new Set(expandedIds);
                    newExpanded.add(categoryId);
                    setExpandedIds(newExpanded);
                }
            } catch (error) {
                console.error('Error expanding category:', error);
            }
        }
    };

    const router = useRouter();
    const handleAddCategory = () => {
        router.push('/categories/add');
    };

    const handleEditCategory = (item: any) => {
        router.push(`/categories/edit/${item.originalId}`);
    };

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Category Name' },
        { key: 'joinedDate', label: 'Created At' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex items-center space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link>
                </li>
                <li>
                    <span className="text-gray-400 font-bold before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">Categories List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Category" 
                    data={categoryData} 
                    columns={columns} 
                    userType="Category" 
                    totalRecords={totalCategories}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalCategories}
                    todayUsers={todayCategories}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onAddClick={handleAddCategory}
                    addButtonLabel="Add New Category"
                    onViewClick={handleToggleExpand}
                    onEditClick={handleEditCategory}
                />
            )}
        </div>
    );
};

export default CategoryList;
