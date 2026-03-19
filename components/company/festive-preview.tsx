'use client';
import React from 'react';
import { CompanySettings } from '@/types/company';
import IconGallery from '@/components/icon/icon-gallery';

interface FestivePreviewProps {
    settings: Partial<CompanySettings>;
}

const FestivePreview = ({ settings }: FestivePreviewProps) => {
    const festive = settings.festive_sale || { is_active: false, title: '', banner_url: '', accent_color: '#ffffff' };
    
    // PRIORITY: 
    // 1. Festive specific tabs
    // 2. Main App Navigation tabs (header_tabs_config)
    // 3. Defaults
    let previewTabs = festive.tabs && festive.tabs.length > 0 ? festive.tabs : (settings.header_tabs_config || []);
    
    if (previewTabs.length === 0) {
        previewTabs = [
            { id: '1', name: 'All', icon: 'Home', color: '#ffffff' },
            { id: '2', name: 'Kids', icon: 'Baby', color: '#ffffff' },
            { id: '3', name: 'Beauty', icon: 'Sparkles', color: '#ffffff' },
            { id: '4', name: 'Electronics', icon: 'Headphones', color: '#ffffff' },
            { id: '5', name: 'Fashion', icon: 'Shirt', color: '#ffffff' }
        ];
    }

    return (
        <div className="space-y-6 animate__animated animate__fadeIn">
            <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary text-center">In-App Live Preview</h6>
            
            {/* Mobile Frame - Realistic Dark Theme */}
            <div className="rounded-[40px] overflow-hidden border-[10px] border-[#181a1d] bg-[#121212] shadow-2xl max-w-[340px] mx-auto min-h-[550px] relative font-sans text-white border-t-[30px] border-b-[30px]">
                
                {/* Status Bar */}
                <div className="absolute top-[-22px] left-0 w-full flex justify-between px-6 text-[8px] font-bold text-gray-500">
                    <span>10:40</span>
                    <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <div className="w-5 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                </div>

                {/* Navigation Row - Dynamic from Settings */}
                <div className="pt-4 pb-0 px-4 bg-[#121212] border-b border-white/5">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                        {previewTabs.map((tab: any, idx: number) => (
                            <div key={tab.id || idx} className="flex flex-col items-center gap-1.5 flex-none min-w-[55px] group cursor-pointer">
                                <TabIcon name={tab.icon} className={`w-6 h-6 ${idx === 0 ? 'text-white' : 'text-gray-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-tighter truncate w-full text-center ${idx === 0 ? 'text-white' : 'text-gray-500'}`}>{tab.name || 'Category'}</span>
                                {idx === 0 && <div className="h-[3px] w-full bg-black rounded-full mt-0.5"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Scroll Area */}
                <div className="p-4 space-y-5 bg-gradient-to-b from-[#121212] via-[#2a2d31] to-[#121212]">
                    
                    {/* Festive Branding Section */}
                    <div className="relative py-4 flex flex-col items-center">
                        {/* Cloud & Sun Decorations */}
                        <div className="absolute top-0 flex gap-4 opacity-50">
                            <span className="text-xl">☁️</span>
                            <span className="text-xl">☀️</span>
                            <span className="text-xl">☁️</span>
                        </div>
                        
                        <div className="flex items-center justify-between w-full px-2 mt-4">
                            <img src="https://cdn-icons-png.flaticon.com/512/3551/3551529.png" className="w-10 h-10 object-contain" alt="" />
                            <div className="text-center">
                                <h2 
                                    className="text-[20px] font-bold uppercase tracking-tighter leading-none"
                                    style={{ color: festive.accent_color || '#ffffff', fontFamily: 'serif' }}
                                >
                                    {festive.title || 'RAMADA OFIFFER'}
                                </h2>
                                <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Now Comes The Special Selection</p>
                            </div>
                            <img src="https://cdn-icons-png.flaticon.com/512/3551/3551529.png" className="w-10 h-10 object-contain" alt="" />
                        </div>
                    </div>

                    {/* Product Cards Grid - Exact Replication */}
                    <div className="grid grid-cols-5 gap-3">
                        {/* Large Left Card */}
                        <div className="col-span-2 bg-gradient-to-b from-[#2d3035] to-[#1e2024] p-3 rounded-[28px] border border-white/5 flex flex-col items-center text-center shadow-xl">
                            <h4 className="text-[11px] font-bold text-gray-300">New Arrivals</h4>
                            <p className="text-[9px] text-gray-500 mb-2">Best Picks</p>
                            
                            <div className="flex flex-col gap-1 w-full items-center mb-3">
                                <span className="text-[10px] text-gray-400 line-through bg-black/30 px-2 py-0.5 rounded-md">₹599</span>
                                <span className="text-[14px] font-black text-black bg-[#facc15] px-3 py-1 rounded-lg w-full">₹179</span>
                            </div>
                            
                            <div className="mt-auto">
                                <img src="https://m.media-amazon.com/images/I/71Zp+N9P1TL._AC_UF1000,1000_QL80_.jpg" className="w-full h-24 object-contain scale-110" alt="" />
                            </div>
                        </div>

                        {/* Right Grid Column */}
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                            {/* Sehri Card */}
                            <div className="col-span-1 bg-gradient-to-br from-[#2d3035] to-[#1e2024] p-2 rounded-[24px] border border-white/5 flex flex-col items-center text-center">
                                <h4 className="text-[9px] font-bold text-gray-400 leading-tight">Flash Sale</h4>
                                <img src="https://media.istockphoto.com/id/1149208031/photo/dates-fruit-in-a-wooden-bowl-on-white-background-dates-fruit-is-a-typical-fast-breaking-food.jpg?s=612x612&w=0&k=20&c=6fX0XNoK-xayN9qg0F94Y09kAgXm_7Xv3Z6uW1Q2h_c=" className="h-14 object-contain mt-2" alt="" />
                            </div>
                            
                            <div className="col-span-1 bg-gradient-to-br from-[#2d3035] to-[#1e2024] p-2 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center">
                                <h4 className="text-[9px] font-bold text-gray-400">Gifts</h4>
                            </div>

                            <div className="col-span-1 bg-gradient-to-br from-[#2d3035] to-[#1e2024] p-2 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center aspect-square">
                                <h4 className="text-[9px] font-bold text-gray-400">Home</h4>
                            </div>

                            <div className="col-span-1 bg-gradient-to-br from-[#2d3035] to-[#1e2024] p-2 rounded-[24px] border border-white/5 flex flex-col items-center justify-center text-center aspect-square">
                                <h4 className="text-[9px] font-bold text-gray-400">More</h4>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Banners Showcase Preview */}
                    {(settings.secondary_banners || []).map((section: any, sIdx: number) => (
                        <div key={sIdx} className="space-y-4 pt-4 border-t border-white/5 mt-4 first:border-0 first:mt-0">
                            <div className="flex items-center justify-between px-4">
                                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase drop-shadow-sm">{section.title || `Showcase ${sIdx + 1}`}</h2>
                                {section.banners && section.banners.length > 3 && (
                                    <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">View All</button>
                                )}
                            </div>
                            
                            <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                                {(!section.banners || section.banners.length === 0) ? (
                                    <div className="w-full h-32 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50/50 dark:bg-black/20 italic">
                                        <IconGallery className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Showcase Empty</span>
                                    </div>
                                ) : (
                                    section.banners.map((banner: any, bIdx: number) => (
                                        <div key={bIdx} className="w-[180px] flex-none group">
                                            <div className="aspect-[16/8] rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 shadow-xl shadow-black/5 border-2 border-transparent group-hover:border-primary/30 transition-all duration-500 relative ring-4 ring-white/50 dark:ring-black/20">
                                                {banner.image ? (
                                                    <img src={banner.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-black/20 italic text-[10px] font-bold text-gray-300">
                                                        Placeholder
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar Simulation */}
                <div className="absolute bottom-[-22px] left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full"></div>
            </div>
        </div>
    );
};

const TabIcon = ({ name, className }: { name: string, className: string }) => {
    switch (name) {
        case 'Home': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
        case 'Headphones': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
        case 'Sparkles': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
        case 'Baby': return <span className="text-xl">👶</span>;
        case 'Shirt': return <span className="text-xl">👕</span>;
        default: return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>;
    }
};

const MosqueIcon = ({ className, mirrored }: { className: string, mirrored?: boolean }) => (
    <svg className={`${className} ${mirrored ? '-scale-x-100' : ''}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 7v13l8 2 8-2V7l-8-5z" />
    </svg>
);

export default FestivePreview;
