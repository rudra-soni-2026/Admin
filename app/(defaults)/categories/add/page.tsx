'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import IconMenuPages from '@/components/icon/menu/icon-menu-pages';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import IconX from '@/components/icon/icon-x';
import IconCamera from '@/components/icon/icon-camera';
import Select from 'react-select';

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

export default function AddCategory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingParents, setFetchingParents] = useState(false);
    const [fetchingL1, setFetchingL1] = useState(false);
    const [l0Categories, setL0Categories] = useState<any[]>([]);
    const [l1Categories, setL1Categories] = useState<any[]>([]);
    const [selectedL0, setSelectedL0] = useState<string>('');
    const [images, setImages] = useState<ImageListType>([]);

    const [formData, setFormData] = useState({
        name: '',
        image: '',
        parentId: '',
        level: 0,
        isActive: true,
        bg_color: '#F4F4F4',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        order: 0
    });

    // Fetch L0 categories on mount
    useEffect(() => {
        fetchL0();
    }, []);

    // Clear and handle L1 fetching when L0 changes
    useEffect(() => {
        if (selectedL0 && formData.level === 2) {
            fetchL1(selectedL0);
        } else {
            setL1Categories([]);
            if (formData.level === 1) {
                setFormData(prev => ({ ...prev, parentId: selectedL0 }));
            } else {
                setFormData(prev => ({ ...prev, parentId: '' }));
            }
        }
    }, [selectedL0, formData.level]);

    // Handle initial state when level changes
    useEffect(() => {
        setSelectedL0('');
        setL1Categories([]);
        setFormData(prev => ({ ...prev, parentId: '' }));
    }, [formData.level]);

    const fetchL0 = async () => {
        try {
            setFetchingParents(true);
            const response = await callApi('/products/parent-categories?level=0', 'GET');
            const data = response?.data || response || [];
            if (Array.isArray(data)) setL0Categories(data);
        } catch (error) {
            console.error('L0 Error:', error);
        } finally {
            setFetchingParents(false);
        }
    };

    const fetchL1 = async (parentId: string) => {
        try {
            setFetchingL1(true);
            const response = await callApi(`/management/admin/sub-categories/${parentId}`, 'GET');
            const data = response?.data?.subCategories || response?.data || response?.subCategories || response || [];
            if (Array.isArray(data)) setL1Categories(data);
        } catch (error) {
            console.error('L1 Error:', error);
        } finally {
            setFetchingL1(false);
        }
    };

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === 'level' || id === 'order' ? (parseInt(value) || 0) : value
        }));
    };

    const handleToggle = (key: string, value: boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const onImageChange = (imageList: ImageListType) => {
        // Validation: Max size 1MB
        const largeFile = imageList.find(img => img.file && img.file.size > 1024 * 1024);
        if (largeFile) {
            showMessage(`Selected image is too large. Max size 1MB.`, 'danger');
            return;
        }

        setImages(imageList);
        if (imageList.length > 0) {
            setFormData(prev => ({ ...prev, image: imageList[0].dataURL || '' }));
        } else {
            setFormData(prev => ({ ...prev, image: '' }));
        }
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            showCloseButton: true,
            customClass: {
                popup: `color-${type}`,
                container: 'toast-container',
            },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.level > 0 && !formData.parentId) {
            showMessage('Please select a parent category.', 'danger');
            return;
        }

        try {
            setLoading(true);
            
            // Start with current image value (likely "" or existing URL)
            // NEVER send base64 dataURL to the create API
            let finalImageUrl = "";

            // Step 1: Upload image to /upload if a file is selected
            if (images.length > 0 && images[0].file) {
                // Check image size (limit to 1MB)
                if (images[0].file.size > 1024 * 1024) {
                    showMessage('Image size exceeds 1MB limit. Please upload a smaller image.', 'danger');
                    setLoading(false);
                    return;
                }
                const uploadData = new FormData();
                uploadData.append('images', images[0].file);

                const uploadRes = await callApi('/upload', 'POST', uploadData);
                 console.log(uploadRes,"uploadResuploadResuploadResuploadRes")
                if (uploadRes && uploadRes.status === 'success' && uploadRes.data?.[0]?.url) {
                    finalImageUrl = uploadRes.data[0].url;
                } else {
                    showMessage('Image upload failed. Please try again.', 'danger');
                    setLoading(false);
                    return;
                }
            } else if (formData.image && !formData.image.startsWith('data:')) {
                // If it's already a URL (e.g. edit mode or manual input), use it
                finalImageUrl = formData.image;
            }

            // Step 2: Create category with the sanitized payload
            const payload = {
                name: formData.name,
                image: finalImageUrl,
                parentId: Number(formData.level) === 0 ? null : (formData.parentId || null),
                level: Number(formData.level),
                isActive: Boolean(formData.isActive),
                bg_color: formData.bg_color,
                metaTitle: formData.metaTitle,
                metaDescription: formData.metaDescription,
                metaKeywords: formData.metaKeywords,
                order: Number(formData.order)
            };

            const response = await callApi('/management/admin/categories', 'POST', payload);

            if (response && (response.status === 'success' || response.id)) {
                showMessage('Category created successfully', 'success');
                router.push('/categories/list');
            } else {
                showMessage(response?.message || 'Failed to create category', 'danger');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while creating category.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline font-medium">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/categories/list" className="text-primary hover:underline font-medium">Categories</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-medium"><span>Add Category</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-6 border-[#e0e6ed] dark:border-[#1b2e4b] shadow-sm">
                <div className="flex flex-col">
                    <h5 className="text-lg font-bold dark:text-white-light">Create New Category</h5>
                </div>
                <Link href="/categories/list" className="btn btn-outline-primary gap-2 text-xs font-bold uppercase tracking-wider">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <div className="panel border-[#e0e6ed] dark:border-[#1b2e4b] shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Selector Level UI - More Premium */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-3 block">Category Depth / Level</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { val: 0, label: 'Parent Category', desc: 'Root level (Layer 0)' },
                                    { val: 1, label: 'Category', desc: 'Main category (Layer 1)' },
                                    { val: 2, label: 'Sub Category', desc: 'Lowest level (Layer 2)' }
                                ].map((lvl) => (
                                    <div 
                                        key={lvl.val}
                                        onClick={() => setFormData({...formData, level: lvl.val, parentId: ''})}
                                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                                            formData.level === lvl.val 
                                            ? 'border-primary bg-primary/5 shadow-inner' 
                                            : 'border-gray-100 dark:border-gray-800 hover:border-primary/50 bg-white dark:bg-black/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold ${formData.level === lvl.val ? 'text-primary' : 'text-gray-700 dark:text-white-dark'}`}>{lvl.label}</span>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.level === lvl.val ? 'border-primary' : 'border-gray-300'}`}>
                                                {formData.level === lvl.val && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{lvl.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div className={formData.level === 0 ? "md:col-span-2" : ""}>
                            <label htmlFor="name" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Category Name *</label>
                            <input id="name" type="text" placeholder="e.g. Beverages or Soft Drinks" className="form-input py-2 text-sm" value={formData.name} onChange={handleChange} required />
                        </div>

                        {/* Parent Dropdown (Hierarchical) */}
                        {formData.level > 0 && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-black/10 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 block">
                                        1. Select Root Category
                                    </label>
                                    <Select
                                        placeholder={fetchingParents ? "Loading..." : "Search Root..."}
                                        options={l0Categories.map(c => ({ value: c.id || c._id, label: c.name, image: c.image }))}
                                        value={l0Categories.map(c => ({ value: c.id || c._id, label: c.name, image: c.image })).find(o => o.value === selectedL0)}
                                        onChange={(sel: any) => setSelectedL0(sel?.value || '')}
                                        isLoading={fetchingParents}
                                        formatOptionLabel={(option: any) => (
                                            <div className="flex items-center gap-3">
                                                {option.image ? <img src={option.image} className="w-6 h-6 rounded-md object-cover shadow-sm" alt="" /> : <div className="w-6 h-6 rounded-md bg-gray-200" />}
                                                <span className="font-medium text-sm">{option.label}</span>
                                            </div>
                                        )}
                                        className="text-sm"
                                    />
                                </div>
                                {formData.level === 2 && (
                                    <div>
                                        <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 block">
                                            2. Select Sub-Category
                                        </label>
                                        <Select
                                            placeholder={fetchingL1 ? "Loading..." : "Search Category..."}
                                            options={l1Categories.map(c => ({ value: c.id || c._id, label: c.name, image: c.image }))}
                                            value={l1Categories.map(c => ({ value: c.id || c._id, label: c.name, image: c.image })).find(o => o.value === formData.parentId)}
                                            onChange={(sel: any) => setFormData(prev => ({ ...prev, parentId: sel?.value || '' }))}
                                            isDisabled={!selectedL0 || fetchingL1}
                                            isLoading={fetchingL1}
                                            formatOptionLabel={(option: any) => (
                                                <div className="flex items-center gap-3">
                                                    {option.image ? <img src={option.image} className="w-6 h-6 rounded-md object-cover shadow-sm" alt="" /> : <div className="w-6 h-6 rounded-md bg-gray-200" />}
                                                    <span className="font-medium text-sm">{option.label}</span>
                                                </div>
                                            )}
                                            className="text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Image Selection - Show for ALL levels */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Category Image</label>
                            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <ImageUploading value={images} onChange={onImageChange} maxNumber={1}>
                                    {({ imageList, onImageUpload, onImageUpdate, onImageRemove, dragProps }) => (
                                        <div className="flex items-center gap-4">
                                            {imageList.length === 0 ? (
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/40 hover:bg-primary/5 transition-all w-full justify-center"
                                                    onClick={onImageUpload}
                                                    {...dragProps}
                                                >
                                                    <IconCamera className="w-5 h-5 text-primary" />
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Click or Drag to Upload Image</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                                                        <img src={imageList[0].dataURL} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="text-xs font-bold text-gray-700 dark:text-white-light">Image Selected</div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => onImageUpdate(0)} className="btn btn-xs btn-outline-primary px-2 py-1 text-[10px]">Change</button>
                                                            <button type="button" onClick={() => onImageRemove(0)} className="btn btn-xs btn-outline-danger px-2 py-1 text-[10px]">Remove</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ImageUploading>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="order" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Display Priority (Order)</label>
                            <input id="order" type="number" placeholder="0" className="form-input py-2 text-sm" value={formData.order} onChange={handleChange} />
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/20 px-4 py-2 rounded-lg w-fit">
                            <Toggle checked={formData.isActive} onChange={(v) => handleToggle('isActive', v)} />
                            <span className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight">Active & Visible</span>
                        </div>

                        {/* SEO Section - Expanded with Icons */}
                        <div className="md:col-span-2 mt-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <h6 className="text-sm font-bold mb-5 flex items-center gap-2 text-primary">
                                <IconMenuPages className="w-4 h-4" /> SEO & Discoverability
                            </h6>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label htmlFor="metaTitle" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Meta Title</label>
                                    <input id="metaTitle" type="text" placeholder="Title for Google results..." className="form-input py-2 text-sm bg-white dark:bg-black" value={formData.metaTitle} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="metaKeywords" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Meta Keywords</label>
                                    <input id="metaKeywords" type="text" placeholder="Keywords separated by commas" className="form-input py-2 text-sm bg-white dark:bg-black" value={formData.metaKeywords} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="metaDescription" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Meta Description</label>
                                    <textarea id="metaDescription" rows={3} placeholder="Engaging description for search results..." className="form-textarea py-2 text-sm bg-white dark:bg-black" value={formData.metaDescription} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
                        <button type="button" className="btn btn-outline-danger px-8 font-bold uppercase tracking-wider text-[11px]" onClick={() => router.push('/categories/list')} disabled={loading}>
                            Discard
                        </button>
                        <button type="submit" className="btn btn-primary px-12 gap-2 font-bold uppercase tracking-wider text-[11px]" disabled={loading}>
                            {loading ? (
                                <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span>
                            ) : (
                                <IconSave className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : 'Create Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
