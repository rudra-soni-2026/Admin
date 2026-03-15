'use client';
import AddAdmin from '@/app/(defaults)/admins/add/page';

const AddAccountantManager = () => {
    return (
        <AddAdmin 
            role="account_manager" 
            title="Accountant Manager" 
            redirectPath="/accountant-managers/list" 
        />
    );
};

export default AddAccountantManager;
