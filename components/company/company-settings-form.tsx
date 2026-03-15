'use client';
import React, { useState, useEffect } from 'react';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconSave from '@/components/icon/icon-save';
import IconMenuPages from '@/components/icon/menu/icon-menu-pages';
import IconCamera from '@/components/icon/icon-camera';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { CompanySettings, HeaderTabConfig } from '@/types/company';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconSettings from '@/components/icon/icon-settings';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconX from '@/components/icon/icon-x';
import IconEdit from '@/components/icon/icon-edit';
import IconGallery from '@/components/icon/icon-gallery';
import { ReactSortable } from 'react-sortablejs';
import IconMenuDragAndDrop from '@/components/icon/menu/icon-menu-drag-and-drop';

const AVAILABLE_ICONS = ['Home', 'Headphones', 'Sparkles', 'Baby', 'Shirt', 'Dumbbell', 'UtensilsCrossed', 'Pill', 'PawPrint'];

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

const CompanySettingsForm = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState<Partial<CompanySettings>>({});
    
    // Image states
    const [logoImages, setLogoImages] = useState<ImageListType>([]);
    const [faviconImages, setFaviconImages] = useState<ImageListType>([]);
    const [loaderImages, setLoaderImages] = useState<ImageListType>([]);
    const [bannerImages, setBannerImages] = useState<ImageListType>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setFetching(true);
            const response = await callApi('/company/settings', 'GET');
            if (response && response.status === 'success') {
                const data = response.data;
                setSettings(data);
                
                // Set images
                if (data.logo_url) setLogoImages([{ dataURL: data.logo_url }]);
                if (data.favicon_url) setFaviconImages([{ dataURL: data.favicon_url }]);
                if (data.loader_logo_url) setLoaderImages([{ dataURL: data.loader_logo_url }]);
                if (data.banners) setBannerImages(data.banners.map((url: string) => ({ dataURL: url })));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showMessage('Failed to load settings', 'danger');
        } finally {
            setFetching(false);
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
            customClass: { popup: `color-${type}` },
        });
        toast.fire({ icon: type, title: msg, padding: '10px 20px' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [id]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleToggle = (key: keyof CompanySettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const uploadImage = async (imageFile: File): Promise<string | null> => {
        try {
            const uploadData = new FormData();
            uploadData.append('images', imageFile);
            const uploadRes = await callApi('/upload', 'POST', uploadData);
            if (uploadRes && uploadRes.status === 'success' && uploadRes.data?.[0]?.url) {
                return uploadRes.data[0].url;
            }
            return null;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    // Header Tabs Management
    const addHeaderTab = () => {
        const newTab: HeaderTabConfig = { id: `tab_${Date.now()}`, name: '', icon: 'Home', color: '#000000' };
        setSettings(prev => ({
            ...prev,
            header_tabs_config: [...(prev.header_tabs_config || []), newTab]
        }));
    };

    const updateHeaderTab = (index: number, field: keyof HeaderTabConfig, value: string) => {
        const newTabs = [...(settings.header_tabs_config || [])];
        newTabs[index] = { ...newTabs[index], [field]: value };
        setSettings(prev => ({ ...prev, header_tabs_config: newTabs }));
    };

    const removeHeaderTab = (index: number) => {
        const newTabs = [...(settings.header_tabs_config || [])];
        newTabs.splice(index, 1);
        setSettings(prev => ({ ...prev, header_tabs_config: newTabs }));
    };

    // Time Slots Management
    const addTimeSlot = (key: 'delivery_time_slots' | 'rider_time_slots') => {
        setSettings(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), ""]
        }));
    };

    const updateTimeSlot = (key: 'delivery_time_slots' | 'rider_time_slots', index: number, value: string) => {
        const newSlots = [...(settings[key] || [])];
        newSlots[index] = value;
        setSettings(prev => ({ ...prev, [key]: newSlots }));
    };

    const removeTimeSlot = (key: 'delivery_time_slots' | 'rider_time_slots', index: number) => {
        const newSlots = [...(settings[key] || [])];
        newSlots.splice(index, 1);
        setSettings(prev => ({ ...prev, [key]: newSlots }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload: any = { ...settings };

            // Image uploads - Individual for branding
            if (logoImages.length > 0 && logoImages[0].file) {
                const url = await uploadImage(logoImages[0].file);
                if (url) {
                    payload.logo_url = url;
                } else {
                    showMessage('Logo upload failed.', 'danger');
                    setLoading(false);
                    return;
                }
            }
            if (faviconImages.length > 0 && faviconImages[0].file) {
                const url = await uploadImage(faviconImages[0].file);
                if (url) {
                    payload.favicon_url = url;
                } else {
                    showMessage('Favicon upload failed.', 'danger');
                    setLoading(false);
                    return;
                }
            }
            if (loaderImages.length > 0 && loaderImages[0].file) {
                const url = await uploadImage(loaderImages[0].file);
                if (url) {
                    payload.loader_logo_url = url;
                } else {
                    showMessage('App Loader upload failed.', 'danger');
                    setLoading(false);
                    return;
                }
            }

            // Banners management - Batch Upload (Efficient)
            let finalBannerUrls: string[] = bannerImages
                .filter(img => !img.file && img.dataURL)
                .map(img => img.dataURL as string);

            const bannerUploadData = new FormData();
            bannerImages.forEach((img) => {
                if (img.file) {
                    bannerUploadData.append('images', img.file);
                }
            });

            if (bannerUploadData.has('images')) {
                const uploadRes = await callApi('/upload', 'POST', bannerUploadData);
                if (uploadRes && uploadRes.status === 'success' && Array.isArray(uploadRes.data)) {
                    const uploadedUrls = uploadRes.data.map((item: any) => item.url);
                    finalBannerUrls = [...finalBannerUrls, ...uploadedUrls];
                } else {
                    showMessage('Banner upload failed.', 'danger');
                    setLoading(false);
                    return;
                }
            }
            payload.banners = finalBannerUrls;

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.id;

            const response = await callApi('/company/settings', 'POST', payload);
            if (response && response.status === 'success') {
                showMessage('Settings saved successfully!', 'success');
            } else {
                showMessage(response?.message || 'Failed to update', 'danger');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full border-2 border-primary border-l-transparent w-10 h-10"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between panel shadow-sm">
                <div>
                    <h5 className="text-xl font-bold dark:text-white">Admin</h5>
                    <p className="text-xs text-white-dark">System configuration for {settings.name}</p>
                </div>
                <button type="submit" className="btn btn-primary gap-2 px-10" disabled={loading}>
                    {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span> : <IconSave className="w-5 h-5" />}
                    Save
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs Navigation */}
                <div className="panel p-0 flex-none w-full md:w-64 overflow-hidden border-[#e0e6ed] dark:border-[#1b2e4b]">
                    <div className="flex flex-col">
                        {[
                            { id: 'general', label: 'Business Profile', icon: <IconInfoCircle className="w-4 h-4" /> },
                            { id: 'branding', label: 'Visual Identity', icon: <IconCamera className="w-4 h-4" /> },
                            { id: 'banners', label: 'Promotional Banners', icon: <IconGallery className="w-4 h-4" /> },
                            { id: 'system', label: 'System Logic', icon: <IconSettings className="w-4 h-4" /> },
                            { id: 'seo', label: 'SEO & Search', icon: <IconMenuPages className="w-4 h-4" /> },
                            { id: 'tabs', label: 'App Navigation', icon: <IconLayoutGrid className="w-4 h-4" /> },
                            { id: 'time', label: 'Time Management', icon: <IconClock className="w-4 h-4" /> },
                            { id: 'policies', label: 'Legal & Policy', icon: <IconFile className="w-4 h-4" /> },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${
                                    activeTab === t.id 
                                    ? 'bg-primary/10 border-primary text-primary' 
                                    : 'border-transparent text-white-dark hover:bg-gray-50 dark:hover:bg-black/20'
                                }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="panel animate__animated animate__fadeIn">
                            <h6 className="text-lg font-bold mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">Business Profile</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Official Name</label>
                                    <input id="name" type="text" className="form-input" value={settings.name || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Support Email</label>
                                    <input id="support_email" type="email" className="form-input" value={settings.support_email || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Support Phone</label>
                                    <input id="support_phone" type="text" className="form-input" value={settings.support_phone || ''} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Office Address</label>
                                    <textarea id="address" rows={3} className="form-textarea" value={settings.address || ''} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="panel animate__animated animate__fadeIn space-y-10">
                            <div>
                                <h6 className="text-lg font-bold mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">Visual Identity</h6>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    {[
                                        { id: 'logo', label: 'Master Logo', state: logoImages, setState: setLogoImages },
                                        { id: 'favicon', label: 'Favicon', state: faviconImages, setState: setFaviconImages },
                                        { id: 'loader', label: 'App Loader', state: loaderImages, setState: setLoaderImages },
                                    ].map((img) => (
                                        <div key={img.id} className="space-y-3">
                                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{img.label}</label>
                                            <ImageUploading value={img.state} onChange={img.setState} maxNumber={1}>
                                                {({ imageList, onImageUpload, onImageUpdate, onImageRemove }) => (
                                                    <div className="relative group">
                                                        <div className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black/10 transition-all hover:border-primary/50">
                                                            {imageList.length > 0 ? (
                                                                <img src={imageList[0].dataURL} alt="Brand" className="w-full h-full object-contain p-4" />
                                                            ) : (
                                                                <IconCamera className="w-8 h-8 text-gray-300" />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all">
                                                                <button type="button" onClick={imageList.length > 0 ? () => onImageUpdate(0) : onImageUpload} className="btn btn-sm btn-primary">
                                                                    <IconEdit className="w-3 h-3" />
                                                                </button>
                                                                {imageList.length > 0 && (
                                                                    <button type="button" onClick={() => onImageRemove(0)} className="btn btn-sm btn-danger">
                                                                        <IconTrashLines className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </ImageUploading>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'banners' && (
                        <div className="panel animate__animated animate__fadeIn">
                            <h6 className="text-lg font-bold mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">Promotional Banners</h6>
                            <ImageUploading multiple value={bannerImages} onChange={setBannerImages}>
                                {({ imageList, onImageUpload, onImageUpdate, onImageRemove, dragProps, isDragging }) => (
                                    <div className="space-y-6">
                                        <div 
                                            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${isDragging ? 'border-primary bg-primary/5 scale-95' : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
                                            onClick={onImageUpload}
                                            {...dragProps}
                                        >
                                            <IconGallery className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                                            <h6 className="font-bold text-lg mb-1">Upload Campaign Banners</h6>
                                            <p className="text-white-dark text-sm">Drag images here or click to browse</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {imageList.map((image, index) => (
                                                <div key={index} className="relative group rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 aspect-video bg-gray-50">
                                                    <img src={image.dataURL} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                        <button type="button" onClick={() => onImageUpdate(index)} className="btn btn-primary btn-sm">Replace</button>
                                                        <button type="button" onClick={() => onImageRemove(index)} className="btn btn-danger btn-sm">Remove</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </ImageUploading>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="panel animate__animated animate__fadeIn space-y-6">
                            <h6 className="text-lg font-bold border-b pb-4 border-gray-100 dark:border-gray-800">System Logic</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                    <div>
                                        <h6 className="font-bold text-sm">Maintenance Mode</h6>
                                        <p className="text-[10px] text-white-dark">Hide store and show maintenance screen</p>
                                    </div>
                                    <Toggle checked={!!settings.is_under_maintenance} onChange={(v) => handleToggle('is_under_maintenance', v)} />
                                </div>
                                <div className="p-5 rounded-2xl bg-danger/5 border border-danger/10 flex items-center justify-between">
                                    <div>
                                        <h6 className="font-bold text-sm">Force Update</h6>
                                        <p className="text-[10px] text-white-dark">Require users to update their app</p>
                                    </div>
                                    <Toggle checked={!!settings.is_force_update} onChange={(v) => handleToggle('is_force_update', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">App Version String</label>
                                        <input id="app_version" type="text" className="form-input" value={settings.app_version || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">GST Percentage (%)</label>
                                        <input id="gst_percentage" type="number" className="form-input" value={settings.gst_percentage || 0} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">GST Identity No.</label>
                                        <input id="gst_number" type="text" className="form-input" value={settings.gst_number || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Income Tax (PAN)</label>
                                        <input id="pan_number" type="text" className="form-input" value={settings.pan_number || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Min Order Threshold</label>
                                        <input id="min_order_amount" type="number" className="form-input" value={settings.min_order_amount || 0} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Delivery Buffer (Mins)</label>
                                        <input id="delivery_buffer_time" type="number" className="form-input" value={settings.delivery_buffer_time || 0} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="panel animate__animated animate__fadeIn space-y-6">
                            <h6 className="text-lg font-bold border-b pb-4 border-gray-100 dark:border-gray-800">SEO & Search Optimization</h6>
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Search Title (Meta)</label>
                                    <input id="meta_title" type="text" className="form-input" value={settings.meta_title || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Keywords (Comma separated)</label>
                                    <input id="meta_keywords" type="text" className="form-input" value={settings.meta_keywords || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Page Description</label>
                                    <textarea id="meta_description" rows={4} className="form-textarea" value={settings.meta_description || ''} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tabs' && (
                        <div className="panel animate__animated animate__fadeIn">
                            <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">
                                <h6 className="text-lg font-bold">App Navigation Tabs</h6>
                                <button type="button" className="btn btn-outline-primary btn-sm gap-2" onClick={addHeaderTab}>
                                    <IconPlus /> Add Category Tab
                                </button>
                            </div>
                            <div className="space-y-4">
                                <ReactSortable
                                    list={settings.header_tabs_config || []}
                                    setList={(newList) => setSettings(prev => ({ ...prev, header_tabs_config: newList }))}
                                    animation={200}
                                    handle=".handle"
                                    className="space-y-4"
                                >
                                    {(settings.header_tabs_config || []).map((tab, idx) => (
                                        <div key={idx} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                                            <div className="handle flex-none p-2 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded cursor-move text-white-dark hover:text-primary transition-all self-center">
                                                <IconMenuDragAndDrop className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-[150px]">
                                                <label className="text-[9px] font-bold text-white-dark uppercase block mb-1">Display Name</label>
                                                <input type="text" className="form-input text-xs" value={tab.name} onChange={(e) => updateHeaderTab(idx, 'name', e.target.value)} placeholder="Electronics" />
                                            </div>
                                            <div className="flex-none w-40">
                                                <label className="text-[9px] font-bold text-white-dark uppercase block mb-1">Icon Style</label>
                                                <select 
                                                    className="form-select text-xs" 
                                                    value={tab.icon} 
                                                    onChange={(e) => updateHeaderTab(idx, 'icon', e.target.value)}
                                                >
                                                    {AVAILABLE_ICONS.map(icon => (
                                                        <option key={icon} value={icon}>{icon}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-none w-16 text-center">
                                                <label className="text-[9px] font-bold text-white-dark uppercase block mb-1">Color</label>
                                                <input type="color" className="w-8 h-8 rounded-full border-2 border-white cursor-pointer" value={tab.color} onChange={(e) => updateHeaderTab(idx, 'color', e.target.value)} />
                                            </div>
                                            <button type="button" className="btn btn-danger btn-sm p-2 flex-none" onClick={() => removeHeaderTab(idx)}>
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </ReactSortable>
                            </div>
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate__animated animate__fadeIn">
                            <div className="panel">
                                <div className="flex items-center justify-between mb-6">
                                    <h6 className="font-bold">Delivery Time Slots</h6>
                                    <button type="button" className="btn btn-primary btn-sm p-1" onClick={() => addTimeSlot('delivery_time_slots')}><IconPlus className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-2">
                                    {(settings.delivery_time_slots || []).map((slot, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" className="form-input flex-1" value={slot} onChange={(e) => updateTimeSlot('delivery_time_slots', idx, e.target.value)} placeholder="e.g. 09:00 AM - 12:00 PM" />
                                            <button type="button" className="text-danger p-2" onClick={() => removeTimeSlot('delivery_time_slots', idx)}><IconX className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="panel">
                                <div className="flex items-center justify-between mb-6">
                                    <h6 className="font-bold">Rider Availability</h6>
                                    <button type="button" className="btn btn-primary btn-sm p-1" onClick={() => addTimeSlot('rider_time_slots')}><IconPlus className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-2">
                                    {(settings.rider_time_slots || []).map((slot, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" className="form-input flex-1" value={slot} onChange={(e) => updateTimeSlot('rider_time_slots', idx, e.target.value)} placeholder="e.g. Morning Shift (8-2)" />
                                            <button type="button" className="text-danger p-2" onClick={() => removeTimeSlot('rider_time_slots', idx)}><IconX className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'policies' && (
                        <div className="panel animate__animated animate__fadeIn space-y-6">
                            <h6 className="text-lg font-bold border-b pb-4 border-gray-100 dark:border-gray-800">Legal Agreements</h6>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Our Story (About Us)</label>
                                    <textarea id="about_us" rows={5} className="form-textarea" value={settings.about_us || ''} onChange={handleChange}></textarea>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Privacy & Terms</label>
                                    <textarea id="terms_conditions" rows={5} className="form-textarea" value={settings.terms_conditions || ''} onChange={handleChange}></textarea>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Returns & Refund Policy</label>
                                    <textarea id="refund_policy" rows={5} className="form-textarea" value={settings.refund_policy || ''} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

// Mock missing icon components
const IconLayoutGrid = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);

const IconFile = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
    </svg>
);

const IconClock = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

export default CompanySettingsForm;
