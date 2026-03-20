'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

const AdminPermissions = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    return (
        <div>
            <ul className="mb-4 flex space-x-2 rtl:space-x-reverse">
                <li><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <Link href="/admins/list" className="text-primary hover:underline">Admin List</Link>
                </li>
                <li className="text-gray-500 before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>Admin Permissions</span></li>
            </ul>

            <div className="panel flex items-center justify-between mb-4 shadow-sm">
                <h5 className="text-base font-bold dark:text-white-light uppercase tracking-tight">Edit Admin Permissions: #{id.substring(0, 8)}</h5>
                <Link href="/admins/list" className="btn btn-outline-primary gap-2 btn-sm uppercase font-bold text-[10px]">
                    <IconArrowBackward className="h-4 w-4" />
                    Back to List
                </Link>
            </div>

            <div className="panel shadow-sm border-none min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <h5 className="text-lg font-bold mb-2">Permission Management Coming Soon</h5>
                    <p className="text-gray-500 mb-6">This feature is currently being developed to allow granular control over admin actions.</p>
                    <button className="btn btn-primary btn-sm uppercase font-bold" onClick={() => router.back()}>Go Back</button>
                </div>
            </div>
        </div>
    );
};

export default AdminPermissions;
