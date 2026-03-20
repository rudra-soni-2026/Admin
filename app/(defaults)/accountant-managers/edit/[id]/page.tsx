'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';
import { useParams } from 'next/navigation';

const EditAccountantManager = () => {
    const params = useParams();
    const id = params.id as string;

    return (
        <AdminForm 
            id={id}
            role="account_manager" 
            title="Accountant Manager" 
            redirectPath="/accountant-managers/list" 
        />
    );
};

export default EditAccountantManager;
