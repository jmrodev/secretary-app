import React from 'react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import styles from './PatientFinancialSidebar.module.css';

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
    const getMethodName = (pm) => {
        if (!pm || pm === '—') return '';
        const key = String(pm).toLowerCase();
        if (key === 'cash') return t('cash') || 'Efectivo';
        if (key === 'transfer') return t('transfer') || 'Transferencia';
        if (key === 'mercadopago') return 'MercadoPago';
        if (key === 'credit') return t('credit') || 'Tarjeta de Crédito';
        if (key === 'debit') return t('debit') || 'Tarjeta de Débito';
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
            typeLabel: t('appointment') || 'Turno',
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
        const reqConcept = r.type === 'prescription' ? (t('prescription_request') || 'Solicitud de Receta Médica') : (r.type || 'Solicitud Médica');
        return {
            id: `req-${r.id}`,
            rawId: r.id,
            date: r.created_at || r.appointment_date,
            typeCategory: 'receta',
            typeLabel: r.type === 'prescription' ? (t('prescription') || 'Receta') : (t('request') || 'Solicitud'),
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
        <aside className={`${styles.PatientFinancialSidebar__sidebar}`} style={{ width: '100%' }}>
            {/* Header Financial Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Stat 1: Current Debt */}
                <div className={`${styles.PatientFinancialSidebar__financialCard}`} style={{ borderLeft: activeDebt > 0 ? '5px solid #ea4335' : '5px solid #34a853' }}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('current_debt_status') || 'DEUDA PENDIENTE ACTUAL'}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent}`} style={{ padding: '1.25rem' }}>
                        <span className={`${styles.PatientFinancialSidebar__financialAmount} ${activeDebt > 0 ? styles.PatientFinancialSidebar__financialAmountDebt : styles.PatientFinancialSidebar__financialAmountClear}`}>
                            ${activeDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small style={{ color: activeDebt > 0 ? '#ea4335' : '#34a853', fontWeight: 600 }}>
                            {activeDebt > 0 ? (t('patient_has_pending_debt') || '⚠️ El paciente posee saldo deudor') : (t('account_in_good_standing') || '¡Al día! Sin deuda pendiente')}
                        </small>

                        {activeDebt > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    style={{ flex: 1 }}
                                    onClick={(e) => onPayDebt(e, details.id, activeDebt)}
                                    icon={<Icon name="payments" size="1rem" />}
                                >
                                    {t('pay_debt') || 'Pagar Deuda'}
                                </Button>
                                <Button
                                    variant="whatsapp"
                                    size="sm"
                                    icon={<Icon name="chat" size="1rem" />}
                                    onClick={() => {
                                        const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                        if (!phone) return alert(t('no_phone_available') || 'Sin teléfono registrado');
                                        const msg = `Hola ${details.full_name}, te escribimos de Cima Salud para informarte que figura un saldo pendiente de $${activeDebt} en tu cuenta. ¿Podrías confirmarnos cuándo podrías regularizarlo? ¡Gracias!`;
                                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                >
                                    {t('remind') || 'Recordar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stat 2: Total Paid Contribution */}
                <div className={`${styles.PatientFinancialSidebar__financialCard}`} style={{ borderLeft: '5px solid #137333' }}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('total_patient_contribution') || 'APORTE TOTAL AL CONSULTORIO'}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent}`} style={{ padding: '1.25rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#137333', lineHeight: 1 }}>
                            ${totalPaidContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small style={{ color: 'var(--gray-600)', fontWeight: 600 }}>
                            {t('cumulative_paid_history') || 'Total histórico cobrado de turnos y recetas'}
                        </small>
                    </div>
                </div>

                {/* Stat 3: Total Billed */}
                <div className={`${styles.PatientFinancialSidebar__financialCard}`} style={{ borderLeft: '5px solid #1a73e8' }}>
                    <header className={`${styles.PatientFinancialSidebar__financialHeader}`}>
                        <h4 className={`${styles.PatientFinancialSidebar__financialTitle}`}>
                            {t('total_billed') || 'TOTAL FACTURADO HISTÓRICO'}
                        </h4>
                    </header>
                    <div className={`${styles.PatientFinancialSidebar__financialContent}`} style={{ padding: '1.25rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1a73e8', lineHeight: 1 }}>
                            ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <small style={{ color: 'var(--gray-600)', fontWeight: 600 }}>
                            {allLedgerItems.length} {t('total_services_count') || 'servicios registrados en su historial'}
                        </small>
                    </div>
                </div>
            </div>

            {/* Line-by-Line Financial Ledger Table */}
            <div style={{ background: '#ffffff', border: '1px solid var(--gray-200)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <header style={{ padding: '1rem 1.25rem', background: 'var(--gray-100)', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-800)' }}>
                        <Icon name="receipt_long" size="1.25rem" style={{ color: 'var(--primary-color, #1a73e8)' }} />
                        {t('financial_ledger_breakdown') || 'Historial Detallado de Movimientos Financieros'}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                        {allLedgerItems.length} {t('records') || 'registros'}
                    </span>
                </header>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-700)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{t('date') || 'Fecha'}</th>
                                <th style={{ padding: '0.75rem 1rem' }}>{t('concept_type') || 'Concepto / Servicio'}</th>
                                <th style={{ padding: '0.75rem 1rem' }}>{t('doctor') || 'Médico'}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('total_amount') || 'Monto Total'}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('paid_amount') || 'Abonado'}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t('status') || 'Estado'}</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t('actions') || 'Acción'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allLedgerItems.length > 0 ? (
                                allLedgerItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 600 }}>{formatDate(item.date)}</div>
                                            <small style={{ color: 'var(--gray-500)' }}>{formatTime(item.date)}</small>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{item.concept}</div>
                                            <small style={{ color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                                                🏷️ {item.typeLabel} {item.payment_method !== '—' ? `• ${item.payment_method}` : ''}
                                            </small>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-700)' }}>
                                            {item.doctor}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--gray-900)' }}>
                                            ${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: item.paid > 0 ? '#137333' : 'var(--gray-500)' }}>
                                            {item.paid > 0 ? `$${item.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.25rem 0.65rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: item.status === 'paid' ? '#e6f4ea' : (item.status === 'pending' ? '#fce8e6' : '#e8f0fe'),
                                                color: item.status === 'paid' ? '#137333' : (item.status === 'pending' ? '#c5221f' : '#1a73e8')
                                            }}>
                                                {item.status === 'paid' ? (t('paid') || 'Abonado') : (item.status === 'pending' ? (t('pending') || 'Pendiente') : (t('bonified') || 'Bonificado'))}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {item.pending > 0 && (
                                                <Button
                                                    size="sm-compact"
                                                    variant="primary"
                                                    onClick={(e) => onPayDebt(e, details.id, item.pending)}
                                                    icon={<Icon name="payments" size="0.85rem" />}
                                                >
                                                    {t('pay') || 'Pagar'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                                        {t('no_financial_records') || 'Sin movimientos financieros registrados para este paciente'}
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

