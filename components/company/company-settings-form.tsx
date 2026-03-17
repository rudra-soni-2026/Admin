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
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconFile from '@/components/icon/icon-file';
import IconClock from '@/components/icon/icon-clock';
import IconStar from '@/components/icon/icon-star';
import Select from 'react-select';

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

const CustomProductOption = (props: any) => {
    const { data, innerRef, innerProps } = props;
    return (
        <div ref={innerRef} {...innerProps} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all">
            <img src={data.image || '/assets/images/profile-1.jpeg'} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-gray-800" />
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data.label}</span>
                <span className="text-[10px] text-white-dark uppercase">ID: {data.value.substring(data.value.length - 6)}</span>
            </div>
        </div>
    );
};

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
    const [promoBannerImages, setPromoBannerImages] = useState<ImageListType>([]);
    const [productList, setProductList] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await callApi('/management/admin/products?limit=1000', 'GET');
            if (response && response.data) {
                setProductList(response.data.map((p: any) => ({
                    value: p._id,
                    label: p.name,
                    image: p.image
                })));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

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
                if (data.promo_banners) setPromoBannerImages([{ dataURL: data.promo_banners }]);
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
        const newTab: HeaderTabConfig = { id: `tab_${Date.now()}`, name: '', icon: 'Home', color: '#000000', header_color: '#ffffff' };
        setSettings(prev => ({
            ...prev,
            header_tabs_config: [newTab, ...(prev.header_tabs_config || [])]
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

    // Screen Colors Management
    const addScreenColor = () => {
        setSettings(prev => ({
            ...prev,
            screen_colors: [...(prev.screen_colors || []), { screen_name: '', color: '#ffffff' }]
        }));
    };

    const updateScreenColor = (index: number, field: string, value: string) => {
        const newColors = [...(settings.screen_colors || [])];
        newColors[index] = { ...newColors[index], [field]: value };
        setSettings(prev => ({ ...prev, screen_colors: newColors }));
    };

    const removeScreenColor = (index: number) => {
        const newColors = [...(settings.screen_colors || [])];
        newColors.splice(index, 1);
        setSettings(prev => ({ ...prev, screen_colors: newColors }));
    };

    // Spotlight Management
    const addSpotlight = () => {
        setSettings(prev => ({
            ...prev,
            spotlight: [{ id: Date.now().toString(), title: '', items: [] }, ...(prev.spotlight || [])]
        }));
    };

    const updateSpotlight = (index: number, field: string, value: any) => {
        const newSpotlight = [...(settings.spotlight || [])];
        newSpotlight[index] = { ...newSpotlight[index], [field]: value };
        setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
    };

    const removeSpotlight = (index: number) => {
        const newSpotlight = [...(settings.spotlight || [])];
        newSpotlight.splice(index, 1);
        setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
    };

    const addSpotlightItem = (spotIndex: number) => {
        const newSpotlight = [...(settings.spotlight || [])];
        const newItem = { id: Date.now().toString(), image: '', products: [] };
        newSpotlight[spotIndex].items = [newItem, ...(newSpotlight[spotIndex].items || [])];
        setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
    };

    const updateSpotlightItem = (spotIndex: number, itemIndex: number, field: string, value: any) => {
        const newSpotlight = [...(settings.spotlight || [])];
        newSpotlight[spotIndex].items[itemIndex] = { ...newSpotlight[spotIndex].items[itemIndex], [field]: value };
        setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
    };

    const removeSpotlightItem = (spotIndex: number, itemIndex: number) => {
        const newSpotlight = [...(settings.spotlight || [])];
        newSpotlight[spotIndex].items.splice(itemIndex, 1);
        setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
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

            // Promo Banner - Single Upload
            if (promoBannerImages.length > 0) {
                if (promoBannerImages[0].file) {
                    const url = await uploadImage(promoBannerImages[0].file);
                    if (url) payload.promo_banners = url;
                } else if (promoBannerImages[0].dataURL) {
                    payload.promo_banners = promoBannerImages[0].dataURL;
                }
            } else {
                payload.promo_banners = null;
            }

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
                            { id: 'colors', label: 'Screen Colors', icon: <IconColorPalette className="w-4 h-4" /> },
                            { id: 'spotlight', label: 'Spotlight Config', icon: <IconStar className="w-4 h-4" /> },
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
                        <div className="panel animate__animated animate__fadeIn space-y-8">
                            <div>
                                <h6 className="text-lg font-bold mb-4 border-b pb-4 border-gray-100 dark:border-gray-800">Main Promo Banner (Single)</h6>
                                <ImageUploading value={promoBannerImages} onChange={setPromoBannerImages} maxNumber={1}>
                                    {({ imageList, onImageUpload, onImageUpdate, onImageRemove, isDragging, dragProps }) => (
                                        <div className="space-y-4">
                                            <div 
                                                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-800 hover:border-primary/50'}`}
                                                onClick={onImageUpload}
                                                {...dragProps}
                                            >
                                                {imageList.length > 0 ? (
                                                    <div className="relative group aspect-[21/9] rounded-2xl overflow-hidden">
                                                        <img src={imageList[0].dataURL} alt="Promo" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                            <button type="button" className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onImageUpdate(0); }}>Change Image</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <IconGallery className="w-12 h-12 text-primary/20 mx-auto mb-2" />
                                                        <p className="font-bold">Click to upload Main Promo Banner</p>
                                                        <p className="text-xs text-white-dark mt-1">Recommended: 1920x800px</p>
                                                    </div>
                                                )}
                                            </div>
                                            {imageList.length > 0 && (
                                                <button type="button" className="btn btn-outline-danger btn-sm w-full" onClick={() => onImageRemove(0)}>
                                                    Remove Promo Banner
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </ImageUploading>
                            </div>

                            <div className="pt-4 mt-4">
                                <h6 className="text-lg font-bold mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">Carousel Banners (Multiple)</h6>
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
                    </div>
                )}

                {activeTab === 'colors' && (
                    <div className="panel animate__animated animate__fadeIn">
                        <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-100 dark:border-gray-800">
                            <div>
                                <h6 className="text-lg font-bold">Screen Wise Colors</h6>
                                <p className="text-xs text-white-dark mt-1">Set specific primary colors for different app screens</p>
                            </div>
                            <button type="button" className="btn btn-primary btn-sm gap-2" onClick={addScreenColor}>
                                <IconPlus /> Add Screen
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(settings.screen_colors || []).map((sc, idx) => (
                                <div key={idx} className="flex items-end gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-gray-800">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-white-dark uppercase mb-2 block">Screen Name</label>
                                        <input type="text" className="form-input" value={sc.screen_name} onChange={(e) => updateScreenColor(idx, 'screen_name', e.target.value)} placeholder="e.g. Home, Cart, Profile" />
                                    </div>
                                    <div className="w-40">
                                        <label className="text-[10px] font-bold text-white-dark uppercase mb-2 block">Theme Color</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" className="w-10 h-10 rounded-full border-2 border-white cursor-pointer" value={sc.color} onChange={(e) => updateScreenColor(idx, 'color', e.target.value)} />
                                            <input type="text" className="form-input flex-1 text-xs font-mono lowercase" value={sc.color} onChange={(e) => updateScreenColor(idx, 'color', e.target.value)} />
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-outline-danger p-2 h-10" onClick={() => removeScreenColor(idx)}>
                                        <IconTrashLines className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {(!settings.screen_colors || settings.screen_colors.length === 0) && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                                    <IconColorPalette className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-white-dark">No custom screen colors defined yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'spotlight' && (
                    <div className="panel animate__animated animate__fadeIn space-y-8">
                        <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                            <div>
                                <h6 className="text-lg font-bold">Spotlight Campaigns</h6>
                                <p className="text-xs text-white-dark mt-1">Manage featured deals and special product groupings</p>
                            </div>
                            {(!settings.spotlight || settings.spotlight.length === 0) && (
                                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={addSpotlight}>
                                    <IconPlus /> Add Spotlight
                                </button>
                            )}
                        </div>
                        
                        <ReactSortable
                            list={settings.spotlight || []}
                            setList={(newList) => setSettings(prev => ({ ...prev, spotlight: newList }))}
                            animation={200}
                            handle=".spotlight-handle"
                            className="space-y-6"
                        >
                            {(settings.spotlight || []).map((spot, idx) => (
                                <div key={spot.id || idx} className="panel bg-gray-50 dark:bg-black/10 border-gray-100 dark:border-gray-800 rounded-3xl space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="spotlight-handle p-2 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl cursor-move text-white-dark hover:text-primary transition-all">
                                            <IconMenuDragAndDrop className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-primary uppercase mb-2 block tracking-widest">Spotlight Title</label>
                                            <input type="text" className="form-input font-bold" value={spot.title} onChange={(e) => updateSpotlight(idx, 'title', e.target.value)} placeholder="e.g. Deal of the Day" />
                                        </div>
                                        <button type="button" className="text-danger p-2 hover:bg-danger/10 rounded-full mt-6" onClick={() => removeSpotlight(idx)}>
                                            <IconTrashLines className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <div className="flex items-center gap-2">
                                                <IconLayoutGrid className="w-4 h-4 text-primary" />
                                                <h6 className="text-[11px] font-bold uppercase tracking-widest text-gray-800 dark:text-white-dark transition-all">Featured Items</h6>
                                            </div>
                                            <button type="button" className="btn btn-outline-primary btn-xs px-2 py-1 rounded-lg flex items-center gap-1.5" onClick={() => addSpotlightItem(idx)}>
                                                <IconPlus className="w-3 h-3" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Add Item</span>
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <ReactSortable
                                                list={spot.items || []}
                                                setList={(newItems) => {
                                                    const newSpotlight = [...(settings.spotlight || [])];
                                                    newSpotlight[idx] = { ...newSpotlight[idx], items: newItems };
                                                    setSettings(prev => ({ ...prev, spotlight: newSpotlight }));
                                                }}
                                                animation={200}
                                                handle=".item-handle"
                                                className="space-y-4"
                                            >
                                                {(spot.items || []).map((item: any, itemIdx: number) => (
                                                    <div key={item.id || itemIdx} className="p-4 bg-white dark:bg-black rounded-3xl border border-gray-100 dark:border-gray-800 relative group/item shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            {/* Left Side: Banner Only */}
                                                            <div className="w-full lg:w-1/3 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="item-handle p-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg cursor-move text-white-dark hover:text-primary transition-all opacity-0 group-hover/item:opacity-100">
                                                                            <IconMenuDragAndDrop className="w-3 h-3" />
                                                                        </div>
                                                                        <label className="text-[9px] font-bold text-white-dark uppercase tracking-widest">Banner Image</label>
                                                                    </div>
                                                                    <button type="button" className="text-danger p-1 hover:bg-danger/10 rounded" onClick={() => removeSpotlightItem(idx, itemIdx)}><IconX className="w-4 h-4" /></button>
                                                                </div>

                                                                <div className="relative group w-full aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50/50">
                                                                    {!item.image ? (
                                                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all">
                                                                            <IconCamera className="w-6 h-6 text-gray-300 mb-1" />
                                                                            <span className="text-[9px] text-white-dark font-bold uppercase">Upload Banner</span>
                                                                            <input 
                                                                                type="file" 
                                                                                className="hidden" 
                                                                                accept="image/*"
                                                                                onChange={async (e) => {
                                                                                    if (e.target.files?.[0]) {
                                                                                        const url = await uploadImage(e.target.files[0]);
                                                                                        if (url) updateSpotlightItem(idx, itemIdx, 'image', url);
                                                                                    }
                                                                                }} 
                                                                            />
                                                                        </label>
                                                                    ) : (
                                                                        <>
                                                                            <img src={item.image} alt="Banner" className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                                                <label className="btn btn-primary btn-xs cursor-pointer">
                                                                                    Replace
                                                                                    <input 
                                                                                        type="file" 
                                                                                        className="hidden" 
                                                                                        accept="image/*"
                                                                                        onChange={async (e) => {
                                                                                            if (e.target.files?.[0]) {
                                                                                                const url = await uploadImage(e.target.files[0]);
                                                                                                if (url) updateSpotlightItem(idx, itemIdx, 'image', url);
                                                                                            }
                                                                                        }} 
                                                                                    />
                                                                                </label>
                                                                                <button type="button" className="btn btn-danger btn-xs" onClick={() => updateSpotlightItem(idx, itemIdx, 'image', '')}>Remove</button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Right Side: Search & Selected Products Grid */}
                                                            <div className="flex-1 bg-gray-50/50 dark:bg-black/20 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex flex-col">
                                                                        <label className="text-[9px] font-bold text-primary uppercase tracking-widest text-opacity-70 transition-all">Linked Products</label>
                                                                        <span className="text-[10px] text-white-dark font-bold">Total: { (item.products || []).length } items</span>
                                                                    </div>
                                                                    {(item.products || []).length > 0 && (
                                                                        <button type="button" className="text-[9px] text-danger font-bold hover:underline uppercase transition-all" onClick={() => updateSpotlightItem(idx, itemIdx, 'products', [])}>Clear All</button>
                                                                    )}
                                                                </div>

                                                                <div className="mb-4">
                                                                    <Select
                                                                        options={productList}
                                                                        components={{ Option: CustomProductOption }}
                                                                        onChange={(selected: any) => {
                                                                            if (selected && !(item.products || []).includes(selected.value)) {
                                                                                updateSpotlightItem(idx, itemIdx, 'products', [...(item.products || []), selected.value]);
                                                                            }
                                                                        }}
                                                                        classNamePrefix="react-select"
                                                                        placeholder="Search and add product..."
                                                                        className="text-xs"
                                                                        isClearable
                                                                        value={null}
                                                                        styles={{
                                                                            control: (base) => ({
                                                                                ...base,
                                                                                borderRadius: '12px',
                                                                                borderColor: '#e0e6ed',
                                                                                minHeight: '38px',
                                                                                fontSize: '11px',
                                                                                backgroundColor: '#fff',
                                                                                boxShadow: 'none',
                                                                                '&:hover': {
                                                                                    borderColor: '#4361ee'
                                                                                }
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>

                                                                <div className="max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                                                    <ReactSortable
                                                                        list={(item.products || []).map((id: string) => productList.find(p => p.value === id) || { value: id, label: 'Unknown', image: '' })}
                                                                        setList={(newList) => updateSpotlightItem(idx, itemIdx, 'products', newList.map(p => p.value))}
                                                                        animation={200}
                                                                        handle=".prod-handle"
                                                                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                                                    >
                                                                        {(item.products || []).map((prodId: string) => {
                                                                            const product = productList.find(p => p.value === prodId);
                                                                            return (
                                                                                <div key={prodId} className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-primary/30 transition-all group/prod shadow-sm">
                                                                                    <div className="prod-handle cursor-move p-1 text-gray-200 hover:text-primary transition-all">
                                                                                        <IconMenuDragAndDrop className="w-3 h-3" />
                                                                                    </div>
                                                                                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-none border border-gray-100 dark:border-gray-800 bg-gray-50">
                                                                                        <img src={product?.image || '/assets/images/profile-1.jpeg'} alt="" className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0 pr-1">
                                                                                        <h6 className="text-[10px] font-bold truncate text-gray-700 dark:text-gray-300">{product?.label || 'Unknown'}</h6>
                                                                                    </div>
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="p-1 text-gray-300 hover:text-danger hover:bg-danger/5 rounded-md transition-all"
                                                                                        onClick={() => updateSpotlightItem(idx, itemIdx, 'products', (item.products || []).filter((id: string) => id !== prodId))}
                                                                                    >
                                                                                        <IconX className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </ReactSortable>
                                                                    {(item.products || []).length === 0 && (
                                                                        <div className="py-8 flex flex-col items-center justify-center opacity-40">
                                                                            <IconLayoutGrid className="w-8 h-8 mb-2" />
                                                                            <p className="text-[9px] font-bold uppercase tracking-widest">No Products Linked</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </ReactSortable>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </ReactSortable>
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
                                        <div key={tab.id || idx} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
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
                                            <div className="flex-none w-20 text-center">
                                                <label className="text-[9px] font-bold text-white-dark uppercase block mb-1">Icon Color</label>
                                                <input type="color" className="w-8 h-8 rounded-full border-2 border-white cursor-pointer mx-auto" value={tab.color} onChange={(e) => updateHeaderTab(idx, 'color', e.target.value)} />
                                            </div>
                                            <div className="flex-none w-20 text-center">
                                                <label className="text-[9px] font-bold text-white-dark uppercase block mb-1">Header Color</label>
                                                <input type="color" className="w-8 h-8 rounded-full border-2 border-white cursor-pointer mx-auto" value={tab.header_color || '#ffffff'} onChange={(e) => updateHeaderTab(idx, 'header_color', e.target.value)} />
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

const IconColorPalette = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
);

export default CompanySettingsForm;
