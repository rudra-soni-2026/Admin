'use client';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toggleRTL, toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from '@/store/themeConfigSlice';
import Loading from '@/components/layouts/loading';
import { getTranslation } from '@/i18n';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { subscribeToOrders, unsubscribeFromOrders, initiateSocket, disconnectSocket, joinStore } from '@/utils/socket';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const { initLocale } = getTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const socketInitialized = useRef(false);

    // 🔐 Auth Check (Runs on navigation)
    useEffect(() => {
        const token = localStorage.getItem('AdminToken');
        const isAuthPage = pathname?.startsWith('/auth');
        if (!token && !isAuthPage) {
            router.push('/auth/boxed-signin');
        }
    }, [pathname, router]);

    useEffect(() => {
        const token = localStorage.getItem('AdminToken');
        const role = localStorage.getItem('role');
        const userDataString = localStorage.getItem('userData');
        
        let storeId = 'all';
        if ((role === 'store_manager' || role === 'warehouse_manager') && userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                storeId = userData.assignedId || userData.assigned_id || userData.storeId || userData.store_id || 'all';
            } catch (e) {}
        }

        if (token && !socketInitialized.current) {
            initiateSocket(storeId, role || 'admin');
            joinStore(storeId);

            // Pre-load audio
            if (!audioRef.current && typeof window !== 'undefined') {
                audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audioRef.current.load();

                // Unlock audio context on first user interaction
                const unlockAudio = () => {
                    if (audioRef.current) {
                        audioRef.current.play().then(() => {
                            audioRef.current?.pause();
                            if (audioRef.current) audioRef.current.currentTime = 0;
                            window.removeEventListener('click', unlockAudio);
                        }).catch(e => console.log('🔇 Unlock interaction failed:', e));
                    }
                };
                window.addEventListener('click', unlockAudio);
            }

            // Global Notification Listener
            const toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, showCloseButton: true,
                customClass: { popup: 'color-info border-info shadow-lg animate__animated animate__fadeInRight' },
            });

            subscribeToOrders((err, data) => {
                if (err) return;
                
                const orderInfo = data.order || data;
                const orderStoreId = orderInfo.storeId || orderInfo.store_id || orderInfo.warehouseId || orderInfo.warehouse_id;

                const isRelevant = storeId === 'all' || (orderStoreId && String(orderStoreId) === String(storeId));

                if (data.type === 'NEW_ORDER' || data.eventType === 'NEW_ORDER') {
                    if (isRelevant) {
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            audioRef.current.play().catch(e => {
                                setTimeout(() => { audioRef.current?.play().catch(() => { }); }, 500);
                            });
                        }
                        toast.fire({ icon: 'info', title: `🔔 New Order: ${orderInfo.order_id || 'ID N/A'}` });
                    }
                } else if (data.type === 'STATUS_CHANGE' || data.type === 'ORDER_STATUS_CHANGED') {
                    if (isRelevant) {
                        toast.fire({ icon: 'info', title: `📈 Status Updated: ${orderInfo.order_id || 'ID N/A'}` });
                    }
                }
            });

            socketInitialized.current = true;
        }
    }, [pathname]); 

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
        // locale
        initLocale(themeConfig.locale);

        setIsLoading(false);
    }, [dispatch, initLocale, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        <div
            className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                } main-section relative font-nunito text-sm font-normal antialiased`}
        >
            {isLoading ? <Loading /> : children}
        </div>
    );
}

export default App;
