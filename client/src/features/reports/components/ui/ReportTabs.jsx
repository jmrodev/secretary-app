import React from 'react';
import TabButton from '@/components/atoms/TabButton';
import TabNav from '@/components/molecules/TabNav';
import Icon from '@/components/atoms/Icon';
import styles from './ReportTabs.module.css';

const ReportTabs = ({ activeTab, onTabChange, t }) => {
    return (
        <TabNav className={`${styles.reportTabs}`}>
            <TabButton
                isActive={activeTab === 'appointments'}
                onClick={() => onTabChange('appointments')}
                icon={<Icon name="calendar_month" size="1.1rem" />}
            >
                {t('appointment_reports')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'prescriptions'}
                onClick={() => onTabChange('prescriptions')}
                icon={<Icon name="medication" size="1.1rem" />}
            >
                {t('prescription_reports')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'licenses'}
                onClick={() => onTabChange('licenses')}
                icon={<Icon name="badge" size="1.1rem" />}
            >
                {t('license_reports')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'certificates'}
                onClick={() => onTabChange('certificates')}
                icon={<Icon name="verified" size="1.1rem" />}
            >
                {t('certificate_reports')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'balance'}
                onClick={() => onTabChange('balance')}
                icon={<Icon name="analytics" size="1.1rem" />}
            >
                {t('balance_report')}
            </TabButton>
        </TabNav>
    );
};

export default ReportTabs;
