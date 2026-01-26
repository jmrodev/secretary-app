
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
        const months = [
            t('january') || 'enero', t('february') || 'febrero', t('march') || 'marzo',
            t('april') || 'abril', t('may') || 'mayo', t('june') || 'junio',
            t('july') || 'julio', t('august') || 'agosto', t('september') || 'septiembre',
            t('october') || 'octubre', t('november') || 'noviembre', t('december') || 'diciembre'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} de ${month} ${year}`;
    };

    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
        const transTable = {
            "Consultation (Booking)": "Consulta (Reserva)",
            "Payment for appointment on": "Pago por turno del",
            "Cash Box Delivery to Dr.": "Entrega de Caja al Dr.",
            "Request: license for": "Solicitud: licencia para",
            "Request: prescription for": "Solicitud: receta para",
            "- Paid": "- Pagado"
        };
        Object.keys(transTable).forEach(k => {
            if (d.includes(k)) d = d.replace(k, transTable[k]);
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
                <table className="table-base table-base--lg w-full">
                    <thead>
                        <tr>
                            <th className="pl-6">{t('date_label')}</th>
                            <th className="w-1/3">{t('description')}</th>
                            <th>{t('beneficiary')}</th>
                            <th>{t('payment_method')}</th>
                            <th className="text-right">{t('amount')}</th>
                            <th className="text-center">{t('proof')}</th>
                            {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                <th className="text-right pr-6">{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.map((group, gIdx) => (
                            <React.Fragment key={`group-${gIdx}`}>
                                {group.map((tx, tIdx) => {
                                    const isDebt = tx.method === 'on_account' || tx.method === 'credit';
                                    const methodIcon = tx.method === 'cash' ? '💵' : (tx.method === 'transfer' ? '🏦' : (isDebt ? '⏳' : '💳'));
                                    const methodLabel = tx.method === 'cash' ? t('cash') : (tx.method === 'transfer' ? t('transfer') : (isDebt ? (t('on_account') || 'Cuenta Corriente') : t('card')));
                                    const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
                                    const isGrouped = group.length > 1;

                                    return (
                                        <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${isGrouped ? 'bg-amber-50/20' : ''}`}>
                                            <td className="pl-6 py-4">
                                                <div className="font-bold text-main-800">{formatDateUnambiguous(tx.transaction_date)}</div>
                                                <div className="text-xs text-muted">
                                                    {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`tag tag-${isIncome ? 'completed' : 'rejected'} w-fit`}>
                                                        {t(tx.type) || tx.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-sm font-medium">{translateDescription(tx.description)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-main-700">{tx.doctor_name || t('general')}</span>
                                                    {tx.patient_full_name && (
                                                        <span className="text-xs text-muted">
                                                            👤 {tx.patient_full_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span>{methodIcon}</span>
                                                    <span className="font-medium">{methodLabel}</span>
                                                </div>
                                            </td>
                                            <td className={`font-bold text-right text-base ${tx.is_withdrawal ? 'text-blue-600' : (isIncome ? 'text-green-600' : 'text-red-500')}`}>
                                                {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                {tx.proof_file ? (
                                                    <a href={tx.proof_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700" title={t('view')}>
                                                        📁
                                                    </a>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                                <td className="text-right pr-6">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="text-amber-500 hover:bg-amber-50"
                                                            onClick={() => onEdit(tx)}
                                                            title={t('edit')}
                                                            icon="✏️"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={() => onDelete(tx.id)}
                                                            title={t('delete')}
                                                            icon="🗑️"
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {group.length > 1 && (
                                    <tr className="bg-amber-100/30">
                                        <td colSpan={7} className="px-6 py-2 text-right text-xs font-bold text-amber-800 uppercase tracking-wider">
                                            {t('group_total') || 'Total Grupo'}: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
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
