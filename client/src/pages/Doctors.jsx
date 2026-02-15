import React from 'react';
import { useDoctorsPageController } from '../controllers/useDoctorsPageController';
import MainLayout from '../components/templates/MainLayout';
import DoctorsManager from '../components/organisms/DoctorsManager';
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
