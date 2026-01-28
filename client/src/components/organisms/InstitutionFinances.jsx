import React from 'react';
import { useInstitutionFinances } from '../../hooks/useInstitutionFinances';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Modal from '../molecules/Modal';
import StatCard from '../molecules/StatCard'; // Reusing StatCard if suitable, or simple cards

const InstitutionFinances = ({ institutions, t }) => {
    const {
        selectedInstId,
        setSelectedInstId,
        report,
        patients,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    } = useInstitutionFinances(institutions);

    const [showPendingOnly, setShowPendingOnly] = React.useState(true);
    const [viewMode, setViewMode] = React.useState('transactions');

    const filteredTransactions = report?.transactions.filter(t =>
        showPendingOnly ? t.payment_status === 'pending' : true
    ) || [];

    // Localized Date Formatter
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const day = date.getDate();
        const monthKey = t('months_array')[date.getMonth()].toLowerCase();
        const month = t(monthKey);
        const year = date.getFullYear();

        return t('date_format_long')
            .replace('{day}', day)
            .replace('{month}', month)
            .replace('{year}', year);
    };

    return (
        <div className="inst-finances">
            <div className="inst-finances__selector-bar">
                <div className="flex items-center gap-4">
                    <label className="inst-finances__label">{t('institutions')}:</label>
                    <select
                        className="inst-finances__select"
                        value={selectedInstId}
                        onChange={e => setSelectedInstId(e.target.value)}
                    >
                        <option value="">{t('select_institution')}</option>
                        {institutions.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </div>

                {selectedInstId && (
                    <div className="inst-finances__view-toggle">
                        <button
                            className={`inst-finances__toggle-btn ${viewMode === 'transactions' ? 'inst-finances__toggle-btn--active' : ''}`}
                            onClick={() => setViewMode('transactions')}
                        >
                            📊 {t('finances')}
                        </button>
                        <button
                            className={`inst-finances__toggle-btn ${viewMode === 'patients' ? 'inst-finances__toggle-btn--active' : ''}`}
                            onClick={() => setViewMode('patients')}
                        >
                            👥 {t('patients')}
                        </button>
                    </div>
                )}
            </div>

            {loadingReport && <div className="loading-state">{t('loading_report')}</div>}

            {report && viewMode === 'transactions' && (
                <div className="flex flex-col gap-4 animate-fade-in h-[calc(100vh-200px)]">
                    {/* Compact Header Summary Bar */}
                    <div className="inst-header-bar">
                        <div className="inst-stats">
                            <div className="inst-stat-item">
                                <div className="inst-stat-icon inst-stat-icon--blue">📊</div>
                                <div>
                                    <p className="inst-stat-label">{t('historical_total')}</p>
                                    <p className="inst-stat-value">${report.total_amount}</p>
                                </div>
                            </div>
                            <div className="inst-stat-item">
                                <div className="inst-stat-icon inst-stat-icon--red">⏳</div>
                                <div>
                                    <p className="inst-stat-label">{t('pending')}</p>
                                    <p className="inst-stat-value inst-stat-value--red">${report.total_pending}</p>
                                </div>
                            </div>
                            <div className="inst-stat-item">
                                <div className="inst-stat-icon inst-stat-icon--orange">🔢</div>
                                <div>
                                    <p className="inst-stat-label">{t('unpaid_count')}</p>
                                    <p className="inst-stat-value">{report.transactions.filter(t => t.payment_status === 'pending').length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="inst-controls">
                            <div className="inst-finances__view-toggle">
                                <button
                                    className={`inst-finances__toggle-btn ${showPendingOnly ? 'inst-finances__toggle-btn--active' : ''}`}
                                    onClick={() => setShowPendingOnly(true)}
                                >
                                    {t('only_debts')}
                                </button>
                                <button
                                    className={`inst-finances__toggle-btn ${!showPendingOnly ? 'inst-finances__toggle-btn--active' : ''}`}
                                    onClick={() => setShowPendingOnly(false)}
                                >
                                    {t('all_transactions')}
                                </button>
                            </div>
                            <Button
                                size="sm"
                                className="btn--success"
                                onClick={() => setIsPayModalOpen(true)}
                                disabled={Number(report.total_pending) <= 0}
                            >
                                💰 {t('pay')}
                            </Button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="inst-table-container">
                        <div className="inst-table-header">
                            <h3 className="inst-table-title">
                                📋 {t('transaction_log')}
                                <span className="inst-table-badge">{filteredTransactions.length}</span>
                            </h3>
                        </div>

                        <div className="inst-table-wrapper">
                            <table className="inst-data-table">
                                <thead>
                                    <tr>
                                        <th>{t('date_label')}</th>
                                        <th>{t('patient')}</th>
                                        <th>{t('doctor')}</th>
                                        <th className="text-center">{t('status')}</th>
                                        <th className="text-center">{t('antiquity')}</th>
                                        <th className="text-right">{t('amount')}</th>
                                        <th className="text-center">{t('payment')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map(tr => {
                                        const trDate = new Date(tr.transaction_date);
                                        const diffDays = Math.ceil(Math.abs(new Date() - trDate) / (1000 * 60 * 60 * 24));
                                        const isPending = tr.payment_status === 'pending';

                                        return (
                                            <tr key={tr.transaction_id} className={isPending ? 'inst-data-table__tr--pending' : ''}>
                                                <td>{formatDate(tr.transaction_date)}</td>
                                                <td>
                                                    <a href={`/patients?search=${tr.patient_name}`} className="inst-patient-link">
                                                        {tr.patient_name || 'N/A'}
                                                    </a>
                                                </td>
                                                <td>{tr.doctor_name || 'N/A'}</td>
                                                <td className="text-center">
                                                    <Badge variant={tr.appointment_status === 'completed' ? 'green' : 'gray'}>
                                                        {t(tr.appointment_status) || tr.appointment_status}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    {isPending ? (
                                                        <span className={`inst-age-badge ${diffDays > 30 ? 'inst-age-badge--critical' : 'inst-age-badge--warning'}`}>
                                                            {t('days_count').replace('{days}', diffDays)}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="text-right font-mono font-bold">${tr.amount}</td>
                                                <td className="text-center">
                                                    <Badge variant={tr.payment_status === 'paid' ? 'green' : 'red'}>
                                                        {t(tr.payment_status)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12 text-slate-400 italic">
                                                {showPendingOnly ? t('no_debts_found') : t('no_movements_found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {report && viewMode === 'patients' && (
                <div className="flex flex-col gap-4 animate-fade-in h-[calc(100vh-250px)]">
                    <div className="inst-table-container">
                        <div className="inst-table-header">
                            <h3 className="inst-table-title">
                                👥 {t('patient_list_padron')}
                                <span className="inst-table-badge">{patients.length}</span>
                            </h3>
                        </div>

                        <div className="inst-table-wrapper">
                            <table className="inst-data-table">
                                <thead>
                                    <tr>
                                        <th>{t('full_name')}</th>
                                        <th>{t('dni')}</th>
                                        <th className="text-center">{t('last_visit')}</th>
                                        <th className="text-right">{t('tariff_copay')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <a href={`/patients?search=${p.dni}`} className="inst-patient-link">
                                                    {p.full_name}
                                                </a>
                                            </td>
                                            <td className="font-mono text-xs">{p.dni}</td>
                                            <td className="text-center">{formatDate(p.last_visit_date)}</td>
                                            <td className="text-right">
                                                {p.tariff_override ? (
                                                    <span className="font-bold text-blue-600">${p.tariff_override}</span>
                                                ) : (
                                                    <span className="text-slate-500">{p.tariff_percent || 0}%</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {patients.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-12 text-slate-400 italic">
                                                {t('no_patients_found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                title={t('register_inst_payment')}
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-main-600 bg-blue-50 p-3 rounded border border-blue-100">
                        {t('payment_info_msg')}
                    </p>
                    <div className="form-group-bem">
                        <label className="input-label">{t('amount_paid')}</label>
                        <input
                            type="number"
                            className="input-field"
                            value={paymentData.amount}
                            onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="form-group-bem">
                        <label className="input-label">{t('payment_method')}</label>
                        <select
                            className="input-field"
                            value={paymentData.method}
                            onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                        >
                            <option value="transfer">{t('transfer')}</option>
                            <option value="cash">{t('cash')}</option>
                            <option value="check">Cheque</option>
                            <option value="other">{t('other') || 'Otro'}</option>
                        </select>
                    </div>
                    <div className="modal-footer modal-footer--right mt-4">
                        <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handlePaymentSubmit}
                            disabled={!paymentData.amount || Number(paymentData.amount) <= 0}
                        >
                            {t('confirm_payment_btn')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InstitutionFinances;
