import CompanySettingsForm from '@/components/company/company-settings-form';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
    title: 'Company Settings',
};

const CompanySettingsPage = () => {
    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li>
                    <Link href="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Company Settings</span>
                </li>
            </ul>
            <CompanySettingsForm />
        </div>
    );
};

export default CompanySettingsPage;
