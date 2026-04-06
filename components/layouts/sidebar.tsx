'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconMinus from '@/components/icon/icon-minus';
import IconMenuUsers from '@/components/icon/menu/icon-menu-users';
import IconShoppingBag from '@/components/icon/icon-shopping-bag';
import IconBox from '@/components/icon/icon-box';
import IconTag from '@/components/icon/icon-tag';
import IconListCheck from '@/components/icon/icon-list-check';
import IconTruck from '@/components/icon/icon-truck';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconSettings from '@/components/icon/icon-settings';
import { usePathname } from 'next/navigation';
import { getTranslation } from '@/i18n';
import IconUsers from '@/components/icon/icon-users';
import IconRefresh from '@/components/icon/icon-refresh';
import IconBell from '@/components/icon/icon-bell';
import IconAward from '@/components/icon/icon-award';

const Sidebar = () => {
    const dispatch = useDispatch();
    const { t } = getTranslation();
    const pathname = usePathname();
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const [permissions, setPermissions] = useState<any | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedPermissions = localStorage.getItem('permissions');
            const storedRole = localStorage.getItem('role');
            setRole(storedRole);
            if (storedPermissions) {
                try {
                    setPermissions(JSON.parse(storedPermissions));
                } catch (error) {
                    console.error('Failed to parse permissions:', error);
                    setPermissions([]);
                }
            } else {
                setPermissions([]);
            }
        }
    }, []);

    const hasPermission = (permission: string) => {
        // 1. Super Admin Level
        if (role === 'super_admin') return true;

        // 🚨 Role-based overrides (Ensure essential tabs are always visible for specific roles)
        if (role === 'store_manager') {
            // Sir, Store Manager ONLY sees Orders and Store Inventory as requested!
            const allowed = ['orders', 'store_inventory'];
            return allowed.includes(permission);
        }

        if (role === 'admin') {
            let getper = localStorage.getItem('permissions');
            let permissioncheck = ['orders', 'stores', 'warehouses', 'dashboard', 'users', 'riders', 'products', 'categories', 'inventory_transfer', 'store_inventory', 'warehouse_inventory'];
            if (getper) {
                const parsed = JSON.parse(getper);
                permissioncheck = Object.keys(parsed)
                console.log(Object.keys(parsed), "getper");
            }
            const allowed = permissioncheck//['orders', 'stores', 'warehouses', 'dashboard', 'users', 'riders', 'products', 'categories', 'inventory_transfer', 'store_inventory', 'warehouse_inventory'];
            if (allowed.includes(permission)) return true;
        }

        if (!permissions) return false;

        // 2. Intelligent Data Detection (Works for ALL roles: Admin, Product Manager, etc.)
        if (typeof permissions === 'object' && !Array.isArray(permissions)) {
            // Check specifically for 'read' access in our new CRUD matrix
            return (permissions as any)?.[permission]?.read === true;
        }

        // 3. Fallback for Legacy Array Data
        if (Array.isArray(permissions)) {
            return permissions.includes(permission);
        }

        return false;
    };

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => (oldValue === value ? '' : value));
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => ele.click());
                }
            }
        }
    }, []);

    useEffect(() => {
        setActiveRoute();
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [pathname]);

    const setActiveRoute = () => {
        let allLinks = document.querySelectorAll('.sidebar ul a.active');
        for (let i = 0; i < allLinks.length; i++) {
            const element = allLinks[i];
            element?.classList.remove('active');
        }
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        selector?.classList.add('active');
    };

    const getHomePath = () => {
        if (role === 'super_admin') return '/';
        if (hasPermission('dashboard')) return '/';
        if (hasPermission('users')) return '/users/list';
        if (hasPermission('admins')) return '/admins/list';
        if (hasPermission('stores')) return '/store/list';
        if (hasPermission('warehouses')) return '/warehouses/list';
        if (hasPermission('orders')) return '/orders/list';
        if (hasPermission('products')) return '/products/list';

        if (role === 'product_manager') return '/products/list';
        if (role === 'warehouse_manager') return '/warehouses/list';
        if (role === 'store_manager') return '/store/list';
        if (role === 'account_manager') return '/purchase/list';
        return '/';
    };

    const anyEmployeeShown = hasPermission('admins') || hasPermission('product_managers') || hasPermission('accountant_managers') || hasPermission('warehouse_managers') || hasPermission('store_managers') || hasPermission('riders');
    const anyPlaceShown = hasPermission('warehouses') || hasPermission('stores');
    const anyPromotionShown = hasPermission('notifications') || hasPermission('coupons') || hasPermission('product_ranking') || hasPermission('category_ranking');
    const anyInventoryShown = hasPermission('suppliers') || hasPermission('purchase') || hasPermission('warehouse_inventory') && role == "super_admin" || hasPermission('store_inventory')  && role == "super_admin" || hasPermission('inventory_transfer');
    const anyCatalogShown = hasPermission('products') || hasPermission('categories') || hasPermission('offers');

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[240px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
                <div className="h-full bg-white dark:bg-black">
                    <div className="flex items-center justify-center px-4 py-3 relative">
                        <Link href={getHomePath()} className="main-logo flex shrink-0 items-center">
                            <img className="inline w-20 flex-none" src="/assets/images/logo.png" alt="logo" />
                        </Link>
                        <button type="button" className="collapse-icon absolute right-1 flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10" onClick={() => dispatch(toggleSidebar())}>
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
                        <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
                            {hasPermission('dashboard') && (
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'dashboard' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('dashboard')}>
                                        <div className="flex items-center">
                                            <IconMenuDashboard className="shrink-0 group-hover:!text-primary" />
                                            <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t('dashboard')}</span>
                                        </div>
                                        <div className={currentMenu !== 'dashboard' ? '-rotate-90 rtl:rotate-90' : ''}><IconCaretDown /></div>
                                    </button>
                                    <AnimateHeight duration={300} height={currentMenu === 'dashboard' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li><Link href="/">{t('sales')}</Link></li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                            )}

                            {hasPermission('users') && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">{"Customer"}</span></h2>
                                    <li className="nav-item">
                                        <Link href="/users/list" className="group">
                                            <div className="flex items-center"><IconMenuUsers className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Customer</span></div>
                                        </Link>
                                    </li>
                                </>
                            )}

                            {anyEmployeeShown && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">{"Employee"}</span></h2>
                                    <li className="nav-item">
                                        <ul>
                                            {hasPermission('admins') && (<li className="nav-item"><Link href="/admins/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Admin</span></div></Link></li>)}
                                            {hasPermission('product_managers') && (<li className="nav-item"><Link href="/product-managers/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Product Manager</span></div></Link></li>)}
                                            {hasPermission('accountant_managers') && (<li className="nav-item"><Link href="/accountant-managers/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Accountant Manager</span></div></Link></li>)}
                                            {hasPermission('warehouse_managers') && (<li className="nav-item"><Link href="/warehouse-managers/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Warehouse Manager</span></div></Link></li>)}
                                            {hasPermission('store_managers') && (<li className="nav-item"><Link href="/store-managers/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Store Manager</span></div></Link></li>)}
                                            {hasPermission('riders') && (<li className="nav-item"><Link href="/riders/list" className="group"><div className="flex items-center"><IconTruck className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Rider</span></div></Link></li>)}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {anyPlaceShown && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Place</span></h2>
                                    <li className="nav-item">
                                        <ul>
                                            {hasPermission('warehouses') && (<li className="nav-item"><Link href="/warehouses/list" className="group"><div className="flex items-center"><IconBox className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Warehouse</span></div></Link></li>)}
                                            {hasPermission('stores') && (<li className="nav-item"><Link href="/store/list" className="group"><div className="flex items-center"><IconShoppingBag className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Store</span></div></Link></li>)}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {hasPermission('orders') && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Order Management</span></h2>
                                    <li className="nav-item"><Link href="/orders/list" className="group"><div className="flex items-center"><IconListCheck className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Orders</span></div></Link></li>
                                </>
                            )}

                            {anyPromotionShown && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Promotion & Ranking</span></h2>
                                    <li className="nav-item">
                                        <ul>
                                            {hasPermission('notifications') && (<li className="nav-item"><Link href="/notifications/list" className="group"><div className="flex items-center"><IconBell className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Notification</span></div></Link></li>)}
                                            {hasPermission('coupons') && (<li className="nav-item"><Link href="/coupons/list" className="group"><div className="flex items-center"><IconTag className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Coupon</span></div></Link></li>)}
                                            {hasPermission('product_ranking') && (<li className="nav-item"><Link href="/rankings/products" className="group"><div className="flex items-center"><IconAward className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Product Ranking</span></div></Link></li>)}
                                            {hasPermission('category_ranking') && (<li className="nav-item"><Link href="/rankings/categories" className="group"><div className="flex items-center"><IconTrendingUp className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Category Ranking</span></div></Link></li>)}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {anyCatalogShown && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Catalog</span></h2>
                                    <li className="nav-item">
                                        <ul>
                                            {hasPermission('products') && (<li className="nav-item"><Link href="/products/list" className="group"><div className="flex items-center"><IconBox className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Products</span></div></Link></li>)}
                                            {hasPermission('categories') && (<li className="nav-item"><Link href="/categories/list" className="group"><div className="flex items-center"><IconTag className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Categories</span></div></Link></li>)}
                                            {hasPermission('offers') && (<li className="nav-item"><Link href="/offers/list" className="group"><div className="flex items-center"><IconTrendingUp className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Offers</span></div></Link></li>)}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {anyInventoryShown && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Inventory & Purchase</span></h2>
                                    <li className="nav-item">
                                        <ul>
                                            {hasPermission('suppliers') && (<li className="nav-item"><Link href="/suppliers/list" className="group"><div className="flex items-center"><IconUsersGroup className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Suppliers</span></div></Link></li>)}
                                            {hasPermission('purchase') && (<li className="nav-item"><Link href="/purchase/list" className="group"><div className="flex items-center"><IconListCheck className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Purchase</span></div></Link></li>)}
                                            {hasPermission('warehouse_inventory') && role == "super_admin" && (<li className="nav-item"><Link href="/inventory/warehouse" className="group"><div className="flex items-center"><IconBox className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Warehouse Inventory</span></div></Link></li>)}
                                            {hasPermission('store_inventory') && role == "super_admin" && (<li className="nav-item"><Link href="/inventory/store" className="group"><div className="flex items-center"><IconShoppingBag className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Store Inventory</span></div></Link></li>)}
                                            {hasPermission('inventory_transfer') && (<li className="nav-item"><Link href="/inventory/transfer" className="group"><div className="flex items-center"><IconRefresh className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Inventory Transfer</span></div></Link></li>)}
                                            {(role === 'super_admin' || role === 'store_manager' || role === 'warehouse_manager') && (
                                                <li className="nav-item">
                                                    <Link href="/inventory/alerts-history" className="group text-danger">
                                                        <div className="flex items-center">
                                                            <IconBell className="shrink-0 group-hover:!text-danger" />
                                                            <span className="ltr:pl-3 rtl:pr-3 uppercase font-black text-[10px]">Stock Alerts Log</span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    </li>
                                </>
                            )}

                            {hasPermission('settings') && (
                                <>
                                    <h2 className="-mx-4 mb-0.5 flex items-center bg-white-light/30 px-6 py-2 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]"><span className="text-[11px] opacity-70">Settings</span></h2>
                                    <li className="nav-item"><Link href="/company/settings" className="group"><div className="flex items-center"><IconSettings className="shrink-0 group-hover:!text-primary" /><span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Company</span></div></Link></li>
                                </>
                            )}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
