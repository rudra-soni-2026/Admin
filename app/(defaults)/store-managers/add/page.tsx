'use client';
import AdminForm from '@/components/users/admin-form';

const AddStoreManager = () => {
    return (
        <AdminForm 
            role="store_manager" 
            title="Store Manager" 
            redirectPath="/store-managers/list" 
        />
    );
};

export default AddStoreManager;

