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
import IconCalendar from '@/components/icon/icon-calendar';

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

    // Scheduling states
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

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

    const [excelFile, setExcelFile] = useState<File | null>(null);
    const downloadSampleExcel = () => {
        const csvContent = "phone_number\n+919876543210\n+911234567890";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "notification_bulk_format.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendNotification = async () => {
        if (!title || !message) {
            showMessage('Title and Message are required', 'danger');
            return;
        }

        if (targetType === 'excel' && !excelFile) {
            showMessage('Please upload an excel/csv file for bulk audience', 'danger');
            return;
        }

        if (targetType !== 'all' && targetType !== 'excel' && targetIds.length === 0) {
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

            const formData = new FormData();
            formData.append('title', title);
            formData.append('message', message);
            formData.append('image', finalImageUrl);
            formData.append('targetType', targetType);
            formData.append('type', type);
            formData.append('metadata', metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : '{}');
            formData.append('scheduledAt', isScheduled ? scheduledAt : '');
            formData.append('status', isScheduled ? 'PENDING' : 'SENT');

            if (targetType === 'excel' && excelFile) {
                formData.append('excelFile', excelFile);
            } else {
                formData.append('targetIds', targetType === 'single'
                    ? JSON.stringify(targetIds[0]?.value || targetIds[0] || null)
                    : JSON.stringify(targetIds.map(u => typeof u === 'object' ? u.value : u)));
            }

            const result = await callApi('/management/admin/send-notification', 'POST', formData);
            
            if (result && result.success) {
                showMessage(isScheduled ? 'Notification Scheduled Successfully!' : 'Broadcast Sent Successfully!', 'success');
                // Reset form
                setTitle('');
                setMessage('');
                setTargetIds([]);
                setImages([]);
                setImage('');
                setMetadata('');
                setIsScheduled(false);
                setScheduledAt('');
                setExcelFile(null);
            } else {
                throw new Error(result?.message || 'Broadcast failed');
            }
        } catch (error: any) {
            showMessage(error.message || 'Something went wrong', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const [perms, setPerms] = useState<any>(null);
    useEffect(() => {
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
            try {
                setPerms(typeof storedPerms === 'string' ? JSON.parse(storedPerms) : storedPerms);
            } catch (e) { }
        }
    }, []);

    const uRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const hasPerm = (mod: string, action: string) => {
        if (uRole === 'super_admin') return true;
        if (uRole !== 'admin') return true; // Condition only for 'admin' role
        let currentPerms = perms;
        if (typeof perms === 'string') try { currentPerms = JSON.parse(perms); } catch (e) { }
        return currentPerms?.[mod]?.[action] === true;
    };

    return (
        <div className="animate__animated animate__fadeIn">
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse text-sm">
                <li><Link href="/" className="text-primary hover:underline font-bold">Dashboard</Link></li>
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
                <div className="lg:col-span-7 panel shadow-2xl border-none rounded-[32px] p-6 bg-white dark:bg-[#1a1c2d]">
                    <div className="space-y-4">
                        {/* Header Row */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8">
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Notification Title</label>
                                <input type="text" placeholder="e.g. Flash Sale Live! 🔥" className="form-input text-xs font-black py-3 rounded-2xl border-gray-100 dark:border-gray-800 focus:ring-primary/20 transition-all hover:border-primary/30" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Category</label>
                                <select className="form-select text-xs font-black py-3 rounded-2xl border-gray-100 dark:border-gray-800 focus:ring-primary/20 transition-all hover:border-primary/30" value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="PROMOTIONAL">Promotional</option>
                                    <option value="TRANSACTIONAL">Transactional</option>
                                    <option value="ALERT">System Alert</option>
                                </select>
                            </div>
                        </div>

                        {/* Message Row */}
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Message Body</label>
                            <textarea rows={2} placeholder="Write your message here..." className="form-textarea text-xs font-medium py-3 rounded-2xl border-gray-100 dark:border-gray-800 focus:ring-primary/20 transition-all hover:border-primary/30" value={message} onChange={(e) => setMessage(e.target.value)} />
                        </div>

                        {/* Targeting & Scheduling */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1 tracking-widest">Target Audience</label>
                                <div className="relative">
                                    <select className="form-select text-xs font-black py-3 rounded-2xl border-gray-100 dark:border-gray-800 transition-all hover:border-primary/30" value={targetType} onChange={(e) => {
                                        setTargetType(e.target.value);
                                        if (e.target.value !== 'excel') {
                                            setTargetIds([]);
                                            setExcelFile(null);
                                        }
                                    }}>
                                        <option value="all">Everyone (Broadcast)</option>
                                        <option value="single">Specific Customer</option>
                                        <option value="multiple">Selected User Segment</option>
                                        <option value="excel">Excel Upload (Bulk)</option>
                                    </select>
                                </div>
                            </div>

                            {targetType === 'excel' && (
                                <div className="md:col-span-2 animate__animated animate__fadeIn animate__faster bg-primary/5 p-4 rounded-[24px] border border-primary/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Excel Audience Upload</span>
                                            <span className="text-[9px] font-bold text-gray-500">Provide CSV with phone_number column</span>
                                        </div>
                                        <button type="button" onClick={downloadSampleExcel} className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">
                                            Get Sample Layout
                                        </button>
                                    </div>
                                    
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            id="excel-bulk-upload" 
                                            accept=".csv"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setExcelFile(e.target.files[0]);
                                            }}
                                        />
                                        <label 
                                            htmlFor="excel-bulk-upload"
                                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-primary rounded-2xl cursor-pointer transition-all bg-white dark:bg-gray-800 shadow-sm"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-all">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-primary transition-colors">
                                                    <path d="M12 16V8M12 8L15 11M12 8L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M7 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                                {excelFile ? excelFile.name : 'Click to Select CSV'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className={`transition-all duration-500 rounded-2xl p-0.5 ${isScheduled ? 'bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <div className={`h-full w-full rounded-[14px] flex items-center justify-between px-4 py-2 transition-all ${isScheduled ? 'bg-white/95 dark:bg-black/90' : 'bg-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-all ${isScheduled ? 'bg-primary text-white scale-110 shadow-md' : 'text-gray-400 bg-gray-200/50 dark:bg-gray-700'}`}>
                                            <IconCalendar className="w-3.5 h-3.5" />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-tight ${isScheduled ? 'text-primary' : 'text-gray-400'}`}>Scheduling</span>
                                    </div>
                                    <label className="w-10 h-5 relative rounded-full cursor-pointer overflow-hidden">
                                        <input type="checkbox" className="absolute w-full h-full opacity-0 z-10 cursor-pointer peer" checked={isScheduled} onChange={() => setIsScheduled(!isScheduled)} />
                                        <span className="block h-full w-full bg-gray-300 dark:bg-gray-600 transition-all peer-checked:bg-primary">
                                            <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 ${isScheduled ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* User Search Expansion */}
                            {(targetType === 'single' || targetType === 'multiple') && (
                                <div className="md:col-span-2 animate__animated animate__fadeIn animate__faster bg-primary/5 p-4 rounded-[24px] border border-primary/10">
                                    <label className="text-[10px] font-black uppercase text-primary mb-2 ml-1 tracking-[0.1em] flex items-center gap-2">
                                        <div className="w-1 h-1 bg-primary rounded-full"></div> Search Customer(s)
                                    </label>
                                    <AsyncSelect
                                        isMulti={targetType === 'multiple'}
                                        cacheOptions
                                        loadOptions={loadUserOptions}
                                        defaultOptions
                                        placeholder="Type name or phone number..."
                                        className="text-[11px] font-black"
                                        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                border: 'none',
                                                borderRadius: '14px',
                                                padding: '2px 8px',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'white',
                                                cursor: 'pointer'
                                            }),
                                            placeholder: (p) => ({ ...p, color: '#94a3b8' }),
                                            menu: (provided) => ({
                                                ...provided,
                                                borderRadius: '18px',
                                                overflow: 'hidden',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                border: '1px solid #f1f5f9',
                                                padding: '8px',
                                                zIndex: 9999,
                                                backgroundColor: 'white'
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                borderRadius: '10px',
                                                margin: '2px 0',
                                                padding: '10px 14px',
                                                backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? '#f8fafc' : 'white',
                                                color: state.isSelected ? 'white' : '#1e293b',
                                                cursor: 'pointer',
                                                fontWeight: '800',
                                                fontSize: '11px',
                                                '&:active': {
                                                    backgroundColor: '#4361ee20'
                                                }
                                            }),
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            singleValue: (provided) => ({ ...provided, color: '#1e293b' }),
                                            multiValue: (provided) => ({
                                                ...provided,
                                                backgroundColor: '#4361ee10',
                                                borderRadius: '8px',
                                                padding: '2px'
                                            }),
                                            multiValueLabel: (provided) => ({
                                                ...provided,
                                                color: '#4361ee',
                                                fontWeight: '800',
                                                fontSize: '10px',
                                                padding: '2px 6px'
                                            }),
                                            multiValueRemove: (provided) => ({
                                                ...provided,
                                                color: '#4361ee',
                                                '&:hover': {
                                                    backgroundColor: '#4361ee',
                                                    color: 'white',
                                                    borderRadius: '6px'
                                                }
                                            })
                                        }}
                                        onChange={(opt: any) => setTargetIds(Array.isArray(opt) ? opt : (opt ? [opt] : []))}
                                    />
                                </div>
                            )}

                            {/* Schedule Time Expansion */}
                            {isScheduled && (
                                <div className="md:col-span-2 animate__animated animate__fadeIn animate__faster bg-gradient-to-br from-primary/10 to-blue-500/5 p-4 rounded-[24px] border border-primary/20">
                                    <label className="text-[10px] font-black uppercase text-primary mb-2 ml-1 tracking-[0.1em] flex items-center gap-2">
                                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div> Dispatch Time Configuration
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="datetime-local"
                                            className="form-input bg-white dark:bg-[#0e1726] border-none shadow-md text-xs font-black py-4 px-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                            value={scheduledAt}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Image Attachment Row */}
                        <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                            <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/20 p-3 rounded-3xl border border-gray-100 dark:border-gray-800/50">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Attachment</span>
                                <ImageUploading value={images} onChange={(list) => setImages(list)} maxNumber={1}>
                                    {({ imageList, onImageUpload, onImageRemove, isDragging, dragProps }) => (
                                        <div className="flex-1 flex items-center gap-4">
                                            <div
                                                className={`flex-1 h-12 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                                                    }`}
                                                onClick={onImageUpload}
                                                {...dragProps}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm">
                                                        <IconCamera className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Click or Drag Hero Image (Optional)</p>
                                                </div>
                                            </div>
                                            {imageList.length > 0 && (
                                                <div className="relative w-16 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-white ring-1 ring-gray-100 group shrink-0">
                                                    <img src={imageList[0].dataURL} alt="upload" className="w-full h-full object-cover" />
                                                    <button type="button" className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-110 group-hover:scale-100" onClick={() => onImageRemove(0)}>
                                                        <IconTrashLines className="text-white w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </ImageUploading>
                            </div>
                        </div>

                        {/* Action Row */}
                        <div className="pt-6">
                            <button
                                type="button"
                                className={`btn btn-primary w-full py-4 rounded-[20px] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all overflow-hidden relative group ${!hasPerm('notifications', 'create') ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                                onClick={hasPerm('notifications', 'create') ? handleSendNotification : () => showMessage('Access Denied: You do not have permission to send notifications.', 'danger')}
                                disabled={loading}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                {loading ? (
                                    <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5"></span>
                                ) : (
                                    <IconSend className={`w-5 h-5 ${isScheduled ? 'rotate-12' : ''}`} />
                                )}
                                <span className="uppercase font-black text-xs tracking-[0.2em]">{loading ? 'Processing Broadcast...' : (isScheduled ? 'Confirm Schedule' : 'Send Push Update')}</span>
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
