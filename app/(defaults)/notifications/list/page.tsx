'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AsyncSelect from 'react-select/async';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconSend from '@/components/icon/icon-send';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconBell from '@/components/icon/icon-bell';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import IconCamera from '@/components/icon/icon-camera';

const NotificationSend = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState('all'); // 'ALL', 'SINGLE', 'MULTIPLE'
    const [targetIds, setTargetIds] = useState<any[]>([]);
    const [images, setImages] = useState<ImageListType>([]);
    const [image, setImage] = useState('');
    const [type, setType] = useState('PROMOTIONAL'); // TRANSACTIONAL, PROMOTIONAL, etc.
    const [metadata, setMetadata] = useState('');
    const [loading, setLoading] = useState(false);

    const loadUserOptions = async (inputValue: string) => {
        try {
            const response = await callApi(`/management/admin/users?role=user&search=${inputValue || ''}&limit=50`, 'GET');
            if (response && response.data) {
                return response.data.map((u: any) => ({
                    value: u.id || u._id,
                    label: `${u.name} - ${u.phone || u.email || 'No Phone'}`
                }));
            }
            return [];
        } catch (error) { return []; }
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
            },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    const handleSendNotification = async () => {
        if (!title || !message) {
            showMessage('Title and Message are required', 'danger');
            return;
        }

        if (targetType !== 'all' && targetIds.length === 0) {
            showMessage('Please select at least one customer', 'danger');
            return;
        }

        try {
            setLoading(true);

            let finalImageUrl = image;

            // Handle Image Upload if new image selected
            if (images.length > 0 && images[0].file) {
                const uploadData = new FormData();
                uploadData.append('images', images[0].file);
                
                const uploadRes = await callApi('/upload', 'POST', uploadData);
                if (uploadRes && uploadRes.status === 'success' && Array.isArray(uploadRes.data) && uploadRes.data.length > 0) {
                    finalImageUrl = uploadRes.data[0].url;
                } else {
                    showMessage('Image upload failed', 'danger');
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                title,
                message,
                image: finalImageUrl,
                targetType,
                targetIds: targetType === 'single' 
                    ? (targetIds[0]?.value || targetIds[0] || null) 
                    : targetIds.map(u => typeof u === 'object' ? u.value : u),
                type,
                metadata: metadata ? JSON.parse(metadata) : {}
            };

            const response = await callApi('/management/admin/send-notification', 'POST', payload);
            console.log(response,"response")
            if (response) {
                showMessage('Broadcast Sent Successfully!', 'success');
                // Reset form
                setTitle('');
                setMessage('');
                setTargetIds([]);
                setImages([]);
                setImage('');
                setMetadata('');
            }
        } catch (error: any) {
            showMessage(error.message || 'Something went wrong', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-sm">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Promotion & Ranking</span></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Send Notification</span></li>
            </ul>

            <div className="mb-6 flex items-center gap-3 bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <IconBell className="w-6 h-6" />
                </div>
                <div>
                    <h5 className="text-lg font-black uppercase tracking-tight leading-none">Global Broadcast</h5>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-widest">Push notifications to mobile users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-7 panel shadow-sm border-none rounded-3xl p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-1">Notification Title</label>
                                <input type="text" placeholder="e.g. Flash Sale Live! 🔥" className="form-input text-xs font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-1">Message Body</label>
                                <textarea rows={3} placeholder="Write your message here..." className="form-textarea text-xs font-medium" value={message} onChange={(e) => setMessage(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-1">Notification Category</label>
                                <select className="form-select text-xs font-bold" value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="PROMOTIONAL">Promotional</option>
                                    <option value="TRANSACTIONAL">Transactional</option>
                                    <option value="ALERT">System Alert</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-1">Target Audience</label>
                                <select className="form-select text-xs font-bold" value={targetType} onChange={(e) => {
                                    setTargetType(e.target.value);
                                    setTargetIds([]);
                                }}>
                                    <option value="all">All Customers</option>
                                    <option value="single">Single Specific User</option>
                                    <option value="multiple">Selected User Group</option>
                                </select>
                            </div>

                            {(targetType === 'single' || targetType === 'multiple') && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black uppercase text-primary mb-1">Select User(s)</label>
                                    <AsyncSelect
                                        isMulti={targetType === 'multiple'}
                                        cacheOptions
                                        loadOptions={loadUserOptions}
                                        defaultOptions
                                        placeholder="Search name or phone..."
                                        className="text-xs font-bold"
                                        onChange={(opt: any) => setTargetIds(Array.isArray(opt) ? opt : (opt ? [opt] : []))}
                                    />
                                </div>
                            )}

                             {/* <div className="md:col-span-2">
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-1">Metadata (JSON format - Optional)</label>
                                <input type="text" placeholder='{"link": "/offers", "category": "beauty"}' className="form-input text-[10px] font-mono" value={metadata} onChange={(e) => setMetadata(e.target.value)} />
                            </div> */}

                            <div className="md:col-span-2 pt-4 border-t">
                                <label className="text-[11px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Notification Hero Image (Optional)</label>
                                <ImageUploading value={images} onChange={(list) => setImages(list)} maxNumber={1}>
                                    {({ imageList, onImageUpload, onImageRemove, isDragging, dragProps }) => (
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div
                                                className={`flex-1 border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-primary/5 ${
                                                    isDragging ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-800'
                                                }`}
                                                onClick={onImageUpload}
                                                {...dragProps}
                                            >
                                                <IconCamera className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-[10px] font-black uppercase text-gray-400">Click or Drag Image</p>
                                            </div>
                                            {imageList.length > 0 && (
                                                <div className="relative w-32 h-20 rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                                                    <img src={imageList[0].dataURL} alt="upload" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => onImageRemove(0)}
                                                    >
                                                        <IconTrashLines className="text-white w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ImageUploading>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center gap-3">
                            <button type="button" className="btn btn-primary gap-2 py-3 px-8 rounded-2xl shadow-lg shadow-primary/20 flex-1 uppercase font-black tracking-widest text-[12px]" onClick={handleSendNotification} disabled={loading}>
                                {loading ? <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-1"></span> : <IconSend className="w-5 h-5" />}
                                {loading ? 'Broadcasting...' : 'Dispatch Notification'}
                            </button>
                            <button type="button" className="btn btn-outline-danger p-3 rounded-2xl" onClick={() => { setTitle(''); setMessage(''); setTargetIds([]); setImages([]); setImage(''); setMetadata(''); }}>
                                <IconTrashLines className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-5 p-6 bg-gray-50 dark:bg-black/20 rounded-[40px] border-2 border-gray-100 dark:border-gray-800">
                    <h5 className="text-[11px] font-black uppercase text-gray-400 mb-6 tracking-widest text-center">Mobile Lockscreen Preview</h5>
                    <div className="flex justify-center">
                        <div className="w-[280px] h-[580px] bg-black rounded-[45px] border-[10px] border-gray-900 relative shadow-2xl overflow-hidden">
                            {/* Device Notch */}
                            <div className="absolute top-0 w-full h-7 bg-black z-20 flex justify-center items-end pb-1">
                                <div className="w-20 h-3 bg-gray-900 rounded-full"></div>
                            </div>

                            {/* Wallpaper Simulation */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-black/80"></div>

                            {/* Notification Bubble */}
                            <div className="relative mt-20 px-3 z-10 animate__animated animate__fadeInDown">
                                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-primary rounded shadow-inner flex items-center justify-center">
                                                <span className="text-[8px] text-white font-black italic">K</span>
                                            </div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">KUIKLO • JUST NOW</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h6 className="text-[13px] font-black text-black dark:text-white leading-tight mb-0.5 truncate">{title || 'Your Title Here'}</h6>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug line-clamp-3">{message || 'Your message content will appear in this area of the lockscreen...'}</p>
                                        </div>
                                        {(images.length > 0 || image) && (
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 animate__animated animate__zoomIn">
                                                <img src={images.length > 0 ? images[0].dataURL : image} className="w-full h-full object-cover" alt="preview" />
                                            </div>
                                        )}
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

export default NotificationSend;
