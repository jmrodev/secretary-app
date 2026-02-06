
import React from 'react';
import TabButton from '../atoms/TabButton';

const ReportTabs = ({ activeTab, onTabChange, t }) => {
    return (
        <nav className="report-tabs nav-tabs">
            <div className="nav-tabs__container">
                <TabButton
                    isActive={activeTab === 'appointments'}
                    onClick={() => onTabChange('appointments')}
                    variant="pill"
                >
                    📅 {t('appointment_reports') || 'Reporte de Turnos'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'prescriptions'}
                    onClick={() => onTabChange('prescriptions')}
                    variant="pill"
                >
                    💊 {t('prescription_reports') || 'Reporte de Recetas'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'licenses'}
                    onClick={() => onTabChange('licenses')}
                    variant="pill"
                >
                    📋 {t('license_reports') || 'Reporte de Licencias'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'certificates'}
                    onClick={() => onTabChange('certificates')}
                    variant="pill"
                >
                    📄 {t('certificate_reports') || 'Reporte de Certificados'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'balance'}
                    onClick={() => onTabChange('balance')}
                    variant="pill"
                >
                    ⚖️ {t('balance_report') || 'Balance General'}
                </TabButton>
            </div>
        </nav>
    );
};

export default ReportTabs;
