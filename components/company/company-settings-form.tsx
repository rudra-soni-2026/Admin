'use client';
import React, { useState, useEffect } from 'react';
import TabSettingsDetail from './tab-settings-detail';
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
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPlusCircle from '@/components/icon/icon-plus-circle';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import IconEdit from '@/components/icon/icon-edit';
import IconGallery from '@/components/icon/icon-gallery';
import { ReactSortable } from 'react-sortablejs';
import IconMenu from '@/components/icon/icon-menu';
import IconMenuDragAndDrop from '@/components/icon/menu/icon-menu-drag-and-drop';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconFile from '@/components/icon/icon-file';
import IconClock from '@/components/icon/icon-clock';
import IconStar from '@/components/icon/icon-star';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconTruck from '@/components/icon/icon-truck';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconShoppingCart from '@/components/icon/icon-shopping-cart';
import Select from 'react-select';

const AVAILABLE_ICONS = ['Home', 'Headphones', 'Sparkles', 'Baby', 'Shirt', 'Dumbbell', 'UtensilsCrossed', 'Pill', 'PawPrint'];

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
    const [festiveBannerImages, setFestiveBannerImages] = useState<ImageListType>([]);
    const [selectedFestiveTabIdx, setSelectedFestiveTabIdx] = useState(0);
    const [productList, setProductList] = useState<any[]>([]);
    const [categoryList, setCategoryList] = useState<any[]>([]);
    const [categoryProducts, setCategoryProducts] = useState<{ [key: string]: any[] }>({});
    const [categorySubCategories, setCategorySubCategories] = useState<{ [key: string]: any[] }>({});
    const [subCategoryNicheCategories, setSubCategoryNicheCategories] = useState<{ [key: string]: any[] }>({});
    const [tabDetailIdx, setTabDetailIdx] = useState<number | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await callApi('/products/parent-categories?level=0&limit=1000', 'GET');
            if (response && response.data) {
                const cats = response.data.map((c: any) => ({
                    value: c._id,
                    label: c.name,
                    image: c.image
                }));
                setCategoryList(cats);

                // Pre-fetch subcategories for any selected categories in the config
                if (settings?.header_tabs_config) {
                    settings.header_tabs_config.forEach(tab => {
                        if (tab.festive_single_banners) {
                            tab.festive_single_banners.forEach(b => {
                                if (b.parent_category_id) fetchSubCategoriesByCategory(b.parent_category_id);
                                if (b.sub_category_id) fetchNicheCategoriesBySubCategory(b.sub_category_id);
                            });
                        }
                        if (tab.festive_multi_banner?.parent_category_id) {
                            fetchSubCategoriesByCategory(tab.festive_multi_banner.parent_category_id);
                            if (tab.festive_multi_banner.sub_category_id) fetchNicheCategoriesBySubCategory(tab.festive_multi_banner.sub_category_id);
                            fetchProductsByCategory(tab.festive_multi_banner.category_id || tab.festive_multi_banner.sub_category_id || tab.festive_multi_banner.parent_category_id);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Automatically fetch subcategories when the active tab's config changes
    useEffect(() => {
        const currentTab = settings.header_tabs_config?.[selectedFestiveTabIdx];
        if (!currentTab) return;

        // Fetch for Single Banners
        currentTab.festive_single_banners?.forEach((banner: any) => {
            if (banner.parent_category_id) fetchSubCategoriesByCategory(banner.parent_category_id);
            if (banner.sub_category_id) fetchNicheCategoriesBySubCategory(banner.sub_category_id);
        });

        // Fetch for Multi Banner
        if (currentTab.festive_multi_banner?.parent_category_id) {
            fetchSubCategoriesByCategory(currentTab.festive_multi_banner.parent_category_id);
            if (currentTab.festive_multi_banner.sub_category_id) fetchNicheCategoriesBySubCategory(currentTab.festive_multi_banner.sub_category_id);
            fetchProductsByCategory(currentTab.festive_multi_banner.category_id || currentTab.festive_multi_banner.sub_category_id || currentTab.festive_multi_banner.parent_category_id);
        }
    }, [selectedFestiveTabIdx, settings.header_tabs_config, categoryList]); // Added categoryList dependency

    const fetchSubCategoriesByCategory = async (catId: string) => {
        if (!catId) return;
        // Check if we already have it to avoid redundant calls, but we can also refresh if needed
        if (categorySubCategories[catId] && categorySubCategories[catId].length > 0) return;

        try {
            console.log('Fetching sub-categories for ID:', catId);
            const response = await callApi(`/management/admin/sub-categories/${catId}`, 'GET');

            // Handle different possible response structures - prioritizing the one found in category list
            const subData = response?.data?.subCategories || response?.data || response?.subCategories || response;

            if (Array.isArray(subData)) {
                const mapped = subData.map((s: any) => ({
                    value: s?._id || s?.id || '',
                    label: s?.name || 'Unknown',
                    image: s?.image || ''
                }));
                console.log(`Found ${mapped.length} sub-categories for ${catId}`);
                setCategorySubCategories(prev => ({ ...prev, [catId]: mapped }));
            } else {
                console.warn('Sub-category response is not an array:', subData);
                setCategorySubCategories(prev => ({ ...prev, [catId]: [] })); // Set empty array to avoid infinite loading
            }
        } catch (error) {
            console.error('Error fetching subcategories for ID:', catId, error);
            setCategorySubCategories(prev => ({ ...prev, [catId]: [] }));
        }
    };

    const fetchNicheCategoriesBySubCategory = async (subCatId: string) => {
        if (!subCatId) return;
        if (subCategoryNicheCategories[subCatId] && subCategoryNicheCategories[subCatId].length > 0) return;

        try {
            console.log('Fetching niche-categories for ID:', subCatId);
            const response = await callApi(`/management/admin/sub-categories/${subCatId}`, 'GET');
            const data = response?.data?.subCategories || response?.data || response?.subCategories || response;

            if (Array.isArray(data)) {
                const mapped = data.map((s: any) => ({
                    value: s?._id || s?.id || '',
                    label: s?.name || 'Unknown',
                    image: s?.image || ''
                }));
                console.log(`Found ${mapped.length} niche-categories for ${subCatId}`);
                setSubCategoryNicheCategories(prev => ({ ...prev, [subCatId]: mapped }));
            } else {
                setSubCategoryNicheCategories(prev => ({ ...prev, [subCatId]: [] }));
            }
        } catch (error) {
            console.error('Error fetching niche categories for ID:', subCatId, error);
            setSubCategoryNicheCategories(prev => ({ ...prev, [subCatId]: [] }));
        }
    };

    const fetchProductsByCategory = async (catId: string) => {
        if (!catId) return;
        // Check if we already have it in cache precisely for this ID
        if (categoryProducts[catId] && categoryProducts[catId].length > 0) return;

        try {
            console.log('>>> [ACTION] Fetching Products specifically for Sub-Category/Category ID:', catId);
            // Calling the exact endpoint requested with the ID passed
            const response = await callApi(`/products/categorys/${catId}?limit=500`, 'GET');
            console.log(`>>> [RESPONSE] Received data for ID ${catId}:`, response);

            // Handle multiple possible nested structures
            const prodData = response?.data?.products || response?.data || response?.products || (Array.isArray(response) ? response : null);

            if (Array.isArray(prodData)) {
                const mapped = prodData.map((p: any) => ({
                    value: p._id || p.id || '',
                    label: p.name || 'Unknown Product',
                    image: p?.image || p?.images?.[0] || '',
                    price: p.price || 0,
                    original_price: p.original_price || 0
                }));
                console.log(`Successfully mapped ${mapped.length} products for ${catId}`);
                setCategoryProducts(prev => ({ ...prev, [catId]: mapped }));
            } else {
                console.warn(`No product array found in response for ${catId}`, response);
                setCategoryProducts(prev => ({ ...prev, [catId]: [] }));
            }
        } catch (error) {
            console.error('Error fetching products for category:', catId, error);
            setCategoryProducts(prev => ({ ...prev, [catId]: [] }));
        }
    };

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

                // Handle festive_config bundling/flattening
                const fConfig = data.festive_config || {};
                const preparedData = {
                    ...data,
                    festive_sale: fConfig.festive_sale || data.festive_sale || {},
                    header_tabs_config: fConfig.header_tabs_config || data.header_tabs_config || []
                };

                setSettings(preparedData);

                // Set images
                if (preparedData.logo_url) setLogoImages([{ dataURL: preparedData.logo_url }]);
                if (preparedData.favicon_url) setFaviconImages([{ dataURL: preparedData.favicon_url }]);
                if (preparedData.loader_logo_url) setLoaderImages([{ dataURL: preparedData.loader_logo_url }]);
                if (preparedData.banners) setBannerImages(preparedData.banners.map((url: string) => ({ dataURL: url })));
                if (preparedData.promo_banners) setPromoBannerImages([{ dataURL: preparedData.promo_banners }]);
                if (preparedData.festive_sale?.banner_url) setFestiveBannerImages([{ dataURL: preparedData.festive_sale.banner_url }]);
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

    const handleFestiveToggle = (value: boolean) => {
        setSettings(prev => ({
            ...prev,
            festive_sale: {
                ...(prev.festive_sale || { is_active: false, title: '', banner_url: '', accent_color: '#ffffff' }),
                is_active: value
            }
        }));
    };

    const handleFestiveChange = (field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            festive_sale: {
                ...(prev.festive_sale || { is_active: false, title: '', banner_url: '', accent_color: '#ffffff' }),
                [field]: value
            }
        }));
    };

    const addFestiveTab = () => {
        const newTab = { id: `festive_tab_${Date.now()}`, name: '', icon: 'Sparkles', color: '#ffffff' };
        const currentTabs = settings.festive_sale?.tabs || [];
        handleFestiveChange('tabs', [newTab, ...currentTabs]);
    };

    const updateFestiveTab = (index: number, field: string, value: any) => {
        const currentTabs = [...(settings.festive_sale?.tabs || [])];
        currentTabs[index] = { ...currentTabs[index], [field]: value };
        handleFestiveChange('tabs', currentTabs);
    };

    const removeFestiveTab = (index: number) => {
        const currentTabs = [...(settings.festive_sale?.tabs || [])];
        currentTabs.splice(index, 1);
        handleFestiveChange('tabs', currentTabs);
    };

    const updateTabFestive = (idx: number, field: string, value: any) => {
        const currentConfig = [...(settings.header_tabs_config || [])];
        if (currentConfig[idx]) {
            currentConfig[idx] = { ...currentConfig[idx], [field]: value };
            setSettings(prev => ({ ...prev, header_tabs_config: currentConfig }));
        }
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

            // Festive Sale Banner
            if (festiveBannerImages.length > 0) {
                if (festiveBannerImages[0].file) {
                    const url = await uploadImage(festiveBannerImages[0].file);
                    if (url) payload.festive_sale = { ...(payload.festive_sale || {}), banner_url: url };
                } else if (festiveBannerImages[0].dataURL) {
                    payload.festive_sale = { ...(payload.festive_sale || {}), banner_url: festiveBannerImages[0].dataURL };
                }
            } else {
                if (payload.festive_sale) {
                    payload.festive_sale.banner_url = null;
                }
            }

            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.id;

            // Bundle festive data into festive_config for backend
            payload.festive_config = {
                festive_sale: payload.festive_sale,
                header_tabs_config: payload.header_tabs_config
            };

            // Remove top-level festive fields to avoid redundancy/backend mismatch if necessary
            // Note: Keeping them might be fine, but the user specifically asked for 'festive_config'
            delete payload.festive_sale;
            delete payload.header_tabs_config;

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
                            { label: 'Core Information', isHeader: true },
                            { id: 'general', label: 'Business Profile', icon: <IconInfoCircle className="w-4 h-4" /> },
                            { id: 'branding', label: 'Visual Identity', icon: <IconCamera className="w-4 h-4" /> },

                            { label: 'Content & Display', isHeader: true },
                            { id: 'banners', label: 'Promotional Banners', icon: <IconGallery className="w-4 h-4" /> },
                            { id: 'secondary_banners', label: 'Row Banners', icon: <IconLayoutGrid className="w-4 h-4" /> },
                            { id: 'spotlight', label: 'Spotlight Config', icon: <IconStar className="w-4 h-4" /> },
                            { id: 'festive', label: 'Festive Sale', icon: <IconSparkles className="w-4 h-4" /> },

                            { label: 'Screen Management', isHeader: true },
                            { id: 'tabs', label: 'App Navigation', icon: <IconLayoutGrid className="w-4 h-4" /> },
                            { id: 'colors', label: 'Screen Colors', icon: <IconColorPalette className="w-4 h-4" /> },

                            { label: 'Business Logic', isHeader: true },
                            { id: 'system', label: 'System Logic', icon: <IconSettings className="w-4 h-4" /> },
                            { id: 'charges', label: 'Charges', icon: <IconCashBanknotes className="w-4 h-4" /> },
                            { id: 'time', label: 'Time Management', icon: <IconClock className="w-4 h-4" /> },

                            { label: 'Technical & Legal', isHeader: true },
                            { id: 'seo', label: 'SEO & Search', icon: <IconMenuPages className="w-4 h-4" /> },
                            { id: 'policies', label: 'Legal & Policy', icon: <IconFile className="w-4 h-4" /> },
                        ].map((t: any) => (
                            t.isHeader ? (
                                <div key={t.label} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white-dark/40 bg-gray-50/50 dark:bg-black/10 border-y border-gray-100 dark:border-white/5 mt-4 first:mt-0">
                                    {t.label}
                                </div>
                            ) : (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 ${activeTab === t.id
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'border-transparent text-white-dark hover:bg-gray-50 dark:hover:bg-black/20'
                                        }`}
                                >
                                    {t.icon}
                                    {t.label}
                                </button>
                            )
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
                                                                            <span className="text-[10px] text-white-dark font-bold">Total: {(item.products || []).length} items</span>
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

                    {activeTab === 'charges' && (
                        <div className="panel animate__animated animate__fadeIn space-y-6">
                            <h6 className="text-lg font-bold border-b pb-4 border-gray-100 dark:border-gray-800">Fees & Charges</h6>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                {/* Handling Charge */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-white-dark mb-0">Handling Charge</label>
                                        <Toggle checked={!!settings.is_handling_charge_enabled} onChange={(v) => handleToggle('is_handling_charge_enabled', v)} />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input id="handling_charge_amount" type="number" className="form-input pl-8" value={settings.handling_charge_amount || 0} onChange={handleChange} disabled={!settings.is_handling_charge_enabled} />
                                    </div>
                                </div>

                                {/* Platform Charge */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-white-dark mb-0">Platform Charge</label>
                                        <Toggle checked={!!settings.is_platform_charge_enabled} onChange={(v) => handleToggle('is_platform_charge_enabled', v)} />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input id="platform_charge_amount" type="number" className="form-input pl-8" value={settings.platform_charge_amount || 0} onChange={handleChange} disabled={!settings.is_platform_charge_enabled} />
                                    </div>
                                </div>

                                {/* Delivery Charge */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-white-dark mb-0">Delivery Charge</label>
                                        <Toggle checked={!!settings.is_delivery_charge_enabled} onChange={(v) => handleToggle('is_delivery_charge_enabled', v)} />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input id="delivery_charge_amount" type="number" className="form-input pl-8" value={settings.delivery_charge_amount || 0} onChange={handleChange} disabled={!settings.is_delivery_charge_enabled} />
                                    </div>
                                </div>

                                {/* Small Cart Charge */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-white-dark mb-0">Small Cart Charge</label>
                                        <Toggle checked={!!settings.is_small_cart_charge_enabled} onChange={(v) => handleToggle('is_small_cart_charge_enabled', v)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">MIN</span>
                                            <input id="small_cart_threshold" type="number" className="form-input pl-12" value={settings.small_cart_threshold || 0} onChange={handleChange} disabled={!settings.is_small_cart_charge_enabled} placeholder="Threshold" />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">FEE</span>
                                            <input id="small_cart_charge_amount" type="number" className="form-input pl-10" value={settings.small_cart_charge_amount || 0} onChange={handleChange} disabled={!settings.is_small_cart_charge_enabled} placeholder="Amount" />
                                        </div>
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
                                <div>
                                    <label className="text-xs font-bold uppercase text-white-dark mb-2 block">Cancellation Policy</label>
                                    <textarea id="cancellation_policy" rows={5} className="form-textarea" value={settings.cancellation_policy || ''} onChange={handleChange}></textarea>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'secondary_banners' && (
                        <div className="space-y-8 animate__animated animate__fadeIn">
                            {/* Quiet Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-6">
                                <div>
                                    <h6 className="text-lg font-bold tracking-tight">Showcase Gallery</h6>
                                    <p className="text-[10px] text-white-dark uppercase tracking-[0.2em] font-medium opacity-50">Manage your homepage banners</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSettings(prev => ({
                                            ...prev,
                                            secondary_banners: [
                                                ...(prev.secondary_banners || []),
                                                { title: 'New Collection', banners: [] }
                                            ]
                                        }));
                                    }}
                                    className="btn btn-primary btn-sm px-6 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <IconPlusCircle className="w-4 h-4" />
                                    Add Section
                                </button>
                            </div>

                            <ReactSortable
                                list={(settings.secondary_banners || []).map((s, idx) => ({ ...s, id: s.id || `s-${idx}` }))}
                                setList={(newList) => setSettings(prev => ({ ...prev, secondary_banners: newList as any }))}
                                handle=".section-drag-handle"
                                className="space-y-12"
                                animation={200}
                            >
                                {(settings.secondary_banners || []).map((section, sIdx) => (
                                    <div key={section.id || sIdx} className="space-y-6 group/section animate__animated animate__fadeInUp bg-white dark:bg-black/10 p-6 border border-gray-100 dark:border-white/5 relative" style={{ animationDelay: `${sIdx * 0.1}s` }}>
                                        {/* Professional Section Header - Sharp */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="section-drag-handle cursor-grab active:cursor-grabbing p-2.5 bg-gray-50 dark:bg-black/20 text-gray-300 hover:text-primary transition-colors">
                                                    <IconMenu className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 max-w-lg relative group/title">
                                                    <input
                                                        type="text"
                                                        value={section.title}
                                                        onChange={(e) => {
                                                            setSettings(prev => {
                                                                const next = [...(prev.secondary_banners || [])];
                                                                next[sIdx] = { ...next[sIdx], title: e.target.value };
                                                                return { ...prev, secondary_banners: next };
                                                            });
                                                        }}
                                                        className="bg-transparent border-none focus:ring-0 p-0 text-xl font-black tracking-tight placeholder:opacity-20 flex-1 hover:bg-black/5 dark:hover:bg-white/5 px-2 transition-all rounded-none"
                                                        placeholder="Section Name..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSettings(prev => {
                                                            const next = [...(prev.secondary_banners || [])];
                                                            next.splice(sIdx, 1);
                                                            return { ...prev, secondary_banners: next };
                                                        });
                                                    }}
                                                    className="p-2 text-danger hover:bg-danger/10 transition-all opacity-20 hover:opacity-100"
                                                >
                                                    <IconTrashLines className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Gallery Grid - Wide for Banners - Sharp */}
                                        <ReactSortable
                                            list={(section.banners || []).map((b, idx) => ({ ...b, id: b.id || `b-${sIdx}-${idx}` }))}
                                            setList={(newList) => {
                                                setSettings(prev => {
                                                    const next = [...(prev.secondary_banners || [])];
                                                    next[sIdx] = { ...next[sIdx], banners: newList as any };
                                                    return { ...prev, secondary_banners: next };
                                                });
                                            }}
                                            animation={200}
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                                        >
                                            {(section.banners || []).map((banner, bIdx) => (
                                                <div key={banner.id || bIdx} className="group/item aspect-[16/7] overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 relative cursor-grab active:cursor-grabbing hover:ring-2 ring-primary transition-all rounded-none">
                                                    {banner.image ? (
                                                        <>
                                                            <img src={banner.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/item:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-[4px]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSettings(prev => {
                                                                            const next = [...(prev.secondary_banners || [])];
                                                                            const newBanners = [...next[sIdx].banners];
                                                                            newBanners.splice(bIdx, 1);
                                                                            next[sIdx] = { ...next[sIdx], banners: newBanners };
                                                                            return { ...prev, secondary_banners: next };
                                                                        });
                                                                    }}
                                                                    className="text-white bg-danger p-2.5 hover:scale-110 transition-transform rounded-none"
                                                                >
                                                                    <IconTrashLines className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all text-gray-400 gap-3 rounded-none">
                                                            <div className="w-14 h-14 bg-white dark:bg-black/20 flex items-center justify-center">
                                                                <IconCamera className="w-7 h-7 opacity-20" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Upload Banner</span>
                                                            <input type="file" className="hidden" multiple onChange={async (e: any) => {
                                                                const files = Array.from(e.target.files || []) as File[];
                                                                if (files.length > 0) {
                                                                    const urls = await Promise.all(files.map(file => uploadImage(file)));
                                                                    const validUrls = (urls.filter(url => !!url) as string[]);
                                                                    if (validUrls.length > 0) {
                                                                        setSettings(prev => {
                                                                            const next = [...(prev.secondary_banners || [])];
                                                                            const newBanners = [...next[sIdx].banners];
                                                                            newBanners[bIdx] = { ...newBanners[bIdx], image: validUrls[0] };
                                                                            if (validUrls.length > 1) {
                                                                                newBanners.splice(bIdx + 1, 0, ...validUrls.slice(1).map((url, i) => ({ id: `b-${Date.now()}-${i}`, image: url })));
                                                                            }
                                                                            next[sIdx] = { ...next[sIdx], banners: newBanners };
                                                                            return { ...prev, secondary_banners: next };
                                                                        });
                                                                    }
                                                                }
                                                            }} />
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                            <label className="aspect-[16/7] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all text-gray-400 gap-3 group/add bg-gray-50/50 dark:bg-white/5 rounded-none">
                                                <div className="w-14 h-14 bg-white dark:bg-black/40 flex items-center justify-center group-hover/add:scale-110 group-hover/add:bg-primary/10 transition-all border border-gray-100 dark:border-white/5 shadow-sm">
                                                    <IconPlusCircle className="w-8 h-8 opacity-60 group-hover/add:opacity-100 group-hover/add:text-primary transition-all" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover/add:opacity-100 group-hover/add:text-primary transition-all">Add New Banner</span>
                                                <input type="file" className="hidden" multiple onChange={async (e: any) => {
                                                    const files = Array.from(e.target.files || []) as File[];
                                                    if (files.length > 0) {
                                                        const urls = await Promise.all(files.map(file => uploadImage(file)));
                                                        const validUrls = (urls.filter(url => !!url) as string[]);
                                                        if (validUrls.length > 0) {
                                                            setSettings(prev => {
                                                                const next = [...(prev.secondary_banners || [])];
                                                                next[sIdx] = {
                                                                    ...next[sIdx],
                                                                    banners: [
                                                                        ...(next[sIdx].banners || []),
                                                                        ...validUrls.map((url, i) => ({ id: `b-${Date.now()}-${i}`, image: url }))
                                                                    ]
                                                                };
                                                                return { ...prev, secondary_banners: next };
                                                            });
                                                        }
                                                    }
                                                }} />
                                            </label>
                                        </ReactSortable>
                                    </div>
                                ))}
                            </ReactSortable>

                            {(settings.secondary_banners || []).length === 0 && (
                                <div className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 mb-4 border border-gray-100 dark:border-white/5">
                                        <IconGallery className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] italic">No Showcase Sections Yet</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'festive' && (
                        <div className="panel animate__animated animate__fadeIn space-y-6">

                            {/* Tab Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase text-white-dark block px-1">Configure By Category</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {(settings.header_tabs_config || []).map((tab, idx) => (
                                        <button
                                            key={tab.id || idx}
                                            type="button"
                                            onClick={() => setSelectedFestiveTabIdx(idx)}
                                            className={`px-5 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all flex-none ${selectedFestiveTabIdx === idx ? 'border-primary bg-primary text-white' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {tab.name || 'Tab'}
                                            {tab.is_festive_active && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-white inline-block shadow-sm"></span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Config Form */}
                            {(() => {
                                const tabs = settings.header_tabs_config || [];
                                const currentTab = tabs[selectedFestiveTabIdx];
                                if (!currentTab) return null;

                                return (
                                    <div className="space-y-8 pt-6 border-t border-gray-100 dark:border-gray-800 animate__animated animate__fadeIn">
                                        <div className="flex items-center justify-between bg-white dark:bg-black/20 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <IconSparkles className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h6 className="font-bold text-sm leading-none">{currentTab.name} Campaign</h6>
                                                    <p className="text-[9px] text-white-dark uppercase tracking-widest mt-1">Configure theme & banners</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-gray-800">
                                                    <span className="text-[9px] font-bold uppercase text-white-dark tracking-tighter">Theme Color</span>
                                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                        <input type="color" className="w-6 h-6 rounded-lg border-2 border-white cursor-pointer shadow-sm" value={currentTab.festive_accent_color || '#ffffff'} onChange={(e) => updateTabFestive(selectedFestiveTabIdx, 'festive_accent_color', e.target.value)} />
                                                        <input type="text" className="bg-transparent border-none text-[10px] font-mono w-16 p-0 focus:ring-0 uppercase" value={currentTab.festive_accent_color || '#ffffff'} onChange={(e) => updateTabFestive(selectedFestiveTabIdx, 'festive_accent_color', e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold uppercase text-white-dark tracking-tighter">Status</span>
                                                    <Toggle
                                                        checked={!!currentTab.is_festive_active}
                                                        onChange={(val) => updateTabFestive(selectedFestiveTabIdx, 'is_festive_active', val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`space-y-10 ${!currentTab.is_festive_active ? 'opacity-40 grayscale pointer-events-none' : ''}`}>

                                            {/* Section 1: Single Banners - 2x2 Sortable Grid */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                                    <div>
                                                        <h6 className="text-sm font-bold leading-none">Single Banner Slots</h6>
                                                        <p className="text-[10px] text-white-dark mt-1 font-medium tracking-tight">Highlight up to 4 key categories (Drag to reorder)</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-black/40 px-3 py-1 rounded-full uppercase tracking-widest text-gray-500">Slots 1-4</span>
                                                </div>

                                                <ReactSortable
                                                    list={(() => {
                                                        const banners = [...(currentTab.festive_single_banners || [])];
                                                        while (banners.length < 4) banners.push({ image: '', parent_category_id: '' });
                                                        return banners.map((b, i) => ({ ...b, id: i })); // Add id for sortable
                                                    })()}
                                                    setList={(newList) => {
                                                        const cleaned = newList.map(({ id, ...rest }) => rest);
                                                        updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', cleaned);
                                                    }}
                                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                                    handle=".drag-handle"
                                                    animation={200}
                                                >
                                                    {(currentTab.festive_single_banners || [{ image: '', parent_category_id: '' }, { image: '', parent_category_id: '' }, { image: '', parent_category_id: '' }, { image: '', parent_category_id: '' }]).map((banner: any, idx) => {
                                                        return (
                                                            <div key={idx} className="bg-white dark:bg-black/20 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-all shadow-sm group/slot">
                                                                <div className="flex items-center justify-between mb-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-300 hover:text-primary transition-colors">
                                                                            <IconMenu className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] flex items-center justify-center font-extrabold">{idx + 1}</div>
                                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Campaign Slot</span>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-5">
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-bold text-white-dark uppercase ml-1">Master Category</label>
                                                                            <Select
                                                                                placeholder="Select"
                                                                                options={categoryList}
                                                                                value={categoryList.find(c => c.value === (banner as any).parent_category_id)}
                                                                                onChange={(opt: any) => {
                                                                                    const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                    while (newBanners.length < 4) newBanners.push({ image: '', parent_category_id: '' } as any);
                                                                                    newBanners[idx] = { ...newBanners[idx], parent_category_id: opt?.value || '', sub_category_id: '', category_id: '' };
                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                    if (opt?.value) fetchSubCategoriesByCategory(opt.value);
                                                                                }}
                                                                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                                isSearchable
                                                                                classNamePrefix="select"
                                                                                className="text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-bold text-white-dark uppercase ml-1">Sub Category</label>
                                                                            <Select
                                                                                placeholder="Sub"
                                                                                options={categorySubCategories[(banner as any).parent_category_id] || []}
                                                                                value={(categorySubCategories[(banner as any).parent_category_id] || []).find(s => s.value === banner.sub_category_id)}
                                                                                onChange={(opt: any) => {
                                                                                    const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                    while (newBanners.length < 4) newBanners.push({ image: '', parent_category_id: '' } as any);
                                                                                    newBanners[idx] = { ...newBanners[idx], sub_category_id: opt?.value || '', category_id: '' };
                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                    if (opt?.value) fetchNicheCategoriesBySubCategory(opt.value);
                                                                                }}
                                                                                onMenuOpen={() => {
                                                                                    if ((banner as any).parent_category_id) fetchSubCategoriesByCategory((banner as any).parent_category_id);
                                                                                }}
                                                                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                                isSearchable
                                                                                classNamePrefix="select"
                                                                                className="text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <label className="text-[10px] font-bold text-white-dark uppercase ml-1">Category ID</label>
                                                                            <Select
                                                                                placeholder="Niche"
                                                                                options={subCategoryNicheCategories[banner.sub_category_id || ''] || []}
                                                                                value={(subCategoryNicheCategories[banner.sub_category_id || ''] || []).find((n: any) => n.value === banner.category_id)}
                                                                                onChange={(opt: any) => {
                                                                                    const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                    while (newBanners.length < 4) newBanners.push({ image: '', parent_category_id: '' } as any);
                                                                                    newBanners[idx] = { ...newBanners[idx], category_id: opt?.value || '' };
                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                }}
                                                                                onMenuOpen={() => {
                                                                                    if (banner.sub_category_id) fetchNicheCategoriesBySubCategory(banner.sub_category_id);
                                                                                }}
                                                                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                                isSearchable
                                                                                classNamePrefix="select"
                                                                                className="text-xs"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-bold text-white-dark uppercase ml-1 block">Campaign Icon</label>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 group/img flex-shrink-0">
                                                                                {banner.image ? (
                                                                                    <>
                                                                                        <img src={banner.image} alt="" className="w-full h-full object-cover" />
                                                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-sm gap-1">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="text-white text-[9px] font-bold uppercase hover:underline"
                                                                                                onClick={() => {
                                                                                                    const input = document.createElement('input');
                                                                                                    input.type = 'file';
                                                                                                    input.onchange = async (e: any) => {
                                                                                                        if (e.target.files?.[0]) {
                                                                                                            const url = await uploadImage(e.target.files[0]);
                                                                                                            if (url) {
                                                                                                                const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                                                while (newBanners.length < 4) newBanners.push({ image: '', parent_category_id: '' });
                                                                                                                newBanners[idx] = { ...newBanners[idx], image: url };
                                                                                                                updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                                            }
                                                                                                        }
                                                                                                    };
                                                                                                    input.click();
                                                                                                }}
                                                                                            >
                                                                                                Change
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                className="text-danger-light text-[9px] font-bold uppercase hover:underline"
                                                                                                onClick={() => {
                                                                                                    const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                                    newBanners[idx] = { ...newBanners[idx], image: '' };
                                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                                }}
                                                                                            >
                                                                                                Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all text-gray-400">
                                                                                        <IconCamera className="w-6 h-6 mb-1 opacity-30" />
                                                                                        <input type="file" className="hidden" onChange={async (e: any) => {
                                                                                            if (e.target.files?.[0]) {
                                                                                                const url = await uploadImage(e.target.files[0]);
                                                                                                if (url) {
                                                                                                    const newBanners = [...(currentTab.festive_single_banners || [])];
                                                                                                    while (newBanners.length < 4) newBanners.push({ image: '', parent_category_id: '' });
                                                                                                    newBanners[idx] = { ...newBanners[idx], image: url };
                                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_single_banners', newBanners);
                                                                                                }
                                                                                            }
                                                                                        }} />
                                                                                    </label>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
                                                                                    Upload a small icon instead of a banner. Use PNG or JPG.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </ReactSortable>
                                            </div>

                                            {/* Section 2: Multi Banner Config - Full Width List */}
                                            <div className="space-y-6 pt-4">
                                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                                                    <div>
                                                        <h6 className="text-sm font-bold leading-none">Multi Banner Product Showcase</h6>
                                                        <p className="text-[10px] text-white-dark mt-1 font-medium tracking-tight">Display a sliding group of products for a single target category</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold bg-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest text-secondary group-category-badge">Group Campaign</span>
                                                </div>

                                                {(() => {
                                                    const cat = currentTab.festive_multi_banner || { category_id: '', items: [] };
                                                    return (
                                                        <div className="space-y-8">
                                                            <div className="bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[11px] font-bold text-white-dark uppercase ml-1 block">Master Category Filter</label>
                                                                        <Select
                                                                            placeholder="Select Base Category"
                                                                            options={categoryList}
                                                                            value={categoryList.find(c => c.value === (cat as any).parent_category_id)}
                                                                            onChange={(opt: any) => {
                                                                                const updated = { ...cat, parent_category_id: opt?.value || '', sub_category_id: '', category_id: '' };
                                                                                updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', updated);
                                                                                if (opt?.value) {
                                                                                    fetchSubCategoriesByCategory(opt.value);
                                                                                    fetchProductsByCategory(opt.value);
                                                                                }
                                                                            }}
                                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                            isSearchable
                                                                            classNamePrefix="select"
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[11px] font-bold text-white-dark uppercase ml-1 block">Sub Category Filter</label>
                                                                        <Select
                                                                            placeholder="Select Sub Category"
                                                                            options={categorySubCategories[(cat as any).parent_category_id] || []}
                                                                            value={(categorySubCategories[(cat as any).parent_category_id] || []).find(s => s.value === (cat as any).sub_category_id)}
                                                                            onChange={(opt: any) => {
                                                                                const updated = { ...cat, sub_category_id: opt?.value || '', category_id: '' };
                                                                                updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', updated);
                                                                                if (opt?.value) {
                                                                                    fetchNicheCategoriesBySubCategory(opt.value);
                                                                                    fetchProductsByCategory(opt.value);
                                                                                }
                                                                            }}
                                                                            onMenuOpen={() => {
                                                                                if ((cat as any).parent_category_id) fetchSubCategoriesByCategory((cat as any).parent_category_id);
                                                                            }}
                                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                            isSearchable
                                                                            classNamePrefix="select"
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[11px] font-bold text-white-dark uppercase ml-1 block">Category ID</label>
                                                                        <Select
                                                                            placeholder="Select Niche Category"
                                                                            options={subCategoryNicheCategories[(cat as any).sub_category_id || ''] || []}
                                                                            value={(subCategoryNicheCategories[(cat as any).sub_category_id || ''] || []).find(n => n.value === (cat as any).category_id)}
                                                                            onChange={(opt: any) => {
                                                                                const updated = { ...cat, category_id: opt?.value || '' };
                                                                                updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', updated);
                                                                                if (opt?.value) fetchProductsByCategory(opt.value);
                                                                            }}
                                                                            onMenuOpen={() => {
                                                                                if ((cat as any).sub_category_id) fetchNicheCategoriesBySubCategory((cat as any).sub_category_id);
                                                                            }}
                                                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                            isSearchable
                                                                            classNamePrefix="select"
                                                                            className="text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between px-2">
                                                                    <h6 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-[0.2em]">Showcased Products ({cat.items.length})</h6>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-primary btn-sm rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                                                                        disabled={!cat.category_id}
                                                                        onClick={() => {
                                                                            const updated = { ...cat, items: [...cat.items, { image: '', product_id: '' }] };
                                                                            updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', updated);
                                                                            if (cat.category_id) fetchProductsByCategory(cat.category_id);
                                                                        }}
                                                                    >
                                                                        + Add Product
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-3 no-scrollbar pb-5">
                                                                    {cat.items.map((item, iIdx) => (
                                                                        <div key={iIdx} className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 relative group/item hover:border-primary/20 transition-all shadow-sm">
                                                                            <button
                                                                                type="button"
                                                                                className="absolute top-2 right-2 text-danger opacity-0 group-hover/item:opacity-100 transition-all p-1.5 hover:bg-danger/10 rounded-full"
                                                                                onClick={() => {
                                                                                    const updatedItems = cat.items.filter((_, i) => i !== iIdx);
                                                                                    updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', { ...cat, items: updatedItems });
                                                                                }}
                                                                            >
                                                                                <IconX className="w-4 h-4" />
                                                                            </button>

                                                                            <div className="flex items-start gap-4">
                                                                                {/* Small Circular Preview (Icon Style) */}
                                                                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 flex-shrink-0 group/img relative">
                                                                                    {item.image ? (
                                                                                        <>
                                                                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all">
                                                                                                <label className="cursor-pointer text-white p-1">
                                                                                                    <IconCamera className="w-4 h-4 font-bold" />
                                                                                                    <input type="file" className="hidden" onChange={async (e: any) => {
                                                                                                        if (e.target.files?.[0]) {
                                                                                                            const url = await uploadImage(e.target.files[0]);
                                                                                                            if (url) {
                                                                                                                const updatedItems = [...cat.items];
                                                                                                                updatedItems[iIdx] = { ...updatedItems[iIdx], image: url };
                                                                                                                updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', { ...cat, items: updatedItems });
                                                                                                            }
                                                                                                        }
                                                                                                    }} />
                                                                                                </label>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all text-gray-300">
                                                                                            <IconCamera className="w-5 h-5 opacity-40" />
                                                                                            <input type="file" className="hidden" onChange={async (e: any) => {
                                                                                                if (e.target.files?.[0]) {
                                                                                                    const url = await uploadImage(e.target.files[0]);
                                                                                                    if (url) {
                                                                                                        const updatedItems = [...cat.items];
                                                                                                        updatedItems[iIdx] = { ...updatedItems[iIdx], image: url };
                                                                                                        updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', { ...cat, items: updatedItems });
                                                                                                    }
                                                                                                }
                                                                                            }} />
                                                                                        </label>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex-1 space-y-2 pr-6 pt-1">
                                                                                    <label className="text-[10px] font-bold text-white-dark uppercase block">Pick Product</label>
                                                                                    <Select
                                                                                        placeholder="Choose Product"
                                                                                        options={categoryProducts[cat.category_id || (cat as any).sub_category_id || (cat as any).parent_category_id] || []}
                                                                                        value={(categoryProducts[cat.category_id || (cat as any).sub_category_id || (cat as any).parent_category_id] || []).find(p => p.value === item.product_id)}
                                                                                        onChange={(opt: any) => {
                                                                                            const updatedItems = [...cat.items];
                                                                                            updatedItems[iIdx] = {
                                                                                                ...updatedItems[iIdx],
                                                                                                product_id: opt?.value || '',
                                                                                                image: opt?.image || updatedItems[iIdx].image,
                                                                                                price: opt?.price || 0,
                                                                                                original_price: opt?.original_price || 0
                                                                                            };
                                                                                            updateTabFestive(selectedFestiveTabIdx, 'festive_multi_banner', { ...cat, items: updatedItems });
                                                                                        }}
                                                                                        components={{ Option: CustomProductOption }}
                                                                                        onMenuOpen={() => {
                                                                                            const fetchId = cat.category_id || (cat as any).sub_category_id || (cat as any).parent_category_id;
                                                                                            if (fetchId) fetchProductsByCategory(fetchId);
                                                                                        }}
                                                                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                                                        isSearchable
                                                                                        classNamePrefix="select"
                                                                                        className="text-xs"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {/* Full Width Hero Banner (1000x240) */}
                                        <div className={`pt-10 border-t border-gray-100 dark:border-gray-800 space-y-4 ${!currentTab.is_festive_active ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-xs font-bold uppercase text-white-dark block">Main Campaign Hero Banner</label>
                                                <span className="text-[10px] text-primary font-bold tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full">Size: 1000 x 240</span>
                                            </div>
                                            <div className="relative aspect-[1000/240] rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex flex-col items-center justify-center group shadow-sm transition-all hover:border-primary/40">
                                                {currentTab.festive_banner_url ? (
                                                    <>
                                                        <img src={currentTab.festive_banner_url} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                                            <label className="btn btn-primary cursor-pointer rounded-full px-10 shadow-xl scale-90 group-hover:scale-100 transition-all duration-300">
                                                                Replace Hero Banner
                                                                <input type="file" className="hidden" onChange={async (e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        const url = await uploadImage(e.target.files[0]);
                                                                        if (url) updateTabFestive(selectedFestiveTabIdx, 'festive_banner_url', url);
                                                                    }
                                                                }} />
                                                            </label>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <label className="cursor-pointer text-center p-10 w-full h-full flex flex-col items-center justify-center hover:bg-primary/[0.02] transition-all">
                                                        <div className="w-16 h-16 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shadow-sm mb-4 border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-all">
                                                            <IconCamera className="w-8 h-8 text-primary/40" />
                                                        </div>
                                                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.3em]">Drop Main Banner Here</p>
                                                        <input type="file" className="hidden" onChange={async (e) => {
                                                            if (e.target.files?.[0]) {
                                                                const url = await uploadImage(e.target.files[0]);
                                                                if (url) updateTabFestive(selectedFestiveTabIdx, 'festive_banner_url', url);
                                                            }
                                                        }} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

const TabIcon = ({ name, className }: { name: string, className?: string }) => {
    switch (name) {
        case 'Home': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
        case 'Headphones': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
        case 'Sparkles': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
        case 'Baby': return <span className="text-xl">👶</span>;
        case 'Shirt': return <span className="text-xl">👕</span>;
        case 'Dumbbell': return <span className="text-xl">🏋️</span>;
        case 'UtensilsCrossed': return <span className="text-xl">🍴</span>;
        case 'Pill': return <span className="text-xl">💊</span>;
        case 'PawPrint': return <span className="text-xl">🐾</span>;
        default: return <IconSparkles className={className} />;
    }
};

const IconSparkles = ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 3.874L18.18 7.49l-3.09 3.011.729 4.259L12 12.75l-3.819 2.01.729-4.259-3.09-3.011 4.268-.616L12 3z" />
    </svg>
);

const IconColorPalette = ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
);

export default CompanySettingsForm;
