'use client';
import AddAdmin from '@/app/(defaults)/admins/add/page';

const AddWarehouseManager = () => {
    return (
        <AddAdmin 
            role="warehouse_manager" 
            title="Warehouse Manager" 
            redirectPath="/warehouse-managers/list" 
        />
    );
};

export default AddWarehouseManager;
