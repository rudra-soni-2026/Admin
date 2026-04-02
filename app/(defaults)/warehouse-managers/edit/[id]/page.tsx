'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';
import { useParams } from 'next/navigation';

const EditWarehouseManager = () => {
    const params = useParams();
    const id = params.id as string;

    return (
        <AdminForm 
            id={id}
            role="warehouse_manager" 
            title="Warehouse Manager" 
            redirectPath="/warehouse-managers/list" 
        />
    );
};

export default EditWarehouseManager;
