
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';

// Local Styles
import './PatientFinancialSidebar.css';

/**
 * PatientFinancialSidebar (Executor).
 * Renders the sidebar for the patient details view, focusing on financial status and quick actions.
 */
const PatientFinancialSidebar = ({
    details,
    t,
    user,
    onPayDebt,
    onGenerateQR,
    onGeneratePrescriptionLink,
    onDelete
}) => {
    return (
        <aside className="patient-details__sidebar">
            {/* Sidebar Block 1: Financial Status */}
            <div className="patient-details__financial-card">
                <header className="patient-details__financial-header">
                    <h4 className="patient-details__financial-title">
                        {t('financial_history_debt')}
                    </h4>
                </header>
                <div className="patient-details__financial-content patient-details__financial-content--padded-xl">
                    <span className={`patient-details__financial-amount ${Number(details.total_debt) > 0 ? 'patient-details__financial-amount--debt' : 'patient-details__financial-amount--clear'}`}>
                        ${Number(details.total_debt).toFixed(2)}
                    </span>
                    {Number(details.total_debt) > 0 && (
                        <div className="config-flex config-flex--column config-flex--gap-1">
                            <Button
                                variant="primary"
                                className="patient-details__pay-debt-btn"
                                onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                icon={<Icon name="payments" size="1rem" />}
                            >
                                {t('pay_debt')}
                            </Button>
                            <Button
                                variant="whatsapp"
                                size="sm"
                                className="patient-details__remind-debt-btn"
                                icon={<Icon name="chat" size="1rem" />}
                                onClick={() => {
                                    const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                    if (!phone) return alert(t('no_phone_available'));
                                    const msg = `Hola ${details.full_name}, te escribimos de Cima Salud para informarte que figura un saldo pendiente de $${details.total_debt} en tu cuenta. ¿Podrías confirmarnos cuándo podrías regularizarlo? ¡Gracias!`;
                                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                            >
                                {t('remind_debt') || 'Recordar Deuda'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Block 2: Quick Tools */}
            <div className="details-block details-block--sidebar details-block--tools">
                <header className="details-block__header">
                    <h3 className="details-block__title">
                        <Icon name="settings" size="1rem" />
                        {t('tools')}
                    </h3>
                </header>
                <div className="details-block__content patient-details__tools-list">
                    <Button
                        variant="secondary"
                        className="patient-details__tool-btn"
                        onClick={() => onGenerateQR(details.id)}
                        icon={<Icon name="qr_code" size="1.1rem" />}
                    >
                        {t('generate_qr_access')}
                    </Button>
                    <Button
                        variant="secondary"
                        className="patient-details__tool-btn"
                        onClick={() => onGeneratePrescriptionLink(details.id)}
                        icon={<Icon name="description" size="1.1rem" />}
                    >
                        {t('request_prescription_link')}
                    </Button>

                    <Button
                        variant="accent"
                        className="patient-details__tool-btn"
                        onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                        icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                    >
                        {t('download_apk')}
                    </Button>

                    {(user?.role === 'admin' || user?.role === 'secretary') && (
                        <Button
                            variant="ghost"
                            className="patient-details__delete-btn"
                            onClick={() => onDelete(details)}
                            icon={<Icon name="delete" size="1rem" />}
                        >
                            {t('delete_patient')}
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default PatientFinancialSidebar;
