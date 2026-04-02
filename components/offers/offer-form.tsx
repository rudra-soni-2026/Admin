'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import Select from 'react-select';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

interface OfferFormProps {
    id?: string;
    title?: string;
}

const OfferForm = ({ id, title }: OfferFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const [formData, setFormData] = useState({
        productId: '',
        minQuantity: 1,
        minOrderValue: 0,
        offerPrice: '',
        description: '',
        startDate: new Date(),
        expiryDate: null as Date | null,
    });

    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchOfferDetail();
        }
        fetchInitialProducts();
    }, [id]);

    const fetchOfferDetail = async () => {
        try {
            setLoading(true);
            
            // Try loading from localStorage first to avoid API call
            const stored = localStorage.getItem(`edit_offer_${id}`);
            let offer = null;
            if (stored) {
                try {
                    offer = JSON.parse(stored);
                } catch (e) {}
            }

            if (!offer) {
                const response = await callApi(`management/admin/offers/${id}`, 'GET');
                if (response && response.status === 'success') {
                    offer = response.data;
                }
            }

            if (offer) {
                setFormData({
                    productId: offer.productId?._id || offer.productId,
                    minQuantity: offer.minQuantity,
                    minOrderValue: offer.minOrderValue,
                    offerPrice: offer.offerPrice.toString(),
                    description: offer.description || '',
                    startDate: new Date(offer.startDate),
                    expiryDate: offer.expiryDate ? new Date(offer.expiryDate) : null,
                });
                if (offer.productId) {
                    setSelectedProduct({
                        value: offer.productId._id,
                        label: String(offer.productId.name || 'Unknown Product'),
                        image: offer.productId.image
                    });
                }
            } else if (id) {
                // Fallback if no data and API fails
                router.push('/offers/list');
            }
        } catch (error) {
            console.error('Error fetching offer detail:', error);
            if (id) router.push('/offers/list');
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialProducts = async (search = '') => {
        try {
            setFetchingProducts(true);
            const response = await callApi(`/management/admin/products?limit=20&search=${search}&isActive=true`, 'GET');
            if (response && response.status === 'success') {
                const options = response.data.map((p: any) => ({
                    value: p._id,
                    label: String(p.name || 'Unknown Product'),
                    image: p.image
                }));
                setProducts(options);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setFetchingProducts(false);
        }
    };

    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        toast.fire({ icon: type, title: msg });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.productId || !formData.offerPrice) {
            showMessage('Product and Offer Price are required.', 'danger');
            return;
        }

        try {
            setLoading(true);
            const method = id ? 'PATCH' : 'POST';
            const url = id ? `management/admin/offers/${id}` : 'management/admin/offers';
            
            const response = await callApi(url, method, formData);

            if (response && response.status === 'success') {
                showMessage(`Offer ${id ? 'updated' : 'created'} successfully`, 'success');
                router.push('/offers/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const customStyles = {
        control: (base: any) => ({
            ...base,
            padding: '2px',
            borderRadius: '8px',
            borderColor: 'rgb(224 226 231)',
            '&:hover': { borderColor: '#4361ee' }
        }),
        option: (base: any, state: { isSelected: any; isFocused: any; }) => ({
            ...base,
            backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? '#f3f4f6' : 'white',
            color: state.isSelected ? 'white' : 'black',
            cursor: 'pointer'
        })
    };

    return (
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Offer Management</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>{id ? 'Edit' : 'Add'} Offer</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <h5 className="text-lg font-bold dark:text-white-light">{id ? 'Edit' : 'Create New'} Product Offer</h5>
                <Link href="/offers/list" className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Product Selection */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Search Product *</label>
                            <Select
                                placeholder="Type to search product..."
                                options={products}
                                isLoading={fetchingProducts}
                                onInputChange={(val) => {
                                    if (val.length > 2) {
                                        fetchInitialProducts(val);
                                    }
                                }}
                                value={selectedProduct}
                                formatOptionLabel={(p: any) => (
                                    <div className="flex items-center gap-3">
                                        <img src={p.image || '/assets/images/placeholder.png'} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                                        <span className="font-semibold text-sm">{p.label}</span>
                                    </div>
                                )}
                                onChange={(opt: any) => {
                                    setSelectedProduct(opt);
                                    setFormData({ ...formData, productId: opt?.value });
                                }}
                                styles={{ ...customStyles, menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) }}
                                menuPortalTarget={isMounted ? document.body : null}
                                isClearable
                            />
                        </div>

                        {/* Offer Price */}
                        <div>
                            <label htmlFor="offerPrice" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Offer Price (₹) *</label>
                            <input 
                                id="offerPrice" 
                                type="number" 
                                placeholder="Enter Special Price" 
                                className="form-input" 
                                value={formData.offerPrice}
                                onChange={(e) => setFormData({...formData, offerPrice: e.target.value})}
                                required
                            />
                        </div>

                        {/* Min Quantity */}
                        <div>
                            <label htmlFor="minQuantity" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Maximum Quantity</label>
                            <input 
                                id="minQuantity" 
                                type="number" 
                                className="form-input" 
                                value={formData.minQuantity}
                                onChange={(e) => setFormData({...formData, minQuantity: parseInt(e.target.value)})}
                            />
                        </div>

                        {/* Min Order Value */}
                        <div>
                            <label htmlFor="minOrderValue" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Minimum Order Value (₹)</label>
                            <input 
                                id="minOrderValue" 
                                type="number" 
                                className="form-input" 
                                value={formData.minOrderValue}
                                onChange={(e) => setFormData({...formData, minOrderValue: parseFloat(e.target.value)})}
                            />
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Start Date</label>
                                <Flatpickr
                                    value={formData.startDate}
                                    options={{ dateFormat: 'Y-m-d' }}
                                    className="form-input"
                                    onChange={(date) => setFormData({ ...formData, startDate: date[0] })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Expiry Date</label>
                                <Flatpickr
                                    value={formData.expiryDate || ''}
                                    options={{ dateFormat: 'Y-m-d' }}
                                    className="form-input"
                                    onChange={(date) => setFormData({ ...formData, expiryDate: date[0] })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Offer Description</label>
                            <textarea 
                                id="description" 
                                rows={3}
                                placeholder="E.g. Special weekend deal for wholesale buyers" 
                                className="form-textarea" 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" className="btn btn-outline-danger" onClick={() => router.push('/offers/list')}>Cancel</button>
                        <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
                            {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span> : <IconSave className="w-5 h-5" />}
                            {id ? 'Update Offer' : 'Save Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfferForm;
