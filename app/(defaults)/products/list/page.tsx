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
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('createdAt:desc');

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchProducts = async (currentPage: number) => {
        try {
            setLoading(true);
            let query = `/management/admin/products?page=${currentPage}&limit=${pageSize}`;
            if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
            
            if (status === 'active') query += `&isActive=true`;
            else if (status === 'inactive') query += `&isActive=false`;

            if (brand) query += `&brand=${encodeURIComponent(brand)}`;
            if (categoryId) query += `&categoryId=${categoryId}`;
            if (minPrice) query += `&minPrice=${minPrice}`;
            if (maxPrice) query += `&maxPrice=${maxPrice}`;
            if (sortBy) query += `&sortBy=${sortBy}`;

            if (dateRange && dateRange.length === 2) {
                const start = new Date(dateRange[0]);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }

            const response = await callApi(query, 'GET');

            if (response && response.data) {
                const mappedData = response.data.map((product: any) => ({
                    id: product.utc_id || (product._id ? `#${String(product._id).substring(18).toUpperCase()}` : '#UNKNOWN'),
                    originalId: product._id,
                    name: product.name || 'Unknown Product',
                    brand: product.brand || 'N/A',
                    barcode: product.utc_id || 'N/A',
                    image: product.image || '/assets/images/profile-1.jpeg',
                    category: product.categoryId?.name || 'N/A',
                    price: product.price !== undefined ? `₹${product.price}` : '₹0',
                    mrp: product.original_price ? `₹${product.original_price}` : 'N/A',
                    status: product.isActive ? 'Active' : 'Inactive',
                    joinedDate: product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A',
                }));
                setProductData(mappedData);
                const count = response.totalCount !== undefined ? response.totalCount : (response.stats?.totalProduct || 0);
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

    useEffect(() => {
        if (page !== 1 && (debouncedSearch || status !== 'all' || categoryId || brand || minPrice || maxPrice || dateRange)) {
            setPage(1);
        } else {
            fetchProducts(page);
        }
    }, [page, debouncedSearch, status, categoryId, brand, minPrice, maxPrice, sortBy, dateRange]);

    const router = useRouter();

    const handleAddProduct = () => {
        router.push('/products/add');
    };

    const handleEditProduct = (item: any) => {
        router.push(`/products/edit/${item.originalId || item.id}`);
    };

    const columns = [
        { key: 'barcode', label: 'Barcode / UTC' },
        { key: 'image', label: 'Image' },
        { key: 'name', label: 'Product Name' },
        { key: 'brand', label: 'Brand' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Selling Price (Offer Price)' },
        { key: 'mrp', label: 'MRP' },
        { key: 'status', label: 'Status' },
    ];

    return (
        <div>
            <ul className="mb-6 flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/" className="text-primary hover:underline">Dashboard</Link>
                </li>
                <li>
                    <span className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">Products</span>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
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
                    categoryId={categoryId}
                    onCategoryIdChange={setCategoryId}
                    brand={brand}
                    onBrandChange={setBrand}
                    minPrice={minPrice}
                    onMinPriceChange={setMinPrice}
                    maxPrice={maxPrice}
                    onMaxPriceChange={setMaxPrice}
                />
            )}
        </div>
    );
};

export default ProductList;
