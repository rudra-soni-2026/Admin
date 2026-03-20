'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';
import { useParams } from 'next/navigation';

const EditStoreManager = () => {
    const params = useParams();
    const id = params.id as string;

    return (
        <AdminForm 
            id={id}
            role="store_manager" 
            title="Store Manager" 
            redirectPath="/store-managers/list" 
        />
    );
};

export default EditStoreManager;
