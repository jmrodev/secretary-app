
import React, { useMemo } from 'react';
import Button from '../atoms/Button';

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
        d = d.replace("Consultation (Booking)", "Consulta (Reserva)");
        d = d.replace("Payment for appointment on", "Pago por turno del");
        d = d.replace("Cash Box Delivery to Dr.", "Entrega de Caja al Dr.");
        d = d.replace("Request: license for", "Solicitud: licencia para");
        d = d.replace("Request: prescription for", "Solicitud: receta para");
        d = d.replace("- Paid", "- Pagado");
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
        <div className="card">
            <h3>{t('transaction_log')}</h3>
            <div className="overflow-x-auto">
                <table className="table-base table-base-lg w-full">
                    <thead className="bg-slate-50">
                        <tr className="border-b text-left text-xs uppercase tracking-wider text-main-500">
                            <th className="py-3 px-4">{t('date_label')}</th>
                            <th className="py-3 px-4 w-1/3">{t('description')}</th>
                            <th className="py-3 px-4">{t('beneficiary')}</th>
                            <th className="py-3 px-4">{t('payment_method')}</th>
                            <th className="py-3 px-4 text-right">{t('amount')}</th>
                            <th className="py-3 px-4 text-center">{t('proof')}</th>
                            {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                <th className="py-3 px-4 text-center">{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.map((group, gIdx) => (
                            <tr key={`group-${gIdx}`} className="hover:bg-slate-50 transition-colors">
                                <td colSpan={7} className="p-0 border-b border-slate-100">
                                    <table className="w-full">
                                        <tbody>
                                            {group.map((tx, tIdx) => {
                                                const isDebt = tx.method === 'on_account' || tx.method === 'credit';
                                                const methodIcon = tx.method === 'cash' ? '💵' : (tx.method === 'transfer' ? '🏦' : (isDebt ? '⏳' : '💳'));
                                                const methodLabel = tx.method === 'cash' ? t('cash') : (tx.method === 'transfer' ? t('transfer') : (isDebt ? (t('on_account') || 'Cuenta Corriente') : t('card')));
                                                const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
                                                const isGroupEnd = tIdx === group.length - 1;
                                                const groupSize = group.length;
                                                const groupClass = groupSize > 1 ? "bg-amber-50/50" : "";

                                                return (
                                                    <tr key={tx.id} className={`${groupClass} ${!isGroupEnd ? 'border-b border-amber-100' : ''}`}>
                                                        <td className="py-3 px-4 text-sm text-main-500 whitespace-nowrap w-[15%]">
                                                            {formatDateUnambiguous(tx.transaction_date)}
                                                            <div className="text-xs text-muted">{new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                        <td className="py-3 px-4 w-1/3">
                                                            <div className="flex flex-col">
                                                                <span className={`text-xs font-bold uppercase mb-1 w-fit px-2 py-0.5 rounded ${isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {t(tx.type) || tx.type.replace('_', ' ')}
                                                                </span>
                                                                <span className="text-sm text-main-700">{translateDescription(tx.description)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-medium text-main-600 w-[15%]">
                                                            <div className="flex flex-col">
                                                                <span>{tx.doctor_name || <span className="text-muted italic">{t('general')}</span>}</span>
                                                                {tx.patient_full_name && (
                                                                    <span className="text-[10px] text-muted font-normal">
                                                                        👤 {tx.patient_full_name} {tx.patient_dni ? `(${tx.patient_dni})` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 w-[15%]">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${tx.method === 'cash' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                (tx.method === 'transfer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    (isDebt ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200'))
                                                                }`}>
                                                                <span>{methodIcon}</span> {methodLabel || tx.method}
                                                            </span>
                                                        </td>
                                                        <td className={`py-3 px-4 text-sm font-bold text-right w-[10%] ${tx.is_withdrawal ? 'text-blue-600' : (isIncome ? 'text-green-600' : 'text-red-500')
                                                            }`}>
                                                            {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4 text-center w-[10%]">
                                                            {tx.proof_file ? (
                                                                <a href={tx.proof_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 p-1" title={t('view')}>
                                                                    📁
                                                                </a>
                                                            ) : <span className="text-main-300">-</span>}
                                                        </td>
                                                        {(user.role === 'admin' || settings.enable_secretary_finance_crud === 'true') && (
                                                            <td className="py-3 px-4 text-center w-[10%]">
                                                                <div className="flex gap-2 justify-center">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm-compact"
                                                                        className="text-amber-500 hover:text-amber-700 p-1"
                                                                        onClick={() => onEdit(tx)}
                                                                        title={t('edit')}
                                                                    >
                                                                        ✏️
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm-compact"
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                        onClick={() => onDelete(tx.id)}
                                                                        title={t('delete')}
                                                                    >
                                                                        🗑️
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {/* Group total if > 1 */}
                                    {group.length > 1 && (
                                        <div className="bg-amber-100/50 px-4 py-1 text-right text-xs font-bold text-amber-800 border-t border-amber-200">
                                            Total Group: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionsTable;
