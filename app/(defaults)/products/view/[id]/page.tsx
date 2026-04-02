'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconPencil from '@/components/icon/icon-pencil';

export default function ViewProduct() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'features' | 'ingredients' | 'info'>('features');

    useEffect(() => {
        if (id) fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await callApi(`/products/${id}`, 'GET');
            // Handle different response shapes: {data: {...}}, or the product directly
            let data = response?.data || response;
            // If data has product-level keys like info, highlights - it's the product
            // If data has a nested product key, unwrap it
            if (data?.product) data = data.product;
            if (data && (data.name || data._id)) {
                setProduct(data);
                const imgs: string[] = Array.isArray(data.images) && data.images.length > 0
                    ? data.images
                    : data.image ? [data.image] : [];
                setActiveImage(imgs[0] || '/assets/images/profile-1.jpeg');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <span className="inline-block animate-spin rounded-full border-4 border-success border-l-transparent w-12 h-12" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-black text-gray-500">Product Not Found</h2>
                <Link href="/products/list" className="btn btn-primary">Back to List</Link>
            </div>
        );
    }

    const images: string[] = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product.image ? [product.image] : [];
    const features: any[] = Array.isArray(product.features) ? product.features : [];
    const ingredients: string[] = Array.isArray(product.ingredients) ? product.ingredients : [];

    // Safe string helper — prevents "Objects are not valid as React child"
    // Also intelligently extracts values from simple objects like { "ANY_KEY": "Value" }
    const safeStr = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        if (Array.isArray(val)) return val.map(v => safeStr(v)).join(', ');
        if (typeof val === 'object') {
            const entries = Object.entries(val);
            if (entries.length === 1) return safeStr(entries[0][1]);
            return JSON.stringify(val);
        }
        return String(val);
    };

    // Parse product_details if it's a JSON string
    let detailsObj: any = null;
    if (typeof product.product_details === 'string' && product.product_details.trim().startsWith('{')) {
        try {
            detailsObj = JSON.parse(product.product_details);
        } catch (e) {
            console.error("Failed to parse product_details", e);
        }
    }

    // description can be a string OR an object {info, highlights}
    const descObj = (product.description && typeof product.description === 'object') ? product.description : detailsObj;
    const descText = typeof product.description === 'string'
        ? product.description
        : (typeof detailsObj?.description === 'string' ? detailsObj.description : null);

    // info: prioritize product.info, then descObj.info
    const rawInfo = (Array.isArray(product.info) && product.info.length > 0) ? product.info : descObj?.info;
    const info: { key: string; value: string }[] = Array.isArray(rawInfo)
        ? rawInfo.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
                const entries = Object.entries(item);
                return entries.length > 0 ? { key: String(entries[0][0]), value: safeStr(entries[0][1]) } : null;
            }
            return { key: 'Info', value: safeStr(item) };
        }).filter(Boolean) as { key: string; value: string }[]
        : rawInfo && typeof rawInfo === 'object'
        ? Object.entries(rawInfo).map(([k, v]) => ({ key: k, value: safeStr(v) }))
        : [];

    // highlights: prioritize product.highlights, then descObj.highlights
    const rawHighlights = (Array.isArray(product.highlights) && product.highlights.length > 0) ? product.highlights : descObj?.highlights;
    const highlights: any[] = Array.isArray(rawHighlights) ? rawHighlights : [];

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Breadcrumb */}
            <ul className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-500">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/products/list" className="text-primary hover:underline">Products</Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-black dark:text-white-light">
                    <span>{safeStr(product.name)}</span>
                </li>
            </ul>

            {/* Header Bar */}
            <div className="panel flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <h5 className="text-lg font-black text-black dark:text-white-light">Product Detail</h5>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${product.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/products/list" className="btn btn-outline-secondary gap-2 text-xs font-bold uppercase">
                        <IconArrowBackward className="h-4 w-4" /> Back
                    </Link>
                    <button
                        type="button"
                        className="btn btn-primary gap-2 text-xs font-bold uppercase"
                        onClick={() => router.push(`/products/edit/${id}`)}
                    >
                        <IconPencil className="h-4 w-4" /> Edit Product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT: Images + Basic Info */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <div className="panel">
                        <h6 className="text-sm font-black uppercase tracking-wider mb-4 text-gray-600 border-b pb-2">Product Images</h6>
                        <div className="flex flex-col gap-4">
                            {/* Main Image */}
                            <div className="w-full aspect-square max-h-[380px] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                <img
                                    src={activeImage || '/assets/images/profile-1.jpeg'}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                    onError={(e: any) => { e.target.src = '/assets/images/profile-1.jpeg'; }}
                                />
                            </div>
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveImage(img)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImage === img ? 'border-primary shadow-md scale-105' : 'border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover"
                                                onError={(e: any) => { e.target.src = '/assets/images/profile-1.jpeg'; }} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs: Features / Ingredients / Info */}
                    <div className="panel">
                        <div className="flex gap-1 border-b mb-4">
                            {(['features', 'ingredients', 'info'] as const).map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'features' && (
                            <div className="space-y-2">
                                {features.length > 0 ? features.map((f: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-black/10">
                                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">{safeStr(f.title)}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{safeStr(f.description)}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-400 text-center py-6">No features added</p>}
                            </div>
                        )}

                        {activeTab === 'ingredients' && (
                            <div className="flex flex-wrap gap-2">
                                {ingredients.length > 0 ? ingredients.map((ing: any, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-info/10 text-info rounded-full text-xs font-bold">{safeStr(ing)}</span>
                                )) : <p className="text-sm text-gray-400 text-center w-full py-6">No ingredients listed</p>}
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="divide-y divide-gray-100">
                                {info.length > 0 ? info.map((item, i: number) => (
                                    <div key={i} className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">{item.key}</span>
                                        <span className="text-sm font-bold text-black dark:text-white">{item.value}</span>
                                    </div>
                                )) : <p className="text-sm text-gray-400 text-center py-6">No tech info available</p>}
                            </div>
                        )}
                    </div>

                    {/* Variants Table */}
                    {product.variants?.length > 0 && (
                        <div className="panel animate__animated animate__fadeInUp">
                            <h6 className="text-sm font-black uppercase tracking-wider mb-4 text-gray-600 border-b pb-2">Available Variants</h6>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-black/20 text-gray-500 font-extrabold uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-4 py-2.5 text-left rounded-tl-lg">Unit</th>
                                            <th className="px-4 py-2.5 text-left">Type</th>
                                            <th className="px-4 py-2.5 text-right">Price</th>
                                            <th className="px-4 py-2.5 text-right">MRP</th>
                                            <th className="px-4 py-2.5 text-center rounded-tr-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {product.variants.map((v: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-black dark:text-white">{safeStr(v.unit_label)}</td>
                                                <td className="px-4 py-3 text-gray-500 font-medium">{safeStr(v.unit_type)}</td>
                                                <td className="px-4 py-3 text-right font-black text-success">₹{safeStr(v.price)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-danger/60 line-through">₹{safeStr(v.original_price)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.isActive !== false ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                        {v.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Details Panel */}
                <div className="space-y-6">
                    {/* Core Info */}
                    <div className="panel">
                        <h6 className="text-sm font-black uppercase tracking-wider mb-4 text-gray-600 border-b pb-2">Product Info</h6>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Product Name</p>
                                <p className="text-base font-black text-black dark:text-white mt-0.5">{safeStr(product.name)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Brand</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {safeStr(product.brand?.name || product.brand || product.variants?.[0]?.brand_name || product.brand_id?.name) || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Category</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {safeStr(
                                        product.subcategory_id?.name || 
                                        product.categoryId?.name || 
                                        product.category?.name || 
                                        product.p_category?.name || 
                                        (typeof product.categoryId === 'string' ? null : product.categoryId) || 
                                        product.p_category || 
                                        product.categoryId || 
                                        'N/A'
                                    )}
                                </p>
                            </div>
                            {product.subcategory_id?.name && (
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Sub Category</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{safeStr(product.subcategory_id.name)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Unit Label</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{safeStr(product.unit_label || product.variants?.[0]?.unit_label) || 'N/A'}</p>
                            </div>
                            {product.utc_id && (
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Barcode / UTC</p>
                                    <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{safeStr(product.utc_id || product._id) || 'N/A'}</p>
                                </div>
                            )}
                            {(product.original_price || product.variants?.[0]?.original_price) && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-danger/5 border border-danger/10">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-danger">MRP</p>
                                    <p className="text-lg font-black text-danger">₹{safeStr(product.variants?.[0]?.original_price || product.original_price || 0)}</p>
                                </div>
                            )}
                            {(product.price || product.variants?.[0]?.price) && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/10">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-success">Selling Price</p>
                                    <p className="text-lg font-black text-success">₹{safeStr(product.variants?.[0]?.price || product.price || 0)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {(descText || highlights.length > 0 || (product.product_details && !detailsObj)) && (
                        <div className="panel">
                            <h6 className="text-sm font-black uppercase tracking-wider mb-3 text-gray-600 border-b pb-2">Description</h6>
                            {/* Only show product_details if it's NOT a JSON string we already parsed */}
                            {product.product_details && !detailsObj && (
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{safeStr(product.product_details)}</p>
                            )}
                            {descText && (
                                <p className="text-xs text-gray-500 leading-relaxed mb-4">{safeStr(descText)}</p>
                            )}
                            {highlights.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 underline decoration-primary/30 underline-offset-4">Highlights</p>
                                    {highlights.map((h: any, i: number) => (
                                        <div key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                                            {safeStr(h)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {product.tags?.length > 0 && (
                        <div className="panel">
                            <h6 className="text-sm font-black uppercase tracking-wider mb-3 text-gray-600 border-b pb-2">Tags</h6>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag: any, i: number) => (
                                    <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">#{safeStr(tag)}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="panel">
                        <h6 className="text-sm font-black uppercase tracking-wider mb-3 text-gray-600 border-b pb-2">Metadata</h6>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="font-black uppercase tracking-wider text-gray-400">Created</span>
                                <span className="font-bold text-gray-700">{product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-black uppercase tracking-wider text-gray-400">Updated</span>
                                <span className="font-bold text-gray-700">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-black uppercase tracking-wider text-gray-400">Display Order</span>
                                <span className="font-bold text-gray-700">{product.order ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
