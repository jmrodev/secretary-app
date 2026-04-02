import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';

/**
 * InstitutionSummary Molecule.
 * Displays key financial metrics and controls for institution reports.
 */
const InstitutionSummary = ({
    report,
    showPendingOnly,
    setShowPendingOnly,
    selectedAmount = 0,
    onPayClick,
    t
}) => {
    if (!report) return null;

    return (
        <div className="inst-header-bar animate-fadeIn">
            <div className="inst-stats">
                <div className="inst-stat-item">
                    <div className="inst-stat-icon inst-stat-icon--blue">
                        <Icon name="history" size="1.2rem" />
                    </div>
                    <div>
                        <p className="inst-stat-label">{t('historical_total')}</p>
                        <p className="inst-stat-value">${Number(report.total_amount || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="inst-stat-item">
                    <div className="inst-stat-icon inst-stat-icon--red">
                        <Icon name="timer" size="1.2rem" />
                    </div>
                    <div>
                        <p className="inst-stat-label">{t('pending')}</p>
                        <p className="inst-stat-value inst-stat-value--red">${Number(report.total_pending || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="inst-stat-item">
                    <div className="inst-stat-icon inst-stat-icon--orange">
                        <Icon name="pending_actions" size="1.2rem" />
                    </div>
                    <div>
                        <p className="inst-stat-label">{t('unpaid_count')}</p>
                        <p className="inst-stat-value">
                            {report.transactions.filter(tr => {
                                const paymentLower = (tr.payment_status || '').toLowerCase();
                                const statusLower = (tr.appointment_status || '').toLowerCase();
                                const done = ['completed', 'attended', 'arrived', 'absent'].includes(statusLower);
                                return paymentLower === 'pending' && (!tr.appointment_id || done);
                            }).length}
                        </p>
                    </div>
                </div>
                {selectedAmount > 0 && (
                    <div className="inst-stat-item" style={{ border: '2px solid #38bdf8' }}>
                        <div className="inst-stat-icon inst-stat-icon--green">
                            <Icon name="check_circle" size="1.2rem" />
                        </div>
                        <div>
                            <p className="inst-stat-label">A Cobrar</p>
                            <p className="inst-stat-value" style={{ color: '#16a34a' }}>${Number(selectedAmount).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutionSummary;
