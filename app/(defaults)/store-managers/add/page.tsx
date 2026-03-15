'use client';
import AddAdmin from '@/app/(defaults)/admins/add/page';

const AddStoreManager = () => {
    return (
        <AddAdmin 
            role="store_manager" 
            title="Store Manager" 
            redirectPath="/store-managers/list" 
        />
    );
};

export default AddStoreManager;
