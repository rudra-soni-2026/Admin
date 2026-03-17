'use client';
import AdminForm from '@/components/users/admin-form';

const AddProductManager = () => {
    return (
        <AdminForm 
            role="product_manager" 
            title="Product Manager" 
            redirectPath="/product-managers/list" 
        />
    );
};

export default AddProductManager;

