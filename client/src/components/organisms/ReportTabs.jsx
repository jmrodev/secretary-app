import React from 'react';
import TabButton from '../atoms/TabButton';
import TabNav from '../molecules/TabNav';
import Icon from '../atoms/Icon';

const ReportTabs = ({ activeTab, onTabChange, t }) => {
    return (
        <TabNav className="mb-6">
            <TabButton
                isActive={activeTab === 'appointments'}
                onClick={() => onTabChange('appointments')}
            >
                <Icon name="APPOINTMENTS" className="mr-2" size="1.2rem" />
                {t('appointment_reports') || 'Reporte de Turnos'}
            </TabButton>
            <TabButton
                isActive={activeTab === 'prescriptions'}
                onClick={() => onTabChange('prescriptions')}
            >
                <Icon name="PRESCRIPTION" className="mr-2" size="1.2rem" />
                {t('prescription_reports') || 'Reporte de Recetas'}
            </TabButton>
            <TabButton
                isActive={activeTab === 'licenses'}
                onClick={() => onTabChange('licenses')}
            >
                <Icon name="DOCUMENTS" className="mr-2" size="1.2rem" />
                {t('license_reports') || 'Reporte de Licencias'}
            </TabButton>
            <TabButton
                isActive={activeTab === 'certificates'}
                onClick={() => onTabChange('certificates')}
            >
                <Icon name="LICENSE" className="mr-2" size="1.2rem" />
                {t('certificate_reports') || 'Reporte de Certificados'}
            </TabButton>
            <TabButton
                isActive={activeTab === 'balance'}
                onClick={() => onTabChange('balance')}
            >
                <Icon name="STATS" className="mr-2" size="1.2rem" />
                {t('balance_report') || 'Balance General'}
            </TabButton>
        </TabNav>
    );
};

export default ReportTabs;
