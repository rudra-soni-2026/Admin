'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import IconMenuPages from '@/components/icon/menu/icon-menu-pages';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import IconCamera from '@/components/icon/icon-camera';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-200 ease-in-out ${
            checked ? 'bg-primary' : 'bg-gray-200'
        }`}
    >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-200 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
);

export default function AddProduct() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        price: '',
        p_category: '', 
        categoryId: '', 
        subcategory_id: '', 
        unit_label: '',
        brand: '',
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

    const [features, setFeatures] = useState([{ title: '', description: '' }]);
    const [ingredients, setIngredients] = useState(['']);
    const [info, setInfo] = useState([{ key: '', value: '' }]);
    const [variants, setVariants] = useState<any[]>([]);

    useEffect(() => {
        fetchL1();
        if (utcRef.current) {
            utcRef.current.focus();
        }
    }, []);

    const fetchL1 = async () => {
        try {
            setFetchingL1(true);
            const response = await callApi('/products/parent-categories?level=0', 'GET');
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
            const response = await callApi(`/products/parent-categories?parentId=${parentId}&level=1`, 'GET');
            const data = response?.data || response || [];
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
            const response = await callApi(`/products/parent-categories?parentId=${parentId}&level=2`, 'GET');
            const data = response?.data || response || [];
            if (Array.isArray(data)) setLevel3Categories(data);
        } catch (error) {
            console.error('L3 Error:', error);
        } finally {
            setFetchingL3(false);
        }
    };

    const fetchProductByUtc = async (utc: string) => {
        if (!utc || utc.length < 8) return;
        try {
            setFetchingUtc(true);
            const fields = 'product_name,product_name_en,brands,quantity,ingredients_text,generic_name,_keywords,image_url,image_front_url,image_ingredients_url,image_nutrition_url,image_packaging_url,selected_images,ingredients_analysis_tags,manufacturing_places,countries,nutriscore_grade,nova_group,code,packaging,additives_n,nutriments,nutrition_data_per';
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${utc}.json?fields=${fields}`);
            const data = await response.json();
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
                    original_price: prev.original_price // Ensure MRP is preserved
                }));

                if (p.ingredients_text) {
                    const ingList = p.ingredients_text.split(',').map((i: string) => i.trim()).filter((i: string) => i);
                    if (ingList.length > 0) {
                        setIngredients(ingList);
                    } else {
                        setIngredients([p.ingredients_text]);
                    }
                }
                
                const apiImages = [
                    p.image_url, 
                    p.image_front_url, 
                    p.image_ingredients_url, 
                    p.image_nutrition_url, 
                    p.image_packaging_url,
                    p.selected_images?.front?.display?.en,
                    p.selected_images?.ingredients?.display?.en,
                    p.selected_images?.nutrition?.display?.en,
                    p.selected_images?.packaging?.display?.en
                ].filter(url => url);

                if (apiImages.length > 0) {
                    // Map to ImageUploading format, ensuring uniqueness
                    const uniqueImages = Array.from(new Set(apiImages)).map(url => ({ dataURL: url }));
                    setImages(uniqueImages);
                }

                // Auto-fill Features List
                const newFeatures: { title: string, description: string }[] = [];
                
                // 1. Dietary Info
                if (p.ingredients_analysis_tags) {
                    const dietTags = p.ingredients_analysis_tags
                        .map((tag: string) => tag.replace('en:', '').replace(/-/g, ' '))
                        .filter((tag: string) => tag.includes('vegan') || tag.includes('vegetarian') || tag.includes('palm oil free'));
                    if (dietTags.length > 0) {
                        newFeatures.push({ title: 'Dietary Policy', description: dietTags.join(', ').toUpperCase() });
                    }
                }

                // 2. Origin
                if (p.manufacturing_places || p.countries) {
                    newFeatures.push({ title: 'Product Origin', description: p.manufacturing_places || p.countries });
                }

                // 3. Nutri-Score & Nova
                if (p.nutriscore_grade) {
                    newFeatures.push({ title: 'Nutri-Score', description: `Grade ${p.nutriscore_grade.toUpperCase()}` });
                }
                if (p.nova_group) {
                    const novaMsgs: Record<number, string> = {
                        1: 'Unprocessed or minimally processed foods',
                        2: 'Processed culinary ingredients',
                        3: 'Processed foods',
                        4: 'Ultra-processed food products'
                    };
                    newFeatures.push({ title: 'Processing Level', description: novaMsgs[p.nova_group as number] || `Group ${p.nova_group}` });
                }

                if (newFeatures.length > 0) {
                    setFeatures(newFeatures);
                }

                // 4. Auto-fill Tech Info
                const newInfo: { key: string, value: string }[] = [];
                newInfo.push({ key: 'Barcode', value: p.code || utc });
                if (p.packaging) newInfo.push({ key: 'Packaging', value: p.packaging });
                if (p.additives_n >= 0) newInfo.push({ key: 'Additives Count', value: String(p.additives_n) });
                
                // Add Nutriments if available
                if (p.nutriments) {
                    const n = p.nutriments;
                    const per = p.nutrition_data_per || '100g';
                    if (n['energy-kcal_value']) newInfo.push({ key: `Energy (${per})`, value: `${n['energy-kcal_value']} kcal` });
                    if (n.proteins_value) newInfo.push({ key: `Proteins (${per})`, value: `${n.proteins_value}g` });
                    if (n.fat_value) newInfo.push({ key: `Fat (${per})`, value: `${n.fat_value}g` });
                    if (n.carbohydrates_value) newInfo.push({ key: `Carbs (${per})`, value: `${n.carbohydrates_value}g` });
                    if (n.salt_value) newInfo.push({ key: `Salt (${per})`, value: `${n.salt_value}g` });
                }

                if (newInfo.length > 0) {
                    setInfo(newInfo);
                }

                showMessage('Product data auto-filled!', 'success');
            }
        } catch (error) {
            console.error('UTC Fetch Error:', error);
        } finally {
            setFetchingUtc(false);
        }
    };

    const handleCategoryChange = (e: any) => {
        const { id, value } = e.target;
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
        if (id === 'utc_id' && value.length >= 8) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                fetchProductByUtc(value);
            }, 300); // 1 second debounce
        }
    };

    const onImageChange = (imageList: ImageListType) => {
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
            
            // Collect existing URLs (e.g. from API auto-fill)
            let finalImageUrls: string[] = images
                .filter(img => !img.file && img.dataURL)
                .map(img => img.dataURL as string);

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
                } else {
                    showMessage('Image upload failed.', 'danger');
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                ...formData,
                price: variants.length > 0 ? Number(variants[0].price) : 0,
                original_price: Number(formData.original_price) || 0,
                slug: formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                description: formData.description,
                info: info.filter(i => i.key && i.value).map(i => ({ [i.key]: i.value })),
                highlights: [],
                ingredients: ingredients.filter(i => i),
                features: features.filter(f => f.title),
                variants: variants.filter(v => v.unit_label).map(v => ({
                    ...v,
                    price: Number(v.price),
                    original_price: Number(v.original_price) || Number(formData.original_price) || 0
                })),
                image: finalImageUrls.length > 0 ? finalImageUrls[0] : "",
                images: finalImageUrls,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                order: Number(formData.order)
            };

            const response = await callApi('/management/admin/products', 'POST', payload);
            if (response && (response.status === 'success' || response.id)) {
                showMessage('Product created successfully', 'success');
                router.push('/products/list');
            } else {
                showMessage(response?.message || 'Failed to create product', 'danger');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline font-medium">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/products/list" className="text-primary hover:underline font-medium">Products</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-medium"><span>Add Product</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-6">
                <h5 className="text-lg font-bold">Create New Product</h5>
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
                                    <label className="text-xs font-bold uppercase flex items-center gap-2">
                                        UTC ID (Scan Barcode)
                                        {fetchingUtc && <span className="animate-spin rounded-full border-2 border-primary/30 border-t-primary w-3 h-3" />}
                                    </label>
                                    <input ref={utcRef} id="utc_id" type="text" className="form-input" value={formData.utc_id} onChange={handleChange} placeholder="e.g. 8906017290033" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Product Name *</label>
                                    <input id="name" type="text" className="form-input" value={formData.brand + " " + formData.name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase">Brand Name</label>
                                    <input id="brand" type="text" className="form-input" value={formData.brand} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase">Unit Label (e.g. 1kg)</label>
                                    <input id="unit_label" type="text" className="form-input" value={formData.unit_label} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-danger font-black tracking-widest">MRP (Original Price) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                            <input id="original_price" type="text" className="form-input pl-8 border-danger/30 focus:border-danger transition-all font-bold text-danger" value={formData.original_price} onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                setFormData(prev => ({ ...prev, original_price: val }));
                                            }} placeholder="0.00" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 italic">* Original Market Price</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-success font-black tracking-widest">Selling Price (Offer Price) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                            <input id="price" type="text" className="form-input pl-8 border-success/30 focus:border-success transition-all font-bold text-success" value={formData.price} onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                setFormData(prev => ({ ...prev, price: val }));
                                            }} placeholder="0.00" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 italic">* Price customer will pay</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase">Display Order</label>
                                    <input id="order" type="number" className="form-input" value={formData.order} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Short Description</label>
                                    <input id="product_details" type="text" className="form-input" value={formData.product_details} onChange={handleChange} placeholder="Brief summary of the product" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase">Full Description</label>
                                    <textarea id="description" rows={3} className="form-textarea" value={formData.description} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Content (Features & Ingredients)</h6>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase mb-3 block text-info underline decoration-info/30">Ingredients List</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {ingredients.map((ing, i) => (
                                                <div key={i} className="flex gap-2 animate__animated animate__fadeIn">
                                                    <input placeholder={`Ingredient #${i+1}`} className="form-input text-xs" value={ing} onChange={(e) => { 
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

                        {/* <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Variants Inventory</h6>
                            <div className="space-y-4">
                                {variants.map((v, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-black/20 rounded border border-gray-100 flex flex-wrap gap-2 items-end">
                                        <div className="flex-1 min-w-[100px]"><label className="text-[10px] uppercase font-bold text-gray-400">Label</label><input className="form-input py-1 text-xs" value={v.unit_label} onChange={(e) => { const nv = [...variants]; nv[i].unit_label = e.target.value; setVariants(nv); }} /></div>
                                        <div className="flex-1 min-w-[80px]"><label className="text-[10px] uppercase font-bold text-gray-400">Type</label><input className="form-input py-1 text-xs" value={v.unit_type} onChange={(e) => { const nv = [...variants]; nv[i].unit_type = e.target.value; setVariants(nv); }} /></div>
                                        <div className="flex-1 min-w-[80px]"><label className="text-[10px] uppercase font-bold text-gray-400">MRP</label><input className="form-input py-1 text-xs" type="number" value={v.original_price} onChange={(e) => { const nv = [...variants]; nv[i].original_price = Number(e.target.value); setVariants(nv); }} /></div>
                                        <div className="flex-1 min-w-[80px]"><label className="text-[10px] uppercase font-bold text-gray-400">Sell Price</label><input className="form-input py-1 text-xs" type="number" value={v.price} onChange={(e) => { const nv = [...variants]; nv[i].price = Number(e.target.value); setVariants(nv); }} /></div>
                                        <div className="flex-1 min-w-[80px]"><label className="text-[10px] uppercase font-bold text-gray-400">Stock</label><input className="form-input py-1 text-xs" type="number" value={v.stock} onChange={(e) => { const nv = [...variants]; nv[i].stock = Number(e.target.value); setVariants(nv); }} /></div>
                                        <div className="flex-1 min-w-[80px]"><label className="text-[10px] uppercase font-bold text-gray-400">SKU</label><input className="form-input py-1 text-xs" value={v.sku} onChange={(e) => { const nv = [...variants]; nv[i].sku = e.target.value; setVariants(nv); }} /></div>
                                        <button type="button" className="text-danger p-1" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>×</button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-xs btn-primary" onClick={() => setVariants([...variants, { unit_label: '', unit_type: '', price: 0, original_price: 0, stock: 0, sku: '', images: [] }])}>+ Add Variant</button>
                            </div>
                        </div> */}
                    </div>

                    {/* Right Side: Image, Category, SEO */}
                    <div className="space-y-6">
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5 border-b pb-2">
                                <h6 className="text-base font-bold">Product Images</h6>
                                <a 
                                    href={`https://www.google.com/search?q=${encodeURIComponent((formData.brand || '') + ' ' + (formData.name || 'product') + ' image')}&tbm=isch&as_filetype=webp`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-xs btn-outline-secondary gap-1.5 font-bold uppercase py-1"
                                    title="Search on Google Images"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Search Google
                                </a>
                            </div>
                            <ImageUploading value={images} onChange={onImageChange} maxNumber={10} multiple>
                                {({ imageList, onImageUpload, onImageUpdate, onImageRemove, dragProps }) => (
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 bg-gray-50/20" onClick={onImageUpload} {...dragProps}>
                                            <IconCamera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-400 font-bold uppercase">Click or Drag to Upload (Max 10)</p>
                                        </div>
                                        {imageList.length > 0 && (
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                                                {imageList.map((image, index) => (
                                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-100 shadow-sm aspect-square bg-gray-50">
                                                        <img src={image.dataURL} className="w-full h-full object-cover" alt={`Product ${index}`} />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" className="text-white p-1 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onImageUpdate(index); }}>
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                            </button>
                                                            <button type="button" className="text-white p-1 hover:text-danger transition-colors" onClick={(e) => { e.stopPropagation(); onImageRemove(index); }}>
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-1 left-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                                                            {index === 0 ? 'Primary' : `Image ${index + 1}`}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ImageUploading>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">Category Map</h6>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Parent (L1)</label>
                                    <select id="p_category" className="form-select text-sm py-1.5" value={formData.p_category} onChange={handleCategoryChange} required>
                                        <option value="">Select Root</option>
                                        {parentCategories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Category (L2)</label>
                                    <select id="categoryId" className="form-select text-sm py-1.5" value={formData.categoryId} onChange={handleCategoryChange} required disabled={!formData.p_category}>
                                        <option value="">Select Branch</option>
                                        {level2Categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Sub (L3)</label>
                                    <select id="subcategory_id" className="form-select text-sm py-1.5" value={formData.subcategory_id} onChange={handleCategoryChange} required disabled={!formData.categoryId}>
                                        <option value="">Select Leaf</option>
                                        {level3Categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="pt-4 border-t flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase">Active Status</span>
                                    <Toggle checked={formData.isActive} onChange={() => setFormData({...formData, isActive: !formData.isActive})} />
                                </div>
                            </div>
                        </div>

                        <div className="panel">
                            <h6 className="text-base font-bold mb-5 border-b pb-2">SEO Settings</h6>
                            <div className="space-y-3">
                                <div><label className="text-[10px] font-bold uppercase text-gray-400">Meta Tags</label><input id="tags" className="form-input text-xs" value={formData.tags} onChange={handleChange} placeholder="comma, separated" /></div>
                                <div><label className="text-[10px] font-bold uppercase text-gray-400">Meta Title</label><input id="metaTitle" className="form-input text-xs" value={formData.metaTitle} onChange={handleChange} /></div>
                                <div><label className="text-[10px] font-bold uppercase text-gray-400">Meta Desc</label><textarea id="metaDescription" rows={2} className="form-textarea text-xs" value={formData.metaDescription} onChange={handleChange}></textarea></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel sticky bottom-0 z-10 flex justify-end gap-3 shadow-lg">
                    <button type="button" className="btn btn-outline-danger px-8" onClick={() => router.push('/products/list')}>Discard</button>
                    <button type="submit" className="btn btn-primary px-10 gap-2" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white/30 border-t-white w-4 h-4" /> : <IconSave className="h-4 w-4" />}
                        {loading ? 'Processing...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
