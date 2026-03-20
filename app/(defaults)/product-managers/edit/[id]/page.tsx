'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';
import { useParams } from 'next/navigation';

const EditProductManager = () => {
    const params = useParams();
    const id = params.id as string;

    return (
        <AdminForm 
            id={id}
            role="product_manager" 
            title="Product Manager" 
            redirectPath="/product-managers/list" 
        />
    );
};

export default EditProductManager;
