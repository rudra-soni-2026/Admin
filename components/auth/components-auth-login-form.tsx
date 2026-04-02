'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { callApi } from '@/utils/api';

const ComponentsAuthLoginForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState('admin@kuiklo.com');
    const [password, setPassword] = useState('12345678');

    const submitForm = async (e: any) => {
        e.preventDefault();
        try {
            const response = await callApi('/auth/admin/login', 'POST', {
                email: email,
                password: password,
            });

            if (response.data && response.data.token) {
                localStorage.setItem('AdminToken', response.data.token);
                if (response.data.permissions) {
                    localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
                }
                if (response.data.role) {
                    localStorage.setItem('role', response.data.role);
                }
                localStorage.setItem('userData', JSON.stringify(response.data));

                const role = response.data.role;
                if (role === 'super_admin' || role === 'admin') {
                    router.push('/');
                } else if (role === 'product_manager') {
                    router.push('/products/list');
                } else if (role === 'warehouse_manager') {
                    router.push('/warehouses/list');
                } else if (role === 'store_manager') {
                    router.push('/orders/list');
                } else if (role === 'account_manager') {
                    router.push('/purchase/list');
                } else {
                    router.push('/');
                }
            } else {
                // If token is directly in response or under a different key, adjust here
                const token = response.token || response.accessToken || response.data?.accessToken;
                const permissions = response.data?.permissions || response.permissions;
                const role = response.data?.role || response.role;
                if (token) {
                    localStorage.setItem('AdminToken', token);
                    if (permissions) {
                        localStorage.setItem('permissions', JSON.stringify(permissions));
                    }
                    if (role) {
                        localStorage.setItem('role', role);
                    }
                    localStorage.setItem('userData', JSON.stringify(response.data || response));

                    // Redirect based on role
                    if (role === 'super_admin' || role === 'admin') {
                        router.push('/');
                    } else if (role === 'product_manager') {
                        router.push('/products/list');
                    } else if (role === 'warehouse_manager') {
                        router.push('/warehouses/list');
                    } else if (role === 'store_manager') {
                        router.push('/orders/list');
                    } else if (role === 'account_manager') {
                        router.push('/purchase/list');
                    } else {
                        router.push('/');
                    }
                } else {
                    alert('Token not found in response');
                }
            }
        } catch (error: any) {
            alert(error.message || 'Login failed');
        }
    };

    return (
        <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
            <div>
                <label htmlFor="Email">Email</label>
                <div className="relative text-white-dark">
                    <input
                        id="Email"
                        type="email"
                        placeholder="Enter Email"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconMail fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label htmlFor="Password">Password</label>
                <div className="relative text-white-dark">
                    <input
                        id="Password"
                        type="password"
                        placeholder="Enter Password"
                        className="form-input ps-10 placeholder:text-white-dark"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="absolute start-4 top-1/2 -translate-y-1/2">
                        <IconLockDots fill={true} />
                    </span>
                </div>
            </div>
            <div>
                <label className="flex cursor-pointer items-center">
                    <input type="checkbox" className="form-checkbox bg-white dark:bg-black" />
                    <span className="text-white-dark">Subscribe to weekly newsletter</span>
                </label>
            </div>
            <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                Sign in
            </button>
        </form>
    );
};

export default ComponentsAuthLoginForm;
