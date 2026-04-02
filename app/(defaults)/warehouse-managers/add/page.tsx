'use client';
import AdminForm from '@/components/users/admin-form';

const AddWarehouseManager = () => {
    return (
        <AdminForm 
            role="warehouse_manager" 
            title="Warehouse Manager" 
            redirectPath="/warehouse-managers/list" 
        />
    );
};

export default AddWarehouseManager;

