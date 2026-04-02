'use client';
import IconDollarSignCircle from '@/components/icon/icon-dollar-sign-circle';
import IconHome from '@/components/icon/icon-home';
import IconPhone from '@/components/icon/icon-phone';
import React, { useState, useEffect } from 'react';
import { callApi } from '@/utils/api';
import Swal from 'sweetalert2';

interface AccountSettingsTabsProps {
    userData?: any;
}

const ComponentsUsersAccountSettingsTabs = ({ userData }: AccountSettingsTabsProps) => {
    const [tabs, setTabs] = useState<string>('home');
    const [isBanned, setIsBanned] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (userData) {
            setIsBanned(userData.status === 'Inactive');
        }
    }, [userData]);

    const toggleTabs = (name: string) => {
        setTabs(name);
    };

    const handleBanToggle = async () => {
        if (!userData?.originalId) return;

        try {
            setLoading(true);
            const newBanStatus = !isBanned;
            const response = await callApi('/management/admin/ban-user', 'POST', {
                userId: userData.originalId,
                isBanned: newBanStatus ? 'true' : 'false'
            });

            if (response) {
                setIsBanned(newBanStatus);
                const toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    showCloseButton: true,
                    customClass: {
                        popup: newBanStatus ? 'color-danger' : 'color-success',
                    },
                });
                toast.fire({
                    icon: 'success',
                    title: `User ${newBanStatus ? 'Banned' : 'Unbanned'} successfully`,
                    padding: '10px 20px',
                });
            }
        } catch (error) {
            const toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                showCloseButton: true,
                customClass: {
                    popup: 'color-danger',
                },
            });
            toast.fire({
                icon: 'error',
                title: 'Operation failed! Please try again.',
                padding: '10px 20px',
            });
            console.error('Error toggling user status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {!userData && (
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="text-lg font-semibold dark:text-white-light">Settings</h5>
                </div>
            )}
            <div>
                <ul className="mb-5 overflow-y-auto whitespace-nowrap border-b border-[#ebedf2] font-semibold dark:border-[#191e3a] sm:flex">
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('home')}
                            className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'home' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconHome />
                            Home
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('payment-details')}
                            className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'payment-details' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconDollarSignCircle />
                            Payment Details
                        </button>
                    </li>
                    <li className="inline-block">
                        <button
                            onClick={() => toggleTabs('danger-zone')}
                            className={`flex gap-2 border-b border-transparent p-4 hover:border-primary hover:text-primary ${tabs === 'danger-zone' ? '!border-primary text-primary' : ''}`}
                        >
                            <IconPhone />
                            Danger Zone
                        </button>
                    </li>
                </ul>
            </div>
            {tabs === 'home' ? (
                <div>
                    <form className="mb-5 rounded-md border border-[#ebedf2] bg-white p-4 dark:border-[#191e3a] dark:bg-black">
                        <h6 className="mb-5 text-lg font-bold">General Information</h6>
                        <div className="flex flex-col sm:flex-row">
                            <div className="mb-5 w-full sm:w-2/12 ltr:sm:mr-4 rtl:sm:ml-4">
                                <img src={userData?.user?.image || "/assets/images/profile-34.jpeg"} alt="img" className="mx-auto h-20 w-20 rounded-full object-cover md:h-32 md:w-32" />
                            </div>
                            <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name">Full Name</label>
                                    <input id="name" type="text" defaultValue={userData?.user?.name || ""} placeholder="Full Name" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="phone">Phone</label>
                                    <input id="phone" type="text" defaultValue={userData?.phone || ""} placeholder="Phone Number" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <input id="email" type="email" defaultValue={userData?.email || ""} placeholder="Email Address" className="form-input" />
                                </div>
                                <div>
                                    <label htmlFor="profession">Profession</label>
                                    <input id="profession" type="text" defaultValue={userData?.profession || ""} placeholder="Profession" className="form-input" />
                                </div>
                                <div className="mt-3 sm:col-span-2">
                                    <button type="button" className="btn btn-primary">
                                        Update Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            ) : tabs === 'payment-details' ? (
                <div>
                    <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="mb-4 text-lg font-semibold">Billing Address</h5>
                                <p>
                                    Changes to your <span className="text-primary">Billing</span> information will take effect starting with scheduled payment.
                                </p>
                            </div>
                            <div className="mb-5">
                                <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                    <div className="flex items-start justify-between py-3">
                                        <h6 className="text-[15px] font-bold text-[#515365] dark:text-white-dark">
                                            Address #1
                                            <span className="mt-1 block text-xs font-normal text-white-dark dark:text-white-light">2249 Caynor Circle, New Brunswick, New Jersey</span>
                                        </h6>
                                        <button className="btn btn-dark btn-sm">Edit</button>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary">Add Address</button>
                        </div>
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="mb-4 text-lg font-semibold">Payment History</h5>
                                <p>Manage your <span className="text-primary">Payment Method</span> here.</p>
                            </div>
                            <div className="mb-5">
                                <div className="border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                    <div className="flex items-start justify-between py-3">
                                        <div className="flex-none ltr:mr-4 rtl:ml-4">
                                            <img src="/assets/images/card-mastercard.svg" alt="img" />
                                        </div>
                                        <h6 className="text-[15px] font-bold text-[#515365] dark:text-white-dark">
                                            Mastercard
                                            <span className="mt-1 block text-xs font-normal text-white-dark dark:text-white-light">XXXX XXXX XXXX 9704</span>
                                        </h6>
                                        <button className="btn btn-dark btn-sm">Edit</button>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary">Add Payment Method</button>
                        </div>
                    </div>
                </div>
            ) : tabs === 'danger-zone' ? (
                <div className="switch">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="panel space-y-5">
                            <h5 className="mb-4 text-lg font-semibold">Ban / Unban Account</h5>
                            <p>You can temporarily ban or unban this user account.</p>
                            <label className="relative h-6 w-12">
                                <input 
                                    type="checkbox" 
                                    className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0" 
                                    id="custom_switch_checkbox7"
                                    checked={isBanned}
                                    onChange={handleBanToggle}
                                    disabled={loading}
                                />
                                <span className={`block h-full rounded-full bg-[#ebedf2] before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all before:duration-300 peer-checked:bg-danger peer-checked:before:left-7 dark:bg-dark dark:before:bg-white-dark ${loading ? 'opacity-50' : ''}`}></span>
                            </label>
                        </div>
                        <div className="panel space-y-5">
                            <h5 className="mb-4 text-lg font-semibold text-danger">Delete Account</h5>
                            <p>Once you delete the account, there is no going back. Please be certain.</p>
                            <button className="btn btn-danger">Delete my account</button>
                        </div>
                    </div>
                </div>
            ) : (
                ''
            )}
        </div>
    );
};

export default ComponentsUsersAccountSettingsTabs;
