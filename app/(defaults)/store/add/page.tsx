'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, DrawingManager, Polygon, Marker, useJsApiLoader, type Libraries } from '@react-google-maps/api';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';

const libraries: Libraries = ['drawing'];

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

export default function AddStore() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Dropdown Data
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [storeManagers, setStoreManagers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        email: '',
        contact_number: '',
        is_service_available: true,
        latitude: 19.0760,
        longitude: 72.8777,
        open_time: '07:00',
        close_time: '23:59',
        warehouse_id: '',
        store_manager_id: '',
        is_cod_enabled: true,
        distance_threshold: 5000,
        priority_message: '',
        priority_message_color: '#FF0000',
    });

    const [polygons, setPolygons] = useState<any[]>([]);
    const [existingStores, setExistingStores] = useState<any[]>([]);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [whRes, smRes, stRes] = await Promise.all([
                    callApi('/management/admin/warehouses?limit=100', 'GET'),
                    callApi('/management/admin/list?role=store_manager&limit=100', 'GET'),
                    callApi('/management/admin/stores?limit=100', 'GET')
                ]);
                if (whRes?.data) setWarehouses(whRes.data);
                if (smRes?.data) setStoreManagers(smRes.data);
                if (stRes?.data) setExistingStores(stRes.data);
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
            }
        };
        fetchData();

        // Get user's current location for default coordinates
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        latitude: parseFloat(latitude.toFixed(6)),
                        longitude: parseFloat(longitude.toFixed(6))
                    }));
                },
                (error) => {
                    console.log('Location access denied/unavailable:', error);
                }
            );
        }
    }, []);

    useEffect(() => {
        if (mapRef.current && formData.latitude && formData.longitude) {
            const lat = parseFloat(String(formData.latitude));
            const lng = parseFloat(String(formData.longitude));
            if (!isNaN(lat) && !isNaN(lng)) {
                mapRef.current.panTo({ lat, lng });
            }
        }
    }, [formData.latitude, formData.longitude]);

    const handleChange = (e: any) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleToggle = (key: string, value: boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const onPolygonComplete = (poly: google.maps.Polygon) => {
        const path = poly.getPath().getArray().map(p => [p.lng(), p.lat()]);
        if (path.length > 0) {
            path.push(path[0]);
        }
        
        const newPolygon = {
            id: Date.now().toString(),
            coordinates: [path]
        };
        
        setPolygons([newPolygon]);
        poly.setMap(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (polygons.length === 0) {
            showMessage('Please draw a coverage area on the map.', 'danger');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                latitude: parseFloat(formData.latitude.toString()),
                longitude: parseFloat(formData.longitude.toString()),
                distance_threshold: parseFloat(formData.distance_threshold.toString()),
                coverage_polygon: {
                    type: 'Polygon',
                    coordinates: polygons[0].coordinates
                }
            };

            const response = await callApi('/management/admin/stores', 'POST', payload);

            if (response && response.status === 'success') {
                showMessage('Store created successfully', 'success');
                router.push('/store/list');
            }
        } catch (error: any) {
            showMessage(error.message || 'Error occurred while creating store.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/store/list" className="text-primary hover:underline">Store List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Add Store</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4">
                <h5 className="text-base font-semibold dark:text-white-light">Create New Dark Store</h5>
                <Link href="/store/list" className="btn btn-outline-primary gap-2">
                    <IconArrowBackward className="h-4 w-4" /> Back to List
                </Link>
            </div>

            <div className="panel">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Store Name *</label>
                            <input id="name" type="text" placeholder="Enter Store Name" className="form-input py-1.5 text-xs" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Store Address *</label>
                            <textarea id="address" placeholder="Enter Full Address" className="form-textarea py-1.5 text-xs min-h-[80px]" value={formData.address} onChange={handleChange} required />
                        </div>

                        <div>
                            <label htmlFor="city" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">City</label>
                            <input id="city" type="text" placeholder="Enter City" className="form-input py-1.5 text-xs" value={formData.city} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="email" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Store Email</label>
                            <input id="email" type="email" placeholder="Enter Email" className="form-input py-1.5 text-xs" value={formData.email} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="contact_number" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Contact Number</label>
                            <input id="contact_number" type="text" placeholder="Enter Contact Number" className="form-input py-1.5 text-xs" value={formData.contact_number} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="distance_threshold" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Distance Threshold (m)</label>
                            <input id="distance_threshold" type="number" placeholder="5000" className="form-input py-1.5 text-xs" value={formData.distance_threshold} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="open_time" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Open Time</label>
                            <input id="open_time" type="time" className="form-input py-1.5 text-xs" value={formData.open_time} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="close_time" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Close Time</label>
                            <input id="close_time" type="time" className="form-input py-1.5 text-xs" value={formData.close_time} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="warehouse_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Parent Warehouse</label>
                            <select id="warehouse_id" className="form-select py-1.5 text-xs" value={formData.warehouse_id} onChange={handleChange}>
                                <option value="">Select Warehouse</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="store_manager_id" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Store Manager</label>
                            <select id="store_manager_id" className="form-select py-1.5 text-xs" value={formData.store_manager_id} onChange={handleChange}>
                                <option value="">Select Manager</option>
                                {storeManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="priority_message" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Priority Message</label>
                            <input id="priority_message" type="text" placeholder="e.g. Lightning Fast Delivery" className="form-input py-1.5 text-xs" value={formData.priority_message} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="priority_message_color" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Message Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    id="priority_message_color" 
                                    type="color" 
                                    className="p-0 border-0 w-10 h-8 rounded-lg cursor-pointer bg-transparent" 
                                    value={formData.priority_message_color} 
                                    onChange={handleChange} 
                                />
                                <input 
                                    type="text" 
                                    className="form-input py-1.5 text-xs flex-1" 
                                    value={formData.priority_message_color} 
                                    onChange={(e) => setFormData({...formData, priority_message_color: e.target.value})} 
                                    placeholder="#FF0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="latitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Latitude</label>
                            <input id="latitude" type="number" step="any" className="form-input py-1.5 text-xs" value={formData.latitude} onChange={handleChange} />
                        </div>

                        <div>
                            <label htmlFor="longitude" className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-1">Longitude</label>
                            <input id="longitude" type="number" step="any" className="form-input py-1.5 text-xs" value={formData.longitude} onChange={handleChange} />
                        </div>

                        <div className="flex flex-wrap items-center gap-8 mt-4">
                            <div className="flex items-center gap-3">
                                <Toggle checked={formData.is_service_available} onChange={(v) => handleToggle('is_service_available', v)} />
                                <span className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight">Service Available</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Toggle checked={formData.is_cod_enabled} onChange={(v) => handleToggle('is_cod_enabled', v)} />
                                <span className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight">COD Enabled</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-4">
                            <label className="text-xs font-bold text-gray-700 dark:text-white-dark uppercase tracking-tight mb-2 block">Define Coverage Area (Draw Polygon on Map)</label>
                            {isLoaded ? (
                                <div className="h-[400px] rounded-lg border border-gray-200 overflow-hidden">
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ 
                                            lat: parseFloat(String(formData.latitude)) || 19.0760, 
                                            lng: parseFloat(String(formData.longitude)) || 72.8777 
                                        }}
                                        zoom={16}
                                        onLoad={(map) => { mapRef.current = map; }}
                                    >
                                        <Marker 
                                            position={{ 
                                                lat: parseFloat(String(formData.latitude)) || 19.0760, 
                                                lng: parseFloat(String(formData.longitude)) || 72.8777 
                                            }} 
                                            draggable 
                                            onDragEnd={(e:any) => setFormData(prev => ({...prev, latitude: e.latLng.lat(), longitude: e.latLng.lng()}))} 
                                        />
                                        <DrawingManager
                                            onPolygonComplete={onPolygonComplete}
                                            options={{
                                                drawingControl: true,
                                                drawingControlOptions: {
                                                    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                                                },
                                                polygonOptions: {
                                                    fillColor: '#3b82f6',
                                                    fillOpacity: 0.3,
                                                    strokeWeight: 2,
                                                    clickable: true,
                                                    editable: true,
                                                }
                                            }}
                                        />
                                        {/* Existing Stores Areas */}
                                        {existingStores.map((s: any) => {
                                            if (s.coverage_polygon?.coordinates?.[0]) {
                                                 const path = s.coverage_polygon.coordinates[0].map((coord: any) => ({ 
                                                     lng: Number(coord[0]), 
                                                     lat: Number(coord[1]) 
                                                 }));
                                                 return (
                                                     <Polygon 
                                                         key={s.id} 
                                                         path={path}
                                                         options={{
                                                             fillColor: '#ef4444',
                                                             fillOpacity: 0.12,
                                                             strokeColor: '#dc2626',
                                                             strokeWeight: 1,
                                                             strokeOpacity: 0.5,
                                                             clickable: false
                                                         }}
                                                     />
                                                 );
                                            }
                                            return null;
                                        })}
                                        {/* Current Drawing Area */}
                                        {polygons.map(p => (
                                            <Polygon 
                                                key={p.id} 
                                                path={p.coordinates[0].map((coord: any) => ({ lng: Number(coord[0]), lat: Number(coord[1]) }))}
                                                options={{ fillColor: '#dc2626', fillOpacity: 0.3, strokeWeight: 2 }}
                                            />
                                        ))}
                                    </GoogleMap>
                                </div>
                            ) : (
                                <div className="h-[400px] bg-gray-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                                    <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                                    <p className="text-sm font-semibold text-gray-700">Google Maps API Key Missing or Invalid</p>
                                    <p className="text-xs text-gray-500 mt-1">Please check your .env file for NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" className="btn btn-outline-danger px-4 py-1.5 text-xs" onClick={() => router.push('/store/list')} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4 py-1.5 text-xs gap-1.5" disabled={loading}>
                            {loading ? (
                                <span className="animate-spin rounded-full border-2 border-white border-l-transparent w-3.5 h-3.5"></span>
                            ) : (
                                <IconSave className="h-4 w-4" />
                            )}
                            {loading ? 'Processing...' : 'Save Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
