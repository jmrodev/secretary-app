
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';

// Local Styles
import styles from './PatientFinancialSidebar.module.css';

/**
 * PatientFinancialSidebar (Executor).
 * Renders the sidebar for the patient details view, focusing on financial status and quick actions.
 */
const PatientFinancialSidebar = ({
    details,
    t,
    user: _user,
    onPayDebt,
    onGenerateQR: _onGenerateQR,
    onGeneratePrescriptionLink: _onGeneratePrescriptionLink,
    onDelete: _onDelete
}) => {
    return (
        <aside className={`${styles.sidebar}`}>
            {/* Sidebar Block 1: Financial Status */}
            <div className={`${styles.financialCard}`}>
                <header className={`${styles.financialHeader}`}>
                    <h4 className={`${styles.financialTitle}`}>
                        {t('financial_history_debt') || 'HISTORIAL FINANCIERO Y DEUDA'}
                    </h4>
                </header>
                <div className={`${styles.financialContent} ${styles.financialContentPaddedXl}`}>
                    <span className={`${styles.financialAmount} ${Number(details.total_debt) > 0 ? styles.financialAmountDebt : styles.financialAmountClear}`}>
                        ${Number(details.total_debt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {Number(details.total_debt) > 0 && (
                        <div className="config-flex config-flex--column config-flex--gap-1">
                            <Button
                                variant="primary"
                                className={`${styles.payDebtBtn}`}
                                onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                icon={<Icon name="payments" size="1.2rem" />}
                            >
                                {t('pay_debt') || 'Pagar Deuda'}
                            </Button>
                            <Button
                                variant="whatsapp"
                                size="sm"
                                className={`${styles.remindDebtBtn}`}
                                icon={<Icon name="chat" size="1.1rem" />}
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
        </aside>
    );
};



export default PatientFinancialSidebar;
