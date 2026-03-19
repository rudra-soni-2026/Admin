'use client';
import React, { useState } from 'react';
import { HeaderTabConfig } from '@/types/company';
import IconX from '@/components/icon/icon-x';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import Select from 'react-select';

interface TabSettingsDetailProps {
    tab: HeaderTabConfig;
    categoryList: any[];
    productList: any[];
    categorySubCategories: { [key: string]: any[] };
    subCategoryNicheCategories: { [key: string]: any[] };
    categoryProducts: { [key: string]: any[] };
    onSave: (updatedTab: HeaderTabConfig) => void;
    onClose: () => void;
    fetchSubCategories: (catId: string) => void;
    fetchNicheCategories: (subCatId: string) => void;
    fetchProducts: (catId: string) => void;
}

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const TabSettingsDetail = ({
    tab,
    categoryList,
    productList,
    categorySubCategories,
    subCategoryNicheCategories,
    categoryProducts,
    onSave,
    onClose,
    fetchSubCategories,
    fetchNicheCategories,
    fetchProducts
}: TabSettingsDetailProps) => {
    const [formData, setFormData] = useState<HeaderTabConfig>({ 
        ...tab,
        festive_single_banners: tab.festive_single_banners || Array(4).fill({ image: '', parent_category_id: '' }),
        festive_multi_banner: tab.festive_multi_banner || { parent_category_id: '', items: [] }
    });
    const [heroImages, setHeroImages] = useState<ImageListType>(tab.festive_banner_url ? [{ data_url: tab.festive_banner_url }] : []);

    const handleChange = (field: keyof HeaderTabConfig, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSingleBannerChange = (idx: number, field: string, value: any) => {
        const next = [...(formData.festive_single_banners || [])];
        next[idx] = { ...next[idx], [field]: value };
        handleChange('festive_single_banners', next);
    };

    const handleMultiBannerChange = (field: string, value: any) => {
        const next = { ...(formData.festive_multi_banner || { parent_category_id: '', items: [] }), [field]: value };
        handleChange('festive_multi_banner', next);
    };

    const handleSave = () => {
        onSave(formData);
    };

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            borderRadius: '8px',
            border: '1px solid #e0e6ed',
            boxShadow: 'none',
            '&:hover': { border: '1px solid #4361ee' },
            minHeight: '42px',
            backgroundColor: 'transparent',
            fontSize: '12px'
        }),
        menu: (base: any) => ({
            ...base,
            borderRadius: '8px',
            border: '1px solid #e0e6ed',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            zIndex: 50
        })
    };

    return (
        <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-100 dark:border-white/5 space-y-8 animate__animated animate__fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl text-xl font-bold">
                        {formData.icon || '★'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {formData.name} <span className="text-gray-400 font-medium text-sm ml-2">Configuration</span>
                        </h2>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Edit tab specific settings and campaigns</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                    >
                        <IconX className="w-5 h-5" />
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="btn btn-primary px-6 gap-2"
                    >
                        <IconSave className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* Left Column: Visuals & Toggle */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        {/* Festive Activation */}
                        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Festive Sale Mode</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Enable special banners and theme for this tab</p>
                                </div>
                                <Toggle 
                                    checked={!!formData.is_festive_active} 
                                    onChange={(val) => handleChange('is_festive_active', val)} 
                                />
                            </div>
                        </div>

                        {/* Banner Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Festive Hero Banner (1000x240)</label>
                            <ImageUploading
                                value={heroImages}
                                onChange={(img) => {
                                    setHeroImages(img);
                                    if (img.length > 0) handleChange('festive_banner_url', img[0].data_url);
                                }}
                                maxNumber={1}
                            >
                                {({ imageList, onImageUpload, onImageUpdate, onImageRemove, dragProps }) => (
                                    <div className="relative">
                                        {imageList.length > 0 ? (
                                            <div className="relative aspect-[1000/240] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group">
                                                <img src={imageList[0].data_url} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                                                    <button type="button" onClick={() => onImageUpdate(0)} className="btn btn-sm btn-white">Change</button>
                                                    <button type="button" onClick={() => onImageRemove(0)} className="btn btn-sm btn-danger">Delete</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onImageUpload}
                                                {...dragProps}
                                                className="w-full aspect-[1000/240] border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-all text-gray-400 rounded-xl group"
                                            >
                                                <IconPlus className="w-8 h-8 opacity-20 group-hover:opacity-40" />
                                                <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Upload Banner</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </ImageUploading>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Banner Title</label>
                                <input 
                                    type="text" 
                                    value={formData.festive_title || ''} 
                                    onChange={(e) => handleChange('festive_title', e.target.value)}
                                    placeholder="Summer Collection..."
                                    className="form-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Accent Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={formData.festive_accent_color || '#4361ee'} 
                                        onChange={(e) => handleChange('festive_accent_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg p-1 bg-white border border-gray-200 cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={formData.festive_accent_color || '#4361ee'} 
                                        onChange={(e) => handleChange('festive_accent_color', e.target.value)}
                                        className="form-input flex-1 font-mono uppercase text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 font-black tracking-widest mb-1.5 block">Campaign Type</label>
                            <Select 
                                options={[
                                    { value: 'ramadan', label: '🌙 Ramadan Special' },
                                    { value: 'diwali', label: '🪔 Diwali Sale' },
                                    { value: 'eid', label: '🕌 Eid Mubarak' },
                                    { value: 'summer', label: '☀️ Summer Blast' },
                                    { value: 'winter', label: '❄️ Winter Clearance' },
                                    { value: 'custom', label: '⚡ Custom Campaign' }
                                ]}
                                value={{ value: formData.festive_type, label: formData.festive_type ? (formData.festive_type.charAt(0).toUpperCase() + formData.festive_type.slice(1)) : 'Select Template' }}
                                onChange={(selected: any) => handleChange('festive_type', selected.value)}
                                styles={selectStyles}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Start Date</label>
                                <input type="date" value={formData.festive_start_date || ''} onChange={(e) => handleChange('festive_start_date', e.target.value)} className="form-input" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">End Date</label>
                                <input type="date" value={formData.festive_end_date || ''} onChange={(e) => handleChange('festive_end_date', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- THE FESTIVE SECTIONS --- */}
                <div className={`space-y-12 transition-all ${formData.is_festive_active ? 'opacity-100' : 'opacity-20 grayscale pointer-events-none'}`}>
                    
                    {/* SECTION 1: Single Banners (Circle Categories) */}
                    <div className="space-y-6 pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                            <h4 className="font-extrabold uppercase tracking-[0.2em] text-xs dark:text-white">Quick Access Categories (4 Icons)</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {(formData.festive_single_banners || []).map((banner, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-4 hover:border-primary/20 transition-all group">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg flex-none bg-white relative group-hover:scale-105 transition-transform">
                                            {banner.image ? (
                                                <img src={banner.image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-black">ICON</div>
                                            )}
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Icon Image URL" 
                                            className="form-input text-[10px] h-8 p-1 px-2 text-center" 
                                            value={banner.image || ''}
                                            onChange={(e) => handleSingleBannerChange(idx, 'image', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Select
                                            options={categoryList}
                                            placeholder="Parent Category"
                                            styles={selectStyles}
                                            value={categoryList.find(c => c.value === banner.parent_category_id)}
                                            onChange={(sel: any) => {
                                                handleSingleBannerChange(idx, 'parent_category_id', sel.value);
                                                handleSingleBannerChange(idx, 'sub_category_id', '');
                                                handleSingleBannerChange(idx, 'category_id', '');
                                                fetchSubCategories(sel.value);
                                            }}
                                        />
                                        <Select
                                            options={categorySubCategories[banner.parent_category_id] || []}
                                            placeholder="Sub Category"
                                            styles={selectStyles}
                                            value={categorySubCategories[banner.parent_category_id]?.find(c => c.value === banner.sub_category_id)}
                                            onChange={(sel: any) => {
                                                handleSingleBannerChange(idx, 'sub_category_id', sel.value);
                                                handleSingleBannerChange(idx, 'category_id', '');
                                                fetchNicheCategories(sel.value);
                                            }}
                                            isDisabled={!banner.parent_category_id}
                                        />
                                        <Select
                                            options={subCategoryNicheCategories[banner.sub_category_id || ''] || []}
                                            placeholder="Niche ID (Final)"
                                            styles={selectStyles}
                                            value={subCategoryNicheCategories[banner.sub_category_id || '']?.find(c => c.value === banner.category_id)}
                                            onChange={(sel: any) => handleSingleBannerChange(idx, 'category_id', sel.value)}
                                            isDisabled={!banner.sub_category_id}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 2: Multi Banner (Featured Showcase) */}
                    <div className="space-y-6 pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                            <h4 className="font-extrabold uppercase tracking-[0.2em] text-xs dark:text-white">Featured Promo Showcase</h4>
                        </div>
                        
                        <div className="p-6 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Multi-banner banner URL removed to match type definition */}
                                </div>
                                <div className="md:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference Category</label>
                                            <Select
                                                options={categoryList}
                                                styles={selectStyles}
                                                value={categoryList.find(c => c.value === formData.festive_multi_banner?.parent_category_id)}
                                                onChange={(sel: any) => {
                                                    handleMultiBannerChange('parent_category_id', sel.value);
                                                    handleMultiBannerChange('sub_category_id', '');
                                                    fetchSubCategories(sel.value);
                                                    fetchProducts(sel.value);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference Sub-Category</label>
                                            <Select
                                                options={categorySubCategories[formData.festive_multi_banner?.parent_category_id || ''] || []}
                                                styles={selectStyles}
                                                value={categorySubCategories[formData.festive_multi_banner?.parent_category_id || '']?.find(c => c.value === formData.festive_multi_banner?.sub_category_id)}
                                                onChange={(sel: any) => {
                                                    handleMultiBannerChange('sub_category_id', sel.value);
                                                    fetchProducts(sel.value);
                                                }}
                                                isDisabled={!formData.festive_multi_banner?.parent_category_id}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">Pick Featured Items</label>
                                        <Select
                                            isMulti
                                            options={categoryProducts[formData.festive_multi_banner?.sub_category_id || formData.festive_multi_banner?.parent_category_id || ''] || []}
                                            styles={selectStyles}
                                            placeholder="Search and select products..."
                                            value={(formData.festive_multi_banner?.items || []).map(item => {
                                                const p = productList.find(pl => pl.value === item.product_id);
                                                return { value: item.product_id, label: p?.label || 'Unknown Product' };
                                            })}
                                            onChange={(selected: any) => {
                                                const items = (selected || []).map((s: any) => {
                                                    const existing = formData.festive_multi_banner?.items?.find(i => i.product_id === s.value);
                                                    return existing || { product_id: s.value, image: '' };
                                                });
                                                handleMultiBannerChange('items', items);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabSettingsDetail;
