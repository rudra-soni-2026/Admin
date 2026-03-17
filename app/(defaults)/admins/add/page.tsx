'use client';
import React from 'react';
import AdminForm from '@/components/users/admin-form';

const AddAdmin = () => {
    return (
        <AdminForm 
            role="admin" 
            title="Admin" 
            redirectPath="/admins/list" 
        />
    );
};

export default AddAdmin;

