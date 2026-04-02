import RiderForm from '@/components/users/rider-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Add New Rider',
};

const AddRider = () => {
    return (
        <div className="animate__animated animate__fadeIn">
            <RiderForm />
        </div>
    );
};

export default AddRider;
