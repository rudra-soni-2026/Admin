'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';
import { useParams } from 'next/navigation';

const EditAdmin = () => {
    const params = useParams();
    const id = params.id as string;

    return (
        <AdminForm 
            id={id}
            role="admin" 
            title="Admin" 
            redirectPath="/admins/list" 
        />
    );
};

export default EditAdmin;
