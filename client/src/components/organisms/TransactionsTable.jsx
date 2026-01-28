
import React, { useMemo } from 'react';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

const TransactionsTable = ({
    transactions,
    user,
    settings,
    t,
    onEdit,
    onDelete
}) => {

    const formatDateUnambiguous = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const monthKey = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ][d.getMonth()];
        const month = t(monthKey);
        const year = d.getFullYear();

        // Use a format string to avoid hardcoded "de"
        const format = t('date_format_long') || "{day} {month} {year}";
        return format.replace('{day}', day).replace('{month}', month).replace('{year}', year);
    };

    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
        const transTable = [
            { k: "Consultation (Booking)", v: t('consultation_booking') || "Consulta (Reserva)" },
            { k: "Consultation (Patient Share)", v: t('consultation_patient_share') || "Consulta (Parte Paciente)" },
            { k: "Consultation (Institution Share)", v: t('consultation_institution_share') || "Consulta (Parte Institución)" },
            { k: "Payment for appointment on", v: t('payment_appointment_on') || "Pago por turno del" },
            { k: "Cash Box Delivery to Dr.", v: t('cash_box_delivery_to') || "Entrega de Caja al Dr." },
            { k: "Request: license for", v: t('request_license_for') || "Solicitud: licencia para" },
            { k: "Request: prescription for", v: t('request_prescription_for') || "Solicitud: receta para" },
            { k: "- Paid", v: `- ${t('paid')}` }
        ];

        transTable.forEach(item => {
            if (d.includes(item.k)) {
                d = d.replace(item.k, item.v);
            }
        });
        return d;
    };

    const groupedTransactions = useMemo(() => {
        const groups = [];
        let currentGroup = [];
        let lastKey = null;

        transactions.forEach(tx => {
            let key = null;
            if (tx.appointment_id) key = `appt_${tx.appointment_id}`;
            else if (tx.request_id) key = `req_${tx.request_id}`;
            else key = `gen_${tx.transaction_date}_${tx.doctor_id}_${tx.description}`;

            if (key !== lastKey) {
                if (currentGroup.length > 0) groups.push(currentGroup);
                currentGroup = [tx];
                lastKey = key;
            } else {
                currentGroup.push(tx);
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
    }, [transactions]);

    return (
        <Card className="p-0 overflow-hidden" title={t('transaction_log')}>
            <div className="table-responsive">
                <table className="transactions-table__table">
                    <thead>
                        <tr>
                            <th className="pl-6-bem">{t('date_label')}</th>
                            <th className="w-1/3">{t('description')}</th>
                            <th>{t('beneficiary')}</th>
                            <th>{t('payment_method')}</th>
                            <th className="transactions-table__header-cell--right">{t('amount')}</th>
                            <th className="transactions-table__header-cell--center">{t('proof')}</th>
                            {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                <th className="transactions-table__header-cell--right pr-6-bem">{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.map((group, gIdx) => (
                            <React.Fragment key={`group-${gIdx}`}>
                                {group.map((tx, tIdx) => {
                                    const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
                                    const isGrouped = group.length > 1;

                                    return (
                                        <tr key={tx.id} className={isGrouped ? 'transactions-table__row--grouped' : ''}>
                                            <td className="pl-6-bem">
                                                <div className="transactions-table__date">{formatDateUnambiguous(tx.transaction_date)}</div>
                                                <div className="transactions-table__time">
                                                    {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="transactions-table__description-wrapper">
                                                    <span className={`tag tag-${isIncome ? 'completed' : 'rejected'} transactions-table__type-tag`}>
                                                        {t(tx.type) || tx.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="transactions-table__description">{translateDescription(tx.description)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="transactions-table__beneficiary">
                                                    <span className="transactions-table__beneficiary-name">
                                                        {tx.patient_full_name ? `🧑 ${tx.patient_full_name}` : (tx.doctor_name || t('general'))}
                                                    </span>
                                                    {tx.patient_full_name && tx.doctor_name && (
                                                        <span className="transactions-table__patient">
                                                            {tx.doctor_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="transactions-table__method">
                                                    <span>{t(tx.method) || tx.method}</span>
                                                </div>
                                            </td>
                                            <td className={`transactions-table__amount ${tx.is_withdrawal ? 'transactions-table__amount--withdrawal' : (isIncome ? 'transactions-table__amount--income' : 'transactions-table__amount--expense')}`}>
                                                {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="transactions-table__cell--center">
                                                {tx.proof_file ? (
                                                    <a href={tx.proof_file} target="_blank" rel="noreferrer" className="btn-text" title={t('view')}>
                                                        📁
                                                    </a>
                                                ) : <span className="transactions-table__no-proof">-</span>}
                                            </td>
                                            {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                                <td className="transactions-table__cell--right pr-6-bem">
                                                    <div className="transactions-table__actions">
                                                        <Button size="sm" variant="ghost" onClick={() => onEdit(tx)} title={t('edit')}>
                                                            ✏️
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="btn-icon-delete" onClick={() => onDelete(tx.id)} title={t('delete')}>
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {group.length > 1 && (
                                    <tr className="transactions-table__group-footer">
                                        <td colSpan={(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') ? 7 : 6} className="transactions-table__group-total">
                                            {t('group_total')}: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default TransactionsTable;
