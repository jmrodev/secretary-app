import React, { useState, useCallback } from 'react';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { Loading } from '@/components/atoms/Loading';
import { api } from '@/api/axios';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useFetch } from '@/hooks/useFetch';
import { DoctorEditModal } from '@/features/doctors/components/modals/DoctorEditModal';
import { buildDoctorInitialData } from '@/features/doctors/hooks/useDoctorsPageController';
import sharedStyles from '@/styles/shared.module.css';
import styles from './BillingSettings.module.css';

/**
 * BillingSettings Feature Component.
 * Handles AFIP (Argentine Tax Authority) global environment configuration,
 * server connection status verification, and doctor fiscal status matrix.
 */
export const BillingSettings = ({ user, settings = {}, updateSetting }) => {
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [status, setStatus] = useState(null);
    const [checking, setChecking] = useState(false);
    const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    // Fetch doctor collection for fiscal status overview
    const { data: docData, loading: doctorsLoading, refetch: fetchDoctors } = useFetch('/users/doctors', {
        initialData: { success: true, data: { doctors: [], totalCount: 0 } }
    });

    const doctors = React.useMemo(() => docData?.data?.doctors || docData?.doctors || [], [docData]);

    // Modal state for editing a doctor's fiscal configuration
    const [modalState, setModalState] = useState({
        isOpen: false,
        activeTab: 'fiscal',
        data: {},
        connected: false,
        loadingGoogle: false,
        loadingSchedule: false,
        schedule: []
    });

    /**
     * Checks current AFIP server accessibility and status
     */
    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/billing/status');
            setStatus(res.data);
            showMessage(t('afip_validated'), 'success');
        } catch (err) {
            console.error('AFIP connection validation failed:', err);
            setStatus({ error: err.response?.data?.error || t('afip_status_error') });
            showMessage(t('afip_connection_failed'), 'error');
        } finally {
            setChecking(false);
        }
    };

    /**
     * Opens DoctorEditModal focused on fiscal settings
     */
    const handleEditDoctorFiscal = (doc) => {
        const initialData = buildDoctorInitialData(doc);
        setModalState({
            isOpen: true,
            activeTab: 'fiscal',
            data: initialData,
            connected: false,
            loadingGoogle: false,
            loadingSchedule: false,
            schedule: []
        });
    };

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleFormDataChange = (newData) => {
        setModalState(prev => ({
            ...prev,
            data: typeof newData === 'function' ? newData(prev.data) : { ...prev.data, ...newData }
        }));
    };

    const handleSaveDoctor = async () => {
        const { data } = modalState;
        try {
            await api.put(`/users/doctors/${data.id}`, data);
            showMessage(t('doctor_updated'), 'success');
            setModalState(prev => ({ ...prev, isOpen: false }));
            window.dispatchEvent(new CustomEvent('doctors-updated'));
            fetchDoctors();
        } catch (err) {
            console.error('Failed to update doctor fiscal config', err);
            showMessage(err.response?.data?.message || t('error_update'), 'error');
        }
    };

    const handleEnvironmentChange = useCallback((e) => {
        const value = e.target.value;
        updateSetting('afip_environment', value);
        showMessage(t('environment_updated_success'), 'success');
    }, [updateSetting, showMessage, t]);

    return (
        <div className={`${sharedStyles.TabPanel} ${sharedStyles.AnimateFadeIn}`}>
            {/* Doctor Fiscal Status Matrix */}

            <div className={styles.BillingSettings__actionsRow}>
                <Button
                    variant="secondary"
                    onClick={async () => {
                        await checkStatus();
                        setShowDiagnosticModal(true);
                    }}
                    loading={checking}
                    icon={<Icon name="sync" />}
                >
                    {t('verify_afip_connection')}
                </Button>
            </div>

            <div className={sharedStyles.ConfigSection}>
                <div className={sharedStyles.ConfigSection__header}>
                    <span className={sharedStyles.ConfigSection__icon}><Icon name="badge" /></span>
                    <div className={sharedStyles.ConfigSection__text}>
                        <h4 className={sharedStyles.ConfigSection__title}>{t('doctor_fiscal_status_title')}</h4>
                        <p className={styles.BillingSettings__hint}>{t('doctor_fiscal_status_desc')}</p>
                    </div>
                </div>

                <div className={sharedStyles.ConfigSection__body}>
                    {doctorsLoading ? (
                        <Loading variant="centered" text={t('loading_doctors')} />
                    ) : doctors.length === 0 ? (
                        <div className={styles.BillingSettings__emptyState}>
                            <p>{t('no_doctors_registered')}</p>
                        </div>
                    ) : (
                        <div className={styles.BillingSettings__tableWrapper}>
                            <table className={styles.BillingSettings__table}>
                                <thead>
                                    <tr>
                                        <th className={styles.BillingSettings__th}>{t('doctor_fiscal_th_doctor')}</th>
                                        <th className={styles.BillingSettings__th}>{t('doctor_fiscal_th_cuit')}</th>
                                        <th className={styles.BillingSettings__th}>{t('doctor_fiscal_th_pto_vta')}</th>
                                        <th className={styles.BillingSettings__th}>{t('doctor_fiscal_th_cert')}</th>
                                        <th className={styles.BillingSettings__th}>{t('doctor_fiscal_th_status')}</th>
                                        <th className={`${styles.BillingSettings__th} ${styles['BillingSettings__th--right']}`}>{t('doctor_fiscal_th_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.map((doc) => {
                                        const hasCuit = Boolean(doc.afip_cuit && String(doc.afip_cuit).trim().length > 0);
                                        const hasPtoVta = Boolean(doc.afip_pto_vta);
                                        const hasCert = Boolean(doc.afipCrt || doc.afip_crt || doc.has_certificate);
                                        const isReady = hasCuit && hasPtoVta && hasCert;

                                        return (
                                            <tr key={doc.id} className={styles.BillingSettings__tr}>
                                                <td className={styles.BillingSettings__td}>
                                                    <div className={styles.BillingSettings__doctorCell}>
                                                        <span className={styles.BillingSettings__doctorName}>{doc.full_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || doc.username}</span>
                                                        <span className={styles.BillingSettings__doctorSpecialty}>{doc.specialty || t('no_specialty')}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.BillingSettings__td}>
                                                    {hasCuit ? (
                                                        <Badge variant="blue">{doc.afip_cuit}</Badge>
                                                    ) : (
                                                        <Badge variant="warning">{t('fiscal_cuit_missing')}</Badge>
                                                    )}
                                                </td>
                                                <td className={styles.BillingSettings__td}>
                                                    {hasPtoVta ? (
                                                        <Badge variant="default">#{doc.afip_pto_vta}</Badge>
                                                    ) : (
                                                        <Badge variant="warning">{t('fiscal_pto_vta_missing')}</Badge>
                                                    )}
                                                </td>
                                                <td className={styles.BillingSettings__td}>
                                                    {hasCert ? (
                                                        <Badge variant="success">{t('fiscal_cert_configured')}</Badge>
                                                    ) : (
                                                        <Badge variant="danger">{t('fiscal_cert_missing')}</Badge>
                                                    )}
                                                </td>
                                                <td className={styles.BillingSettings__td}>
                                                    {isReady ? (
                                                        <Badge variant="success">{t('fiscal_status_ready')}</Badge>
                                                    ) : (
                                                        <Badge variant="warning">{t('fiscal_status_incomplete')}</Badge>
                                                    )}
                                                </td>
                                                <td className={`${styles.BillingSettings__td} ${styles['BillingSettings__td--right']}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditDoctorFiscal(doc)}
                                                        icon={<Icon name="edit" size="1rem" />}
                                                        title={t('edit_fiscal_config')}
                                                    >
                                                        {t('view_action')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Doctor Edit Modal hooked directly for fiscal editing */}
            {modalState.isOpen && (
                <DoctorEditModal
                    isOpen={modalState.isOpen}
                    type="EDIT"
                    activeTab={modalState.activeTab}
                    onClose={handleCloseModal}
                    onTabChange={(tab) => setModalState(prev => ({ ...prev, activeTab: tab }))}
                    data={modalState.data}
                    settings={settings}
                    onChangeData={handleFormDataChange}
                    onSave={handleSaveDoctor}
                    t={t}
                />
            )}
            {showDiagnosticModal && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setShowDiagnosticModal(false)} 
                    title={t('arca_diagnostic_title')}
                >
                    <div className={styles.BillingSettings__formColumn}>
                        <p>{t('arca_diagnostic_desc')}</p>
                        {status?.error && (
                            <div className={styles.BillingSettings__errorBox}>
                                <strong>{t('afip_status_error')}:</strong> {status.error}
                            </div>
                        )}
                        <div className={styles.BillingSettings__tariffBox}>
                            <p><strong>{t('afip_status_app')}:</strong> {status?.data?.afip_status?.AppServer || t('unknown')}</p>
                            <p><strong>{t('afip_status_db')}:</strong> {status?.data?.afip_status?.DbServer || t('unknown')}</p>
                            <p><strong>{t('afip_status_auth')}:</strong> {status?.data?.afip_status?.AuthServer || t('unknown')}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};


