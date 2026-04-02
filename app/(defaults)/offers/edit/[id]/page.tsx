'use client';
import React from 'react';
import OfferForm from '@/components/offers/offer-form';
import { useParams } from 'next/navigation';

const EditOffer = () => {
    const params = useParams();
    const id = params?.id as string;

    return (
        <OfferForm id={id} title="Edit Offer" />
    );
};

export default EditOffer;
