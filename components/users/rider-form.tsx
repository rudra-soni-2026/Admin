'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import IconCamera from '@/components/icon/icon-camera';
import IconTrashLines from '@/components/icon/icon-trash-lines';

interface RiderFormProps {
    id?: string;
    editData?: any;
}

const RiderForm = (props: RiderFormProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        vehicleType: 'Bike', // Bike, Scooter, Cycle
        vehicleNumber: '',
        vehicleModel: '',
        homeAddress: '',
        storeId: '',
        documents: {
            license_url: '',
            aadhar_url: '',
            insurance_url: ''
        }
    });

    const [licenseImages, setLicenseImages] = useState<ImageListType>([]);
    const [aadharImages, setAadharImages] = useState<ImageListType>([]);
    const [insuranceImages, setInsuranceImages] = useState<ImageListType>([]);

    const isEdit = !!props.id;

    useEffect(() => {
        fetchStores();
        if (isEdit && props.editData) {
            let parsedDocs = props.editData.documents || {
                license_url: '',
                aadhar_url: '',
                insurance_url: ''
            };
            
            if (typeof parsedDocs === 'string') {
                try {
                    parsedDocs = JSON.parse(parsedDocs);
                } catch (e) {
                    console.error("Error parsing documents", e);
                    parsedDocs = {
                        license_url: '',
                        aadhar_url: '',
                        insurance_url: ''
                    };
                }
            }

            setFormData({
                ...formData,
                ...props.editData,
                name: props.editData.user?.name || props.editData.name || '',
                phone: props.editData.user?.phone || props.editData.phone || '',
                email: props.editData.user?.email || props.editData.email || '',
                documents: parsedDocs,
                password: '' // Keep password empty on edit
            });
            
            if (parsedDocs.license_url) setLicenseImages([{ dataURL: parsedDocs.license_url }]);
            if (parsedDocs.aadhar_url) setAadharImages([{ dataURL: parsedDocs.aadhar_url }]);
            if (parsedDocs.insurance_url) setInsuranceImages([{ dataURL: parsedDocs.insurance_url }]);
        }
    }, [props.id, props.editData]);

    const fetchStores = async () => {
        try {
            const response = await callApi('/management/admin/stores?limit=100', 'GET');
            if (response && response.data) setStores(response.data);
        } catch (error) { console.error('Error fetching stores', error); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || (!isEdit && !formData.password)) {
            showMessage('Please fill in required fields.', 'danger');
            return;
        }

        try {
            setLoading(true);
            const payload = { ...formData };

            // Upload docs if new files selected
            if (licenseImages.length > 0 && licenseImages[0].file) {
                const url = await uploadImage(licenseImages[0].file);
                if (url) payload.documents.license_url = url;
            }
            if (aadharImages.length > 0 && aadharImages[0].file) {
                const url = await uploadImage(aadharImages[0].file);
                if (url) payload.documents.aadhar_url = url;
            }
            if (insuranceImages.length > 0 && insuranceImages[0].file) {
                const url = await uploadImage(insuranceImages[0].file);
                if (url) payload.documents.insurance_url = url;
            }

            if (isEdit && !payload.password) delete (payload as any).password;

            const response = await callApi(isEdit ? `/management/admin/riders/${props.id}` : '/management/admin/riders', isEdit ? 'PATCH' : 'POST', payload);

            if (response) {
                if (isEdit) localStorage.removeItem(`edit_rider_${props.id}`);
                showMessage(`Rider ${isEdit ? 'updated' : 'create'} successfully`, 'success');
                router.push('/riders/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Riders</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>{isEdit ? 'Edit' : 'Add'} Rider</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4 shadow-sm border-none">
                <h5 className="text-base font-bold uppercase tracking-tight">{isEdit ? 'Update' : 'Register New'} Rider</h5>
                <Link href="/riders/list" className="btn btn-outline-primary gap-2 btn-sm uppercase font-bold text-[10px]">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="panel shadow-sm border-none space-y-4">
                        <h6 className="text-xs font-black uppercase text-primary mb-2 border-b pb-2">Personal Information</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Full Name</label>
                                <input id="name" type="text" className="form-input" placeholder="Enter Full Name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Phone Number</label>
                                <input id="phone" type="text" className="form-input" placeholder="Enter Phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Email Address</label>
                            <input id="email" type="email" className="form-input" placeholder="Enter Email" value={formData.email} onChange={handleChange} />
                        </div>
                        {!isEdit && (
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Password</label>
                                <input id="password" type="password" className="form-input" placeholder="Create Password" value={formData.password} onChange={handleChange} required />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Home Address</label>
                            <textarea id="homeAddress" rows={2} className="form-textarea" placeholder="Enter Home Address" value={formData.homeAddress} onChange={handleChange}></textarea>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Assign Store</label>
                            <select id="storeId" className="form-select" value={formData.storeId} onChange={handleChange}>
                                <option value="">Select Store</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="panel shadow-sm border-none space-y-4">
                        <h6 className="text-xs font-black uppercase text-primary mb-2 border-b pb-2">Vehicle Details</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Vehicle Type</label>
                                <select id="vehicleType" className="form-select" value={formData.vehicleType} onChange={handleChange}>
                                    <option value="Bike">Bike</option>
                                    <option value="Scooter">Scooter</option>
                                    <option value="Cycle">Cycle</option>
                                    <option value="Electric Bike">Electric Bike</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Vehicle Number</label>
                                <input id="vehicleNumber" type="text" className="form-input" placeholder="e.g. DL-01-AB-1234" value={formData.vehicleNumber} onChange={handleChange} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Vehicle Model</label>
                            <input id="vehicleModel" type="text" className="form-input" placeholder="e.g. Honda Activa 6G" value={formData.vehicleModel} onChange={handleChange} />
                        </div>
                        
                        <div className="mt-6 flex flex-col gap-4">
                             <h6 className="text-xs font-black uppercase text-primary mb-1">Documents Upload</h6>
                             <div className="grid grid-cols-3 gap-2">
                                 {/* License */}
                                 <DocumentUpload label="License" state={licenseImages} setState={setLicenseImages} />
                                 {/* Aadhar */}
                                 <DocumentUpload label="Aadhar" state={aadharImages} setState={setAadharImages} />
                                 {/* Insurance */}
                                 <DocumentUpload label="Insurance" state={insuranceImages} setState={setInsuranceImages} />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 panel shadow-sm">
                    <button type="button" className="btn btn-outline-danger px-10" onClick={() => router.push('/riders/list')}>Cancel</button>
                    <button type="submit" className="btn btn-primary gap-2 px-10" disabled={loading}>
                        {loading ? <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-4 h-4"></span> : <IconSave className="w-5 h-5" />}
                        {isEdit ? 'Update' : 'Create'} Rider
                    </button>
                </div>
            </form>
        </div>
    );
};

const DocumentUpload = ({ label, state, setState }: any) => {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 text-center block tracking-tighter">{label}</label>
            <ImageUploading value={state} onChange={setState} maxNumber={1}>
                {({ imageList, onImageUpload, onImageRemove }) => (
                    <div className="relative group mx-auto w-full aspect-square bg-gray-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                        {imageList.length > 0 ? (
                            <>
                                <img src={imageList[0].dataURL} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => onImageRemove(0)} className="absolute top-1 right-1 bg-danger text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all scale-75">
                                    <IconTrashLines className="w-3 h-3" />
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={onImageUpload} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100">
                                <IconCamera className="w-5 h-5" />
                                <span className="text-[8px] font-black uppercase">Upload</span>
                            </button>
                        )}
                    </div>
                )}
            </ImageUploading>
        </div>
    );
};

export default RiderForm;
