'use client';
import AddAdmin from '@/app/(defaults)/admins/add/page';

const AddProductManager = () => {
    return (
        <AddAdmin 
            role="product_manager" 
            title="Product Manager" 
            redirectPath="/product-managers/list" 
        />
    );
};

export default AddProductManager;
