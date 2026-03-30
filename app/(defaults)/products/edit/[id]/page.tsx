'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import IconCamera from '@/components/icon/icon-camera';
import Select from 'react-select';
import { generateProductDescription } from '@/utils/ai';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-200 ease-in-out ${checked ? 'bg-primary' : 'bg-gray-200'
            }`}
    >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-200 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
);

export default function EditProduct() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [images, setImages] = useState<ImageListType>([]);
    const utcRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const [formData, setFormData] = useState({
        utc_id: '',
        name: '',
        slug: '',
        description: '',
        product_details: '',
        original_price: '',
        p_category: '',
        categoryId: '',
        subcategory_id: '',
        unit_label: '',
        brand: '',
        price: '',
        isActive: true,
        order: 0,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        tags: '',
    });

    const [parentCategories, setParentCategories] = useState<any[]>([]);
    const [level2Categories, setLevel2Categories] = useState<any[]>([]);
    const [level3Categories, setLevel3Categories] = useState<any[]>([]);
    const [fetchingL1, setFetchingL1] = useState(false);
    const [fetchingL2, setFetchingL2] = useState(false);
    const [fetchingL3, setFetchingL3] = useState(false);
    const [fetchingUtc, setFetchingUtc] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const [features, setFeatures] = useState([{ title: '', description: '' }]);
    const [ingredients, setIngredients] = useState(['']);
    const [info, setInfo] = useState([{ key: '', value: '' }]);
    const [highlights, setHighlights] = useState(['']);
    const [variants, setVariants] = useState<any[]>([{ unit_label: '', unit_type: 'piece', price: '', original_price: '', stock: 100, sku: '' }]);

    useEffect(() => {
        const init = async () => {
            await fetchL1();
            if (productId) {
                fetchProductDetails();
            }
        };
        init();
    }, [productId]);

    const fetchProductDetails = async () => {
        try {
            setFetching(true);
            const response = await callApi(`/products/${productId}`, 'GET');
            const p = response?.product || response?.data || response;

            if (p) {
                // Set main form data
                setFormData({
                    utc_id: p.utc_id || '',
                    name: p.name || '',
                    slug: p.slug || '',
                    description: p.description?.content || (typeof p.description === 'string' ? p.description : ''),
                    product_details: p.product_details || '',
                    original_price: String(p.original_price || ''),
                    p_category: typeof p.p_category === 'object' ? (p.p_category?._id || p.p_category?.id) : (p.p_category || ''),
                    categoryId: typeof p.categoryId === 'object' ? (p.categoryId?._id || p.categoryId?.id) : (p.categoryId || ''),
                    subcategory_id: typeof p.subcategory_id === 'object' ? (p.subcategory_id?._id || p.subcategory_id?.id) : (p.subcategory_id || ''),
                    unit_label: p.unit_label || '',
                    brand: p.brand || '',
                    price: String(p.price || p.variants?.[0]?.price || ''),
                    isActive: p.isActive !== undefined ? p.isActive : true,
                    order: p.order || 0,
                    metaTitle: p.metaTitle || '',
                    metaDescription: p.metaDescription || '',
                    metaKeywords: p.metaKeywords || '',
                    tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
                });

                // Set content lists
                if (p.ingredients) setIngredients(p.ingredients);
                else if (p.description?.ingredients) setIngredients(p.description.ingredients || []);

                // Smartly handle highlights from multiple fallback locations
                const rawHighlights = p.highlights || p.description?.highlights || (p.product_details ? JSON.parse(typeof p.product_details === 'string' ? p.product_details : '{}').highlights : null);
                if (Array.isArray(rawHighlights)) {
                    setHighlights(rawHighlights.map((h: any) => {
                        if (typeof h === 'string') return h;
                        return h["PRODUCTS DESCRIPTION"] || h.highlight || Object.values(h)[0] || "";
                    }).filter(h => h));
                } else {
                    setHighlights(['']);
                }

                // Handle info list fallback
                const rawInfo = p.info || p.description?.info || (p.product_details ? JSON.parse(typeof p.product_details === 'string' ? p.product_details : '{}').info : null);
                if (Array.isArray(rawInfo)) {
                    const mappedInfo = rawInfo.map((item: any) => {
                        const key = Object.keys(item)[0];
                        return { key, value: item[key] };
                    }).filter(i => i.key);
                    setInfo(mappedInfo.length > 0 ? mappedInfo : [{ key: '', value: '' }]);
                } else {
                    setInfo([{ key: '', value: '' }]);
                }

                if (p.features) setFeatures(p.features);
                if (Array.isArray(p.variants) && p.variants.length > 0) {
                    setVariants(p.variants.map((v: any) => ({
                        ...v,
                        price: String(v.price || ''),
                        original_price: String(v.original_price || ''),
                        stock: v.stock || 100,
                        barcode: v.barcode || v.utc_id || '',
                        images: Array.isArray(v.images) ? v.images.map((img: any) => {
                            if (typeof img === 'string') return { dataURL: img };
                            if (img.image_url) return { dataURL: img.image_url };
                            return img;
                        }) : []
                    })));
                }

                if (Array.isArray(p.images)) {
                    setImages(p.images.map((url: string) => ({ dataURL: url })));
                } else if (p.image) {
                    setImages([{ dataURL: p.image }]);
                }

                // Fetch child categories
                const pCatId = typeof p.p_category === 'object' ? (p.p_category?._id || p.p_category?.id) : p.p_category;
                const catId = typeof p.categoryId === 'object' ? (p.categoryId?._id || p.categoryId?.id) : p.categoryId;

                if (pCatId) fetchL2(pCatId);
                if (catId) fetchL3(catId);
            }
        } catch (error) {
            console.error('Fetch Product Error:', error);
            showMessage('Failed to load product details.', 'danger');
        } finally {
            setFetching(false);
        }
    };

    const fetchL1 = async () => {
        try {
            setFetchingL1(true);
            const response = await callApi('/products/parent-categories?level=0&isActive=true', 'GET');
            const data = response?.data || response || [];
            if (Array.isArray(data)) setParentCategories(data);
        } catch (error) {
            console.error('L1 Error:', error);
        } finally {
            setFetchingL1(false);
        }
    };

    const fetchL2 = async (parentId: string) => {
        try {
            setFetchingL2(true);
            const response = await callApi(`/management/admin/sub-categories/${parentId}?isActive=true`, 'GET');
            const data = response?.data?.subCategories || response?.data || response?.subCategories || response || [];
            if (Array.isArray(data)) setLevel2Categories(data);
        } catch (error) {
            console.error('L2 Error:', error);
        } finally {
            setFetchingL2(false);
        }
    };

    const fetchL3 = async (parentId: string) => {
        try {
            setFetchingL3(true);
            const response = await callApi(`/management/admin/sub-categories/${parentId}?isActive=true`, 'GET');
            const data = response?.data?.subCategories || response?.data || response?.subCategories || response || [];
            if (Array.isArray(data)) setLevel3Categories(data);
        } catch (error) {
            console.error('L3 Error:', error);
        } finally {
            setFetchingL3(false);
        }
    };

    const generateUtc = async (variantIndex: number) => {
        try {
            const res = await callApi('/management/admin/products/generate-new-utc', 'GET');
            if (res && res.data?.utc_id) {
                const nv = [...variants];
                nv[variantIndex].barcode = res.data.utc_id;
                setVariants(nv);
                showMessage('New UTC ID generated successfully!', 'success');
            }
        } catch (error) {
            console.error('Generate UTC Error:', error);
            showMessage('Failed to generate UTC ID.', 'danger');
        }
    };

    const fetchProductByUtc = async (utc: string, variantIndex: number = 0) => {
        if (!utc || utc.length < 8) return;
        try {
            setFetchingUtc(true);

            // Fetch both in parallel to reduce total wait time
            const localPromise = callApi(`/products/utc/${utc}`, 'GET').catch(() => null);
            const fields = 'product_name,product_name_en,brands,quantity,ingredients_text,generic_name,_keywords,image_url,image_front_url,image_ingredients_url,image_nutrition_url,image_packaging_url,selected_images,ingredients_analysis_tags,manufacturing_places,countries,nutriscore_grade,nova_group,code,packaging,additives_n,nutriments,nutrition_data_per';
            const globalPromise = fetch(`https://world.openfoodfacts.org/api/v0/product/${utc}.json?fields=${fields}`)
                .then(res => res.json())
                .catch(() => ({ status: 0 }));

            // 1. Check local Backend API result first (High Quality)
            const localRes = await localPromise;
            if (localRes && localRes.data) {
                const p = localRes.data;

                // ONLY update global info if it's the first variant or global info is mostly empty
                const isGlobalEmpty = !formData.name || formData.name === 'product' || !formData.description;
                if (variantIndex === 0 || isGlobalEmpty) {
                    setFormData(prev => ({
                        ...prev,
                        name: p.name || prev.name,
                        brand: p.brand || prev.brand,
                        unit_label: p.unit_label || prev.unit_label,
                        description: p.description?.content || (typeof p.description === 'string' ? p.description : prev.description),
                        product_details: p.product_details || prev.product_details,
                        original_price: String(p.original_price || ''),
                        metaTitle: p.metaTitle || prev.metaTitle,
                        metaDescription: p.metaDescription || prev.metaDescription,
                        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
                    }));

                    if (p.ingredients) setIngredients(p.ingredients);
                    if (p.features) setFeatures(p.features);

                    // Smartly handle highlights from p.highlights or p.description.highlights
                    const rawHighlights = p.highlights || p.description?.highlights;
                    if (Array.isArray(rawHighlights)) {
                        setHighlights(rawHighlights.map((h: any) => h["PRODUCTS DESCRIPTION"] || h.highlight || h));
                    }

                    const rawInfo = p.info || p.description?.info;
                    if (Array.isArray(rawInfo)) {
                        const mappedInfo = rawInfo.map((item: any) => {
                            const key = Object.keys(item)[0];
                            return { key, value: item[key] };
                        });
                        setInfo(mappedInfo);
                    }
                }

                // ALWAYS update the specific variant scanned (Images, Prices, Barcode)
                const foundImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
                const formattedImages = foundImages.map((url: string) => ({ dataURL: url }));

                setVariants(prev => {
                    const nv = [...prev];
                    if (nv[variantIndex]) {
                        if (formattedImages.length > 0) nv[variantIndex].images = formattedImages;
                        if (p.unit_label) nv[variantIndex].unit_label = p.unit_label;
                        if (p.price) nv[variantIndex].price = p.price;
                        if (p.original_price) nv[variantIndex].original_price = p.original_price;
                    }
                    return nv;
                });

                showMessage(`Variant ${variantIndex + 1} data updated from cache!`, 'success');
                setFetchingUtc(false);
                return;
            }

            // 2. Fallback to OpenFoodFacts result if local data not found
            const data = await globalPromise;
            if (data.status === 1 && data.product) {
                const p = data.product;
                setFormData(prev => ({
                    ...prev,
                    name: p.product_name || p.product_name_en || prev.name,
                    brand: p.brands || prev.brand,
                    unit_label: p.quantity || prev.unit_label,
                    description: p.ingredients_text || prev.description,
                    product_details: p.generic_name || p.product_name || `${p.brands || ''} ${p.quantity || ''}`.trim() || prev.product_details,
                    metaTitle: p.product_name || prev.metaTitle,
                    metaDescription: `Buy ${p.product_name || ''} ${p.brands ? 'by ' + p.brands : ''}. ${p.generic_name || ''} ${p.ingredients_text ? '- ' + p.ingredients_text.substring(0, 100) + '...' : ''}`.trim() || prev.metaDescription,
                    tags: p._keywords ? p._keywords.join(', ') : prev.tags,
                }));

                const apiImages = [
                    p.image_url,
                    p.image_front_url,
                    p.image_ingredients_url,
                    p.image_nutrition_url,
                    p.image_packaging_url
                ].filter((url: any) => url);

                if (apiImages.length > 0) {
                    const uniqueImages = apiImages.map((url: string) => ({ dataURL: url }));
                    setImages(prev => {
                        const existing = prev.filter(img => img.file);
                        return [...existing, ...uniqueImages];
                    });
                    // Update variant images
                    setVariants(prev => {
                        const nv = [...prev];
                        if (nv[variantIndex]) {
                            nv[variantIndex].images = uniqueImages;
                            if (p.quantity) nv[variantIndex].unit_label = p.quantity;
                        }
                        return nv;
                    });
                }

                showMessage('Product data updated from global database!', 'info');
            }
        } catch (error) {
            console.error('UTC Fetch Error:', error);
        } finally {
            setFetchingUtc(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!formData.name && !formData.brand) {
            showMessage('Provide Name or Brand for AI to generate description.', 'danger');
            return;
        }
        try {
            setIsAiGenerating(true);
            const description = await generateProductDescription(formData.name, formData.brand, formData.unit_label);
            if (description) {
                setFormData(prev => ({ ...prev, description }));
                showMessage('Modern Description Generated!', 'success');
            }
        } catch (error) {
            console.error(error);
            showMessage('AI Refused to Generate Description. Try again.', 'danger');
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleCategoryChange = (selected: any, id: string) => {
        const value = selected ? selected.value : '';
        setFormData(prev => ({ ...prev, [id]: value }));

        if (id === 'p_category') {
            setFormData(prev => ({ ...prev, categoryId: '', subcategory_id: '' }));
            setLevel2Categories([]);
            setLevel3Categories([]);
            if (value) fetchL2(value);
        } else if (id === 'categoryId') {
            setFormData(prev => ({ ...prev, subcategory_id: '' }));
            setLevel3Categories([]);
            if (value) fetchL3(value);
        }
    };

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        // SYNC LOGIC: If the main Barcode is updated, sync it with the first variant
        if (id === 'utc_id' && variants.length > 0) {
            setVariants(prev => {
                const nv = [...prev];
                if (!nv[0].barcode || nv[0].barcode === formData.utc_id) {
                    nv[0].barcode = value;
                }
                return nv;
            });
        }
    };

    const onImageChange = (imageList: ImageListType) => {
        // Validation: Max size 1MB
        const largeFile = imageList.find(img => img.file && img.file.size > 1024 * 1024);
        if (largeFile) {
            showMessage(`Selected image is too large. Max size 1MB.`, 'danger');
            return;
        }
        setImages(imageList);
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId) {
            showMessage('Please select a category.', 'danger');
            return;
        }

        try {
            setLoading(true);

            // Collect existing URLs
            let finalImageUrls: string[] = images
                .filter(img => !img.file && (img.dataURL || img.image_url || typeof img === 'string'))
                .map(img => (img.dataURL || img.image_url || (typeof img === 'string' ? img : '')) as string);

            // Upload new files
            const uploadData = new FormData();
            for (const img of images) {
                if (img.file) {
                    if (img.file.size > 1024 * 1024) {
                        showMessage(`Image "${img.file.name}" exceeds 1MB limit. Please upload a smaller image.`, 'danger');
                        setLoading(false);
                        return;
                    }
                    uploadData.append('images', img.file);
                }
            }

            if (uploadData.has('images')) {
                const uploadRes = await callApi('/upload', 'POST', uploadData);
                if (uploadRes && uploadRes.status === 'success' && Array.isArray(uploadRes.data)) {
                    const uploadedUrls = uploadRes.data.map((item: any) => item.url);
                    finalImageUrls = [...finalImageUrls, ...uploadedUrls];
                }
            }

            const updatedVariants = await Promise.all(variants.filter(v => v.unit_label).map(async (v) => {
                let vImages: string[] = (v.images || []).filter((img: any) => !img.file && (img.dataURL || img.image_url || typeof img === 'string')).map((img: any) => img.dataURL || img.image_url || (typeof img === 'string' ? img : '')) || [];
                const vUploadData = new FormData();
                let hasNewFiles = false;

                if (Array.isArray(v.images)) {
                    for (const img of v.images) {
                        if (img.file) {
                            vUploadData.append('images', img.file);
                            hasNewFiles = true;
                        }
                    }
                }

                if (hasNewFiles) {
                    const vRes = await callApi('/upload', 'POST', vUploadData);
                    if (vRes?.status === 'success' && Array.isArray(vRes.data)) {
                        const newUrls = vRes.data.map((item: any) => item.url);
                        vImages = [...vImages, ...newUrls];
                    }
                }

                return {
                    ...v,
                    utc_id: v.barcode || v.utc_id || '', // Explicitly set it here for backend
                    price: Number(v.price) || Number(v.original_price) || 0,
                    original_price: Number(v.original_price) || 0,
                    stock: Number(v.stock) || 100,
                    image: vImages.length > 0 ? vImages[0] : "",
                    images: vImages.map((url, idx) => ({
                        image_url: url,
                        alt: v.unit_label || "variant image",
                        order: String(idx)
                    }))
                };
            }));

            const mainVariant = updatedVariants[0];

            // Ensure at least one highlight if description exists but highlights are empty
            const activeHighlights = highlights.filter(h => h.trim());
            const finalHighlights = activeHighlights.length > 0
                ? activeHighlights
                : (formData.description ? [formData.description] : []);

            const detailsObj = {
                highlights: finalHighlights.map(h => ({ "PRODUCTS DESCRIPTION": h })),
                info: info.filter(it => it.key && it.value).map(it => ({ [it.key]: it.value }))
            };

            // Determine final main image
            const mainProductImage = (finalImageUrls.length > 0 ? finalImageUrls[0] : mainVariant?.image) || "";
            const mainProductImages = finalImageUrls.length > 0 ? finalImageUrls : (mainVariant?.images?.map((img: any) => typeof img === 'string' ? img : img.image_url) || []);

            const payload = {
                ...formData,
                utc_id: formData.utc_id || mainVariant?.barcode || '',
                subcategory_id: formData.subcategory_id || null,
                unit_label: mainVariant?.unit_label || formData.unit_label || '',
                price: Number(mainVariant?.price) || 0,
                original_price: Number(mainVariant?.original_price) || 0,
                slug: formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                description: {
                    ...detailsObj
                },
                product_details: JSON.stringify(detailsObj),
                info: detailsObj.info,
                highlights: detailsObj.highlights,
                ingredients: ingredients.filter(i => i),
                features: features.filter(f => f.title).map(f => ({ title: f.title, description: f.description })),
                variants: updatedVariants,
                image: mainProductImage,
                images: mainProductImages,
                thumbnail: mainProductImage,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                order: Number(formData.order)
            };

            const response = await callApi(`/management/admin/products/${productId}`, 'PATCH', payload);
            if (response && (response.status === 'success' || response.id)) {
                showMessage('Product updated successfully', 'success');
                router.push('/products/list');
            } else {
                showMessage(response?.message || 'Failed to update product', 'danger');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center p-10 min-h-[400px]">
                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10"></span>
            </div>
        );
    }

    return (
        <div className="p-1">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline font-medium">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/products/list" className="text-primary hover:underline font-medium">Products</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-medium"><span>Edit Product</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-6">
                <h5 className="text-lg font-bold">Edit Product: <span className="text-primary">{formData.name}</span></h5>
                <Link href="/products/list" className="btn btn-outline-primary gap-2 text-xs font-bold uppercase">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Side: Basic Info & Features */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Basic Information</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Product Name *</label>
                                    <input id="name" type="text" className="form-input" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Brand Name</label>
                                    <input id="brand" type="text" className="form-input" value={formData.brand} onChange={handleChange} />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold uppercase">Barcode (UTC ID) *</label>
                                    <input id="utc_id" type="text" className="form-input font-mono" value={formData.utc_id} onChange={handleChange} placeholder="Scan or enter Barcode" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs font-bold uppercase">Display Order</label>
                                    <input id="order" type="number" className="form-input" value={formData.order} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Short Description</label>
                                    <input id="product_details" type="text" className="form-input" value={formData.product_details} onChange={handleChange} placeholder="Brief summary of the product" />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold uppercase">Full Description</label>
                                        <button
                                            type="button"
                                            className="text-primary text-[10px] font-black underline uppercase flex items-center gap-1 hover:scale-105 transition-transform disabled:opacity-50"
                                            onClick={handleAiGenerate}
                                            disabled={isAiGenerating}
                                        >
                                            {isAiGenerating ? <span className="animate-spin rounded-full border-2 border-primary/30 border-t-primary w-3 h-3" /> : '✨ AI Gen Description'}
                                        </button>
                                    </div>
                                    <textarea id="description" rows={3} className="form-textarea" value={formData.description} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Content (Features & Highlights)</h6>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase mb-3 block text-primary">Features List</label>
                                    {features.map((f, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input placeholder="Feature Title" className="form-input text-xs w-1/3" value={f.title} onChange={(e) => { const nf = [...features]; nf[i].title = e.target.value; setFeatures(nf); }} />
                                            <input placeholder="Feature Description" className="form-input text-xs flex-1" value={f.description} onChange={(e) => { const nf = [...features]; nf[i].description = e.target.value; setFeatures(nf); }} />
                                            <button type="button" className="text-danger" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}>×</button>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-xs btn-outline-primary" onClick={() => setFeatures([...features, { title: '', description: '' }])}>+ Add Feature</button>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <label className="text-xs font-extrabold uppercase mb-3 block text-primary">Product Highlights</label>
                                    {highlights.map((h, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input placeholder={`Highlight #${i + 1}`} className="form-input text-xs" value={h} onChange={(e) => {
                                                const nh = [...highlights]; nh[i] = e.target.value; setHighlights(nh);
                                            }} />
                                            <button type="button" className="text-danger p-1" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} disabled={highlights.length === 1}>×</button>
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-xs btn-primary mt-2" onClick={() => setHighlights([...highlights, ''])}>+ Add Highlight</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase mb-3 block text-info underline decoration-info/30">Ingredients List</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {ingredients.map((ing, i) => (
                                                <div key={i} className="flex gap-2 animate__animated animate__fadeIn">
                                                    <input placeholder={`Ingredient #${i + 1}`} className="form-input text-xs" value={ing} onChange={(e) => {
                                                        const ni = [...ingredients]; ni[i] = e.target.value; setIngredients(ni);
                                                    }} />
                                                    <button type="button" className="text-danger hover:scale-110 transition-transform" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} disabled={ingredients.length === 1}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" className="btn btn-xs btn-outline-info mt-3" onClick={() => setIngredients([...ingredients, ''])}>+ Add Ingredient</button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase mb-3 block text-info">Tech Info</label>
                                        {info.map((it, i) => (
                                            <div key={i} className="flex gap-2 mb-2">
                                                <input placeholder="Key" className="form-input text-xs" value={it.key} onChange={(e) => { const ni = [...info]; ni[i].key = e.target.value; setInfo(ni); }} />
                                                <input placeholder="Value" className="form-input text-xs" value={it.value} onChange={(e) => { const ni = [...info]; ni[i].value = e.target.value; setInfo(ni); }} />
                                                <button type="button" className="text-danger" onClick={() => setInfo(info.filter((_, idx) => idx !== i))}>×</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-xs btn-outline-info" onClick={() => setInfo([...info, { key: '', value: '' }])}>+ Add Info</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h6 className="text-base font-bold text-primary">Variants Inventory</h6>
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => setVariants([...variants, { unit_label: '', unit_type: 'piece', original_price: '', barcode: '', images: [] }])}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Add Another Variant
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {variants.map((v: any, i: number) => (
                                    <div key={i} className="panel bg-white dark:bg-black/20 border border-gray-200 shadow-sm animate__animated animate__fadeInUp relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4 bg-gray-50/50 dark:bg-white/5 -m-5 px-5 py-3 border-b border-gray-100">
                                            <span className="text-xs font-black uppercase text-gray-400"># Variant {i + 1}</span>
                                            <button type="button" className="text-danger hover:bg-danger/10 p-1.5 rounded-full transition-colors" onClick={() => setVariants(variants.filter((_, idx: number) => idx !== i))} disabled={variants.length === 1}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="p-4 bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="text-[10px] font-black uppercase text-gray-400">Variant Images</label>
                                                    <a
                                                        href={`https://www.google.com/search?q=${encodeURIComponent((formData.brand || '') + ' ' + (formData.name || '') + ' ' + (v.unit_label || '') + ' image')}&tbm=isch`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-xs btn-outline-secondary gap-1.5 font-extrabold uppercase py-1 text-[9px]"
                                                    >
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                            <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                        </svg>
                                                        Search {v.unit_label || 'Variant'} Image
                                                    </a>
                                                </div>
                                                <ImageUploading
                                                    multiple
                                                    value={Array.isArray(v.images) ? (typeof v.images[0] === 'string' ? v.images.map((url: string) => ({ dataURL: url })) : v.images) : []}
                                                    onChange={(imageList) => {
                                                        const nv = [...variants];
                                                        nv[i].images = imageList;
                                                        setVariants(nv);
                                                    }}
                                                    maxNumber={5}
                                                >
                                                    {({ imageList, onImageUpload, onImageRemove, isDragging, dragProps }) => (
                                                        <div className="flex flex-wrap gap-3">
                                                            {imageList.map((image, index) => (
                                                                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100 shadow-xs bg-white">
                                                                    <img src={image.dataURL} alt="" className="w-full h-full object-cover" />
                                                                    <button type="button" className="absolute top-0 right-0 bg-danger text-white p-0.5 rounded-bl hover:bg-danger/80" onClick={() => onImageRemove(index)}>
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                className={`w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`}
                                                                onClick={onImageUpload}
                                                                {...dragProps}
                                                            >
                                                                <IconCamera className="w-5 h-5 text-gray-400" />
                                                                <span className="text-[8px] font-bold uppercase text-gray-400 mt-1">Add Image</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </ImageUploading>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400">Unit Label</label>
                                                    <input className="form-input py-2 text-sm" value={v.unit_label} onChange={(e) => { const nv = [...variants]; nv[i].unit_label = e.target.value; setVariants(nv); }} placeholder="e.g. 1 Unit" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400">Barcode (UTC)</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => generateUtc(i)}
                                                            className="text-[10px] font-bold text-primary hover:underline underline-offset-4"
                                                        >
                                                            GENERATE
                                                        </button>
                                                    </div>
                                                    <input className="form-input py-2 text-sm" value={v.barcode} onChange={(e) => {
                                                        const val = e.target.value;
                                                        const nv = [...variants]; nv[i].barcode = val; setVariants(nv);
                                                    }} placeholder="Scan Barcode" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400">MRP (Price)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-2 text-gray-400 text-xs">₹</span>
                                                        <input className="form-input py-2 pl-5 text-sm font-bold text-danger" value={v.original_price} onChange={(e) => { const nv = [...variants]; nv[i].original_price = e.target.value; setVariants(nv); }} placeholder="0.00" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-primary">Selling Price</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-2 text-gray-400 text-xs">₹</span>
                                                        <input className="form-input py-2 pl-5 text-sm font-bold text-primary" value={v.price} onChange={(e) => { const nv = [...variants]; nv[i].price = e.target.value; setVariants(nv); }} placeholder="0.00" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Category, SEO */}
                    <div className="space-y-6">
                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2 text-primary">Main Image (Thumbnail)</h6>
                            <div className="space-y-4">
                                <ImageUploading
                                    value={images}
                                    onChange={onImageChange}
                                    maxNumber={1}
                                >
                                    {({ imageList, onImageUpload, onImageRemove, isDragging, dragProps }) => (
                                        <div className="upload__image-wrapper">
                                            {imageList.length === 0 ? (
                                                <button
                                                    type="button"
                                                    className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`}
                                                    onClick={onImageUpload}
                                                    {...dragProps}
                                                >
                                                    <div className="bg-primary/10 p-3 rounded-full">
                                                        <IconCamera className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500">UPLOAD MAIN IMAGE</p>
                                                    <p className="text-[10px] text-gray-400">Max size 1MB (Recommended 800x800)</p>
                                                </button>
                                            ) : (
                                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white aspect-square w-full">
                                                    <img src={imageList[0].dataURL} alt="main" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button type="button" className="btn btn-sm btn-primary py-1 px-3 text-[10px]" onClick={() => onImageUpload()}>CHANGE</button>
                                                        <button type="button" className="btn btn-sm btn-danger py-1 px-3 text-[10px]" onClick={() => onImageRemove(0)}>REMOVE</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ImageUploading>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Category Map</h6>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1">1. Parent (L1)</label>
                                    <Select
                                        options={parentCategories.map(c => ({ value: c._id, label: c.name }))}
                                        onChange={(selected) => handleCategoryChange(selected, 'p_category')}
                                        isLoading={fetchingL1}
                                        placeholder="Search Root..."
                                        className="text-xs font-bold"
                                        value={parentCategories.find(c => c._id === formData.p_category) ? { value: formData.p_category, label: parentCategories.find(c => c._id === formData.p_category).name } : null}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1">2. Category (L2)</label>
                                    <Select
                                        options={level2Categories.map(c => ({ value: c._id, label: c.name }))}
                                        onChange={(selected) => handleCategoryChange(selected, 'categoryId')}
                                        isLoading={fetchingL2}
                                        placeholder="Search Branch..."
                                        className="text-xs font-bold"
                                        value={level2Categories.find(c => c._id === formData.categoryId) ? { value: formData.categoryId, label: level2Categories.find(c => c._id === formData.categoryId).name } : null}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1">3. Sub (L3)</label>
                                    <Select
                                        options={level3Categories.map(c => ({ value: c._id, label: c.name }))}
                                        onChange={(selected) => handleCategoryChange(selected, 'subcategory_id')}
                                        isLoading={fetchingL3}
                                        placeholder="Search Leaf..."
                                        className="text-xs font-bold"
                                        value={level3Categories.find(c => c._id === formData.subcategory_id) ? { value: formData.subcategory_id, label: level3Categories.find(c => c._id === formData.subcategory_id).name } : null}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t mt-4 border-gray-100">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Product Active Status</span>
                                    <Toggle checked={formData.isActive} onChange={(v) => setFormData({ ...formData, isActive: v })} />
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">SEO Settings</h6>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase">Meta Title</label>
                                    <input id="metaTitle" type="text" className="form-input" value={formData.metaTitle} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase">Meta Description</label>
                                    <textarea id="metaDescription" rows={3} className="form-textarea" value={formData.metaDescription} onChange={handleChange}></textarea>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase">Tags (Keywords)</label>
                                    <input id="tags" type="text" className="form-input" value={formData.tags} onChange={handleChange} placeholder="grocery, fresh, etc." />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel sticky bottom-0 z-10 flex justify-end gap-3 shadow-lg">
                    <button type="button" className="btn btn-outline-danger px-8" onClick={() => router.push('/products/list')}>Discard</button>
                    <button type="submit" className="btn btn-primary px-10 gap-2" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white/30 border-t-white w-4 h-4" /> : <IconSave className="h-4 w-4" />}
                        {loading ? 'Processing...' : 'Update Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
