import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import styles from './PatientFinancialSidebar.module.css';
import { useMessage } from '@/context/MessageContext';

/**
 * PatientFinancialSidebar (Executor).
 * Renders the full patient financial ledger, including appointments, prescription requests,
 * total paid contribution, current debt, and line-by-line transaction breakdown.
 */
export const PatientFinancialSidebar = ({
    details,
    allPrescriptions = [],
    t,
    user: _user,
    onPayDebt,
    onGenerateQR: _onGenerateQR,
    onGeneratePrescriptionLink: _onGeneratePrescriptionLink,
    onDelete: _onDelete
}) => {
    const { showMessage } = useMessage();
    const getMethodName = (pm) => {
        if (!pm || pm === '—') return '';
        const key = String(pm).toLowerCase();
        if (key === 'cash') return t('cash');
        if (key === 'transfer') return t('transfer');
        if (key === 'mercadopago') return 'MercadoPago';
        if (key === 'credit') return t('credit');
        if (key === 'debit') return t('debit');
        return pm;
    };

    // Compile Appointments Financial Items
    const apptItems = (details.appointments || []).map(a => {
        const isPaid = a.is_paid === 1 || a.payment_status === 'paid';
        const isBonified = a.bonified === 1;
        const cost = Number(a.cost || a.price || 0);
        const paid = isPaid ? cost : Number(a.amount_paid || a.paid_amount || 0);
        const pending = (isPaid || isBonified) ? 0 : Math.max(0, cost - paid);
        return {
            id: `appt-${a.id}`,
            rawId: a.id,
            date: a.appointment_date,
            typeCategory: 'turno',
            typeLabel: t('appointment'),
            concept: `Turno Médico (${a.reason || 'Consulta'})`,
            doctor: a.doctor_name || '—',
            cost,
            paid,
            pending,
            status: isBonified ? 'bonified' : (isPaid ? 'paid' : (pending > 0 ? 'pending' : 'paid')),
            payment_method: getMethodName(a.payment_method)
        };
    });

    // Compile Medical Requests Financial Items
    const reqItems = (allPrescriptions.length > 0 ? allPrescriptions : (details.requests || [])).map(r => {
        const isPaid = r.payment_status === 'paid';
        const isBonified = r.bonified === 1 || r.is_bonified === 1;
        const pending = isBonified ? 0 : Number(r.debt_amount || 0);
        const cost = Number(r.cost || r.price || 0) || (isPaid ? 0 : pending);
        const paid = isPaid ? cost : 0;
        const reqConcept = r.type === 'prescription' ? (t('prescription_request')) : (r.type || 'Solicitud Médica');
        return {
            id: `req-${r.id}`,
            rawId: r.id,
            date: r.created_at || r.appointment_date,
            typeCategory: 'receta',
            typeLabel: r.type === 'prescription' ? (t('prescription')) : (t('request')),
            concept: reqConcept,
            doctor: r.doctor_name || '—',
            cost,
            paid,
            pending,
            status: isBonified ? 'bonified' : (isPaid ? 'paid' : (pending > 0 ? 'pending' : 'paid')),
            payment_method: getMethodName(r.payment_method)
        };
    });

    // Sort by date descending
    const allLedgerItems = [...apptItems, ...reqItems].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Totals
    const totalPaidContribution = allLedgerItems.reduce((acc, item) => acc + item.paid, 0);
    const calculatedDebt = allLedgerItems.reduce((acc, item) => acc + item.pending, 0);
    const activeDebt = Number(details.total_debt) > 0 ? Number(details.total_debt) : calculatedDebt;
    const totalBilled = allLedgerItems.reduce((acc, item) => acc + item.cost, 0);

    return (
        <aside className={`${styles.PatientFinancialSidebar__sidebar} ${styles.PatientFinancialSidebar__sidebarFull}`}>
            {/* Header Financial Summary Cards */}
            <div className={styles.PatientFinancialSidebar__summaryGrid}>
                {/* Stat 1: Current Debt */}
                <div className={`${styles.PatientFinancialSidebar__financialCard} ${activeDebt > 0 ? styles.PatientFinancialSidebar__cardBorderRed : styles.PatientFinancialSidebar__cardBorderGreen}`}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('current_debt_status')}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent} ${styles.PatientFinancialSidebar__financialContentPadded}`}>
                        <span className={`${styles.PatientFinancialSidebar__financialAmount} ${activeDebt > 0 ? styles.PatientFinancialSidebar__financialAmountDebt : styles.PatientFinancialSidebar__financialAmountClear}`}>
                            ${activeDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small className={activeDebt > 0 ? styles.PatientFinancialSidebar__smallDebt : styles.PatientFinancialSidebar__smallClear}>
                            {activeDebt > 0 ? (t('patient_has_pending_debt')) : (t('account_in_good_standing'))}
                        </small>

                        {activeDebt > 0 && (
                            <div className={styles.PatientFinancialSidebar__debtActions}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className={styles.PatientFinancialSidebar__btnFlex1}
                                    onClick={(e) => onPayDebt(e, details.id, activeDebt)}
                                    icon={<Icon name="payments" size="1rem" />}
                                >
                                    {t('pay_debt')}
                                </Button>
                                <Button
                                    variant="whatsapp"
                                    size="sm"
                                    icon={<Icon name="chat" size="1rem" />}
                                    onClick={() => {
                                        const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                        if (!phone) { showMessage(t('no_phone_available'), 'error'); return; }
                                        const msg = t('financial_reminder_whatsapp', { full_name: details.full_name, amount: '$' + activeDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
                                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                >
                                    {t('remind')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stat 2: Total Paid Contribution */}
                <div className={`${styles.PatientFinancialSidebar__financialCard} ${styles.PatientFinancialSidebar__cardBorderGreenDark}`}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('total_patient_contribution')}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent} ${styles.PatientFinancialSidebar__financialContentPadded}`}>
                        <span className={styles.PatientFinancialSidebar__financialAmountBig}>
                            ${totalPaidContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small className={styles.PatientFinancialSidebar__smallMuted}>
                            {t('cumulative_paid_history')}
                        </small>
                    </div>
                </div>

                {/* Stat 3: Total Billed */}
                <div className={`${styles.PatientFinancialSidebar__financialCard} ${styles.PatientFinancialSidebar__cardBorderBlue}`}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('total_billed')}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent} ${styles.PatientFinancialSidebar__financialContentPadded}`}>
                        <span className={styles.PatientFinancialSidebar__financialAmountBlue}>
                            ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small className={styles.PatientFinancialSidebar__smallMuted}>
                            {allLedgerItems.length} {t('total_services_count')}
                        </small>
                    </div>
                </div>
            </div>

            {/* Line-by-Line Financial Ledger Table */}
            <div className={styles.PatientFinancialSidebar__ledgerCard}>
                <header className={styles.PatientFinancialSidebar__ledgerHeader}>
                    <h3 className={styles.PatientFinancialSidebar__ledgerTitle}>
                        <span className={styles.PatientFinancialSidebar__iconPrimary}><Icon name="receipt_long" size="1.25rem" /></span>
                        {t('financial_ledger_breakdown')}
                    </h3>
                    <span className={styles.PatientFinancialSidebar__ledgerRecords}>
                        {allLedgerItems.length} {t('records')}
                    </span>
                </header>

                <div className={styles.PatientFinancialSidebar__ledgerScroll}>
                    <table className={styles.PatientFinancialSidebar__ledgerTable}>
                        <thead>
                            <tr className={styles.PatientFinancialSidebar__ledgerTheadRow}>
                                <th className={`${styles.PatientFinancialSidebar__ledgerTh} ${styles.PatientFinancialSidebar__tdNowrap}`}>{t('date')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerTh}>{t('concept_type')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerTh}>{t('doctor')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerThRight}>{t('total_amount')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerThRight}>{t('paid_amount')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerThCenter}>{t('status')}</th>
                                <th className={styles.PatientFinancialSidebar__ledgerThCenter}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allLedgerItems.length > 0 ? (
                                allLedgerItems.map((item) => (
                                    <tr key={item.id} className={styles.PatientFinancialSidebar__ledgerRow}>
                                        <td className={`${styles.PatientFinancialSidebar__ledgerTd} ${styles.PatientFinancialSidebar__tdNowrap}`}>
                                            <div className={styles.PatientFinancialSidebar__tdDate}>{formatDate(item.date)}</div>
                                            <small className={styles.PatientFinancialSidebar__tdTime}>{formatTime(item.date)}</small>
                                        </td>
                                        <td className={styles.PatientFinancialSidebar__ledgerTd}>
                                            <div className={styles.PatientFinancialSidebar__tdConcept}>{item.concept}</div>
                                            <small className={styles.PatientFinancialSidebar__tdConceptSub}>
                                                🏷️ {item.typeLabel} {item.payment_method !== '—' ? `• ${item.payment_method}` : ''}
                                            </small>
                                        </td>
                                        <td className={`${styles.PatientFinancialSidebar__ledgerTd} ${styles.PatientFinancialSidebar__tdDoctor}`}>
                                            {item.doctor}
                                        </td>
                                        <td className={`${styles.PatientFinancialSidebar__ledgerTdRight} ${styles.PatientFinancialSidebar__tdAmount}`}>
                                            ${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`${styles.PatientFinancialSidebar__ledgerTdRightStrong} ${item.paid > 0 ? styles.PatientFinancialSidebar__tdPaidPositive : styles.PatientFinancialSidebar__tdPaidZero}`}>
                                            {item.paid > 0 ? `$${item.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className={styles.PatientFinancialSidebar__ledgerTdCenter}>
                                            <span className={`${styles.PatientFinancialSidebar__ledgerStatus} ${item.status === 'paid' ? styles.PatientFinancialSidebar__statusPaid : (item.status === 'pending' ? styles.PatientFinancialSidebar__statusPending : styles.PatientFinancialSidebar__statusBonified)}`}>
                                                {item.status === 'paid' ? (t('paid')) : (item.status === 'pending' ? (t('pending')) : (t('bonified')))}
                                            </span>
                                        </td>
                                        <td className={styles.PatientFinancialSidebar__ledgerTdCenter}>
                                            {item.pending > 0 && (
                                                <Button
                                                    size="sm-compact"
                                                    variant="primary"
                                                    onClick={(e) => onPayDebt(e, details.id, item.pending)}
                                                    icon={<Icon name="payments" size="0.85rem" />}
                                                >
                                                    {t('pay')}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className={styles.PatientFinancialSidebar__ledgerEmpty}>
                                        {t('no_financial_records')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </aside>
    );
};

