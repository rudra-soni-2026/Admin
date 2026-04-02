'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleMap, Polygon, Marker, useJsApiLoader } from '@react-google-maps/api';
import { callApi } from '@/utils/api';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconUser from '@/components/icon/icon-user';
import IconHome from '@/components/icon/icon-home';
import { AlertCircle, Clock, Map as MapIcon, ShieldCheck, Mail } from 'lucide-react';

const libraries: any = ['drawing'];

const ViewStore = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [existingStores, setExistingStores] = useState<any[]>([]);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    useEffect(() => {
        if (id) {
            fetchStoreDetails();
        }
    }, [id]);

    const fetchStoreDetails = async () => {
        try {
            setLoading(true);
            
            // Fetch all stores for overlay and current store detail
            const [allStoresRes] = await Promise.all([
                callApi('/management/admin/stores?limit=100', 'GET')
            ]);

            if (allStoresRes?.data) {
                setExistingStores(allStoresRes.data.filter((s: any) => s.id !== id));
            }

            // Try plural for single store
            let response;
            try {
                response = await callApi(`/management/admin/stores/${id}`, 'GET');
            } catch (e: any) {
                if (e.message?.includes('404')) {
                    response = await callApi(`/management/admin/store/${id}`, 'GET');
                } else {
                    throw e;
                }
            }
            
            if (response && (response.data || response.id || response._id)) {
                setStore(response.data || response);
            } else {
                // Fallback to localStorage if API fails but we came from list
                const cachedData = localStorage.getItem(`edit_store_${id}`);
                if (cachedData) {
                    setStore(JSON.parse(cachedData));
                } else {
                    throw new Error('Store details not found');
                }
            }
        } catch (error) {
            console.error('Error fetching store details:', error);
            // Final fallback check
            const cachedData = localStorage.getItem(`edit_store_${id}`);
            if (cachedData) setStore(JSON.parse(cachedData));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <span className="animate-spin rounded-full border-4 border-primary border-l-transparent w-10 h-10 align-middle"></span>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="panel p-10 text-center">
                <h2 className="text-xl font-bold uppercase tracking-tight">Dark Store Not Found</h2>
                <Link href="/store/list" className="btn btn-primary mt-4 inline-block uppercase font-bold text-xs">Back to List</Link>
            </div>
        );
    }

    const coveragePath = store.coverage_polygon?.coordinates?.[0]?.map((coord: any) => ({
        lng: Number(coord[0]),
        lat: Number(coord[1]),
    })) || [];

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse items-center">
                <li><Link href="/" className="text-primary hover:underline font-bold text-xs uppercase">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/store/list" className="text-primary hover:underline font-bold text-xs uppercase">Store List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-xs uppercase text-gray-400"><span>View Store Detail</span></li>
            </ul>

            <div className="panel flex items-center justify-between shadow-sm border-none bg-white dark:bg-black/20 overflow-hidden">
                <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
                        <IconHome className="h-6 w-6" />
                    </div>
                    <div>
                        <h5 className="text-base font-black uppercase tracking-tight leading-none mb-1">{store.name}</h5>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-widest ${store.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                                {store.isActive ? 'Live' : 'Offline'}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: #{String(id).toUpperCase().slice(-8)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/store/edit/${id}`} className="btn btn-primary btn-sm uppercase font-black text-[10px] px-4 shadow-lg shadow-primary/20">
                        Edit Store
                    </Link>
                    <Link href="/store/list" className="btn btn-outline-primary btn-sm uppercase font-black text-[10px] px-4">
                        <IconArrowBackward className="h-4 w-4 mr-1.5" /> Back
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Map Panel */}
                    <div className="panel p-0 overflow-hidden shadow-sm border-none">
                        <div className="p-4 bg-gray-50/50 dark:bg-black/20 border-b flex items-center justify-between">
                            <h6 className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-500 flex items-center gap-2">
                                <MapIcon className="w-3.5 h-3.5" /> Service Coverage Area
                            </h6>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-tighter">
                                Delivery Range: {store.distance_threshold || 5000}m
                            </span>
                        </div>
                        <div className="h-[450px]">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ 
                                        lat: parseFloat(store.latitude) || 19.0760, 
                                        lng: parseFloat(store.longitude) || 72.8777 
                                    }}
                                    zoom={14}
                                    options={{
                                        styles: [
                                            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
                                        ]
                                    }}
                                >
                                    <Marker position={{ lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }} />
                                    {/* Neighboring Stores */}
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
                                    {/* Current Store */}
                                    {coveragePath.length > 0 && (
                                        <Polygon 
                                            path={coveragePath}
                                            options={{
                                                fillColor: '#3b82f6',
                                                fillOpacity: 0.15,
                                                strokeColor: '#3b82f6',
                                                strokeWeight: 2,
                                                strokeOpacity: 0.8,
                                            }}
                                        />
                                    )}
                                </GoogleMap>
                            ) : (
                                <div className="h-full bg-gray-100 flex items-center justify-center p-10">
                                    <AlertCircle className="w-10 h-10 text-gray-300" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Location Panel */}
                        <div className="panel shadow-sm border-none">
                            <h6 className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 mb-5 pb-2 border-b">Store Location</h6>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-primary border border-gray-100 dark:border-gray-800 shrink-0 shadow-sm">
                                        <IconMapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Address</label>
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed uppercase tracking-tight">{store.address}</p>
                                        <p className="text-[11px] font-black text-black dark:text-white mt-1 uppercase">{store.city}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Latitude</label>
                                        <p className="text-xs font-bold font-mono tracking-tighter">{store.latitude}</p>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Longitude</label>
                                        <p className="text-xs font-bold font-mono tracking-tighter">{store.longitude}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Contact Panel */}
                        <div className="panel shadow-sm border-none">
                            <h6 className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 mb-5 pb-2 border-b">Contact & Access</h6>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-primary border border-gray-100 dark:border-gray-800 shrink-0 shadow-sm">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Facility Email</label>
                                        <p className="text-xs font-bold text-primary hover:underline cursor-pointer">{store.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-primary border border-gray-100 dark:border-gray-800 shrink-0 shadow-sm">
                                        <IconPhone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Contact Number</label>
                                        <p className="text-xs font-bold">{store.contact_number || store.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Management Panel */}
                    <div className="panel shadow-sm border-none bg-primary/[0.02] dark:bg-primary/[0.05]">
                         <h6 className="text-[11px] font-black uppercase tracking-[0.1em] text-primary/60 mb-5 pb-2 border-b border-primary/10">Hierarchy & Leads</h6>
                         <div className="space-y-5">
                            <div className="group">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-2 group-hover:text-primary transition-colors">Dark Store Lead</label>
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-black/40 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm group-hover:border-primary/30 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                        <IconUser className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-black dark:text-white tracking-tight">{store.store_manager?.name || 'Unassigned Lead'}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Store Manager</p>
                                    </div>
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-2">Parent Infrastructure</label>
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-black/40 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm border-dashed">
                                     <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-black/60 flex items-center justify-center text-gray-400 border shrink-0">
                                        <IconHome className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-black dark:text-white tracking-tight">{store.warehouse?.name || 'Standalone Facility'}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Assigned Warehouse</p>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Operational Settings */}
                    <div className="panel shadow-sm border-none">
                         <h6 className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 mb-5 pb-2 border-b">Operating Status</h6>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Business Hours</span>
                                </div>
                                <span className="text-xs font-black">{store.open_time} - {store.close_time}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Service Delivery</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${store.is_service_available ? 'bg-success text-white' : 'bg-gray-400 text-white'}`}>
                                    {store.is_service_available ? 'Active' : 'Offline'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Payments (COD)</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${store.is_cod_enabled ? 'bg-primary text-white' : 'bg-gray-400 text-white'}`}>
                                    {store.is_cod_enabled ? 'Available' : 'Disabled'}
                                </span>
                            </div>
                         </div>

                         {store.priority_message && (
                            <div className="mt-6 p-4 rounded-2xl border-2 border-dashed flex flex-col items-center text-center group transition-all" style={{ borderColor: store.priority_message_color + '40', backgroundColor: store.priority_message_color + '05' }}>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Priority Feature</span>
                                <p className="text-sm font-black uppercase italic tracking-tight italic" style={{ color: store.priority_message_color }}>"{store.priority_message}"</p>
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewStore;
