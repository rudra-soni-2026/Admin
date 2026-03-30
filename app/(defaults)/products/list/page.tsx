'use client';
import React, { useEffect, useState } from 'react';
import UserManagerTable from '@/components/user-manager/user-manager-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';

const ProductList = () => {
    const [productData, setProductData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const [todayProducts, setTodayProducts] = useState(0);

    // Filter States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState<any>('');
    const [categoryId, setCategoryId] = useState('');
    
    const [brand, setBrand] = useState('');
    const [debouncedBrand, setDebouncedBrand] = useState('');
    
    const [minPrice, setMinPrice] = useState('');
    const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
    
    const [maxPrice, setMaxPrice] = useState('');
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
    
    const [sortBy, setSortBy] = useState('createdAt:desc');

    // Consolidated Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setDebouncedBrand(brand);
            setDebouncedMinPrice(minPrice);
            setDebouncedMaxPrice(maxPrice);
        }, 500);
        return () => clearTimeout(handler);
    }, [search, brand, minPrice, maxPrice]);

    const fetchProducts = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/products?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            if (status === 'active') query += `&isActive=true`;
            else if (status === 'inactive') query += `&isActive=false`;

            if (debouncedBrand) query += `&brand=${encodeURIComponent(debouncedBrand)}`;
            if (categoryId) query += `&categoryId=${categoryId}`;
            if (debouncedMinPrice) query += `&minPrice=${debouncedMinPrice}`;
            if (debouncedMaxPrice) query += `&maxPrice=${debouncedMaxPrice}`;
            if (sortBy) query += `&sortBy=${sortBy}`;

            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }

            const response = await callApi(query, 'GET');

            const rawData = response?.data || response?.['Product table data'] || response?.products || [];
            
            if (response && rawData) {
                const mappedData = rawData.map((product: any) => {
                    const mainVariant = product.variants?.[0] || {};
                    const variantsCount = product.variants?.length || 0;
                    return {
                        id: product.utc_id || mainVariant.barcode || (product._id ? `#${String(product._id).substring(18).toUpperCase()}` : '#UNKNOWN'),
                        originalId: product._id,
                        name: (
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 dark:text-white-light leading-tight mb-1">{product.name || 'Unknown Product'}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 whitespace-nowrap">
                                        {variantsCount} {variantsCount === 1 ? 'Variant' : 'Variants'}
                                    </span>
                                    {mainVariant.unit_label && (
                                        <span className="text-[9px] font-black uppercase bg-secondary/10 text-secondary px-1.5 py-0.5 rounded border border-secondary/20 whitespace-nowrap">
                                            {mainVariant.unit_label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ),
                        brand: product.brand || mainVariant.brand_name || 'N/A',
                        barcode: product.utc_id || mainVariant.barcode || 'N/A',
                        image: product.image || mainVariant.image || '/assets/images/profile-1.jpeg',
                        category: product.subcategory_id?.name
                            || product.category_id?.name
                            || (typeof product.subcategory_id === 'string' && product.subcategory_id ? product.subcategory_id : null)
                            || product.subcategory_id
                            || 'N/A',
                        price: (mainVariant.price || product.price) ? `₹${mainVariant.price || product.price}` : '₹0',
                        mrp: (mainVariant.original_price || product.original_price) ? `₹${mainVariant.original_price || product.original_price}` : '₹0',
                        status: product.isActive ? 'Active' : 'Inactive',
                        joinedDate: product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A',
                    };
                });
                setProductData(mappedData);
                const count = 
                    response.pagination?.total_items ??
                    response.pagination?.totalCount ??
                    response.totalCount ??
                    response.total_items ??
                    response.stats?.totalProduct ??
                    0;
                setTotalRecords(count);
                setTotalProducts(count);

                if (response.stats) {
                    setTodayProducts(response.stats.todayProduct || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const lastFilters = React.useRef('');

    useEffect(() => {
        const currentFilters = JSON.stringify({ debouncedSearch, status, categoryId, debouncedBrand, debouncedMinPrice, debouncedMaxPrice, dateRange, sortBy });
        if (lastFilters.current !== currentFilters) {
            lastFilters.current = currentFilters;
            if (page !== 1) {
                setPage(1);
                return;
            }
        }
        fetchProducts(page);
    }, [page, debouncedSearch, status, categoryId, debouncedBrand, debouncedMinPrice, debouncedMaxPrice, sortBy, dateRange]);

    const router = useRouter();

    const handleAddProduct = () => {
        router.push('/products/add');
    };

    const handleEditProduct = (item: any) => {
        router.push(`/products/edit/${item.originalId || item.id}`);
    };

    const handleViewProduct = (item: any) => {
        router.push(`/products/view/${item.originalId || item.id}`);
    };

    const handleStatusToggle = async (itemId: any, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'Active' ? false : true;
            await callApi(`/management/admin/products/status/${itemId}`, 'PATCH', { isActive: newStatus });
            // Refresh list
            fetchProducts(page);
        } catch (error) {
            console.error('Status toggle error:', error);
        }
    };

    const columns = [
        { key: 'image', label: 'Image' },
        { key: 'name', label: 'Product Name' },
        { key: 'barcode', label: 'Barcode / UTC' },
        { key: 'brand', label: 'Brand' },
        { key: 'category', label: 'Category' },
        { key: 'mrp', label: 'MRP' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex flex-wrap items-center gap-2 text-gray-500 font-bold text-sm">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Products</span>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-black dark:text-white-light">
                    <span>Product List</span>
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center p-10">
                    <span className="mb-10 inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-10 h-10 align-middle m-auto"></span>
                </div>
            ) : (
                <UserManagerTable 
                    title="Product" 
                    data={productData} 
                    columns={columns} 
                    userType="Product" 
                    totalRecords={totalRecords}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p)}
                    totalUsers={totalProducts}
                    todayUsers={todayProducts}
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onAddClick={handleAddProduct}
                    addButtonLabel="Add New Product"
                    onEditClick={handleEditProduct}
                    onViewClick={handleViewProduct}
                    onStatusToggle={handleStatusToggle}
                    categoryId={categoryId}
                    onCategoryIdChange={setCategoryId}
                    brand={brand}
                    onBrandChange={setBrand}
                    minPrice={minPrice}
                    onMinPriceChange={setMinPrice}
                    maxPrice={maxPrice}
                    onMaxPriceChange={setMaxPrice}
                    hideDelete={true}
                />
            )}
        </div>
    );
};

export default ProductList;
