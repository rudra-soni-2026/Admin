'use client';
import AdminForm from '@/components/users/admin-form';

const AddAccountantManager = () => {
    return (
        <AdminForm 
            role="accountant_manager" 
            title="Accountant Manager" 
            redirectPath="/accountant-managers/list" 
        />
    );
};

export default AddAccountantManager;
