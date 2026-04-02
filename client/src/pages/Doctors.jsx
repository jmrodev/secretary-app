import React from 'react';
import { useDoctorsPageController, DoctorsManager } from '../features/doctors';
import MainLayout from '../components/templates/MainLayout';
import './Doctors.css';

const Doctors = () => {
    const controller = useDoctorsPageController();

    return (
        <MainLayout wide>
            <DoctorsManager {...controller} />
        </MainLayout>
    );
};

export default Doctors;
