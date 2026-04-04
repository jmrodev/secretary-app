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
        <div className="institution-finances__header-bar animate-fadeIn">
            <div className="institution-finances__stats">
                <div className="institution-finances__stat-item">
                    <div className="institution-finances__stat-icon institution-finances__stat-icon--blue">
                        <Icon name="HISTORY" size="1.2rem" />
                    </div>
                    <div className="institution-finances__stat-info">
                        <p className="institution-finances__stat-label">{t('historical_total')}</p>
                        <p className="institution-finances__stat-value">${Number(report.total_amount || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="institution-finances__stat-item">
                    <div className="institution-finances__stat-icon institution-finances__stat-icon--red">
                        <Icon name="PENDING" size="1.2rem" />
                    </div>
                    <div className="institution-finances__stat-info">
                        <p className="institution-finances__stat-label">{t('pending')}</p>
                        <p className="institution-finances__stat-value institution-finances__stat-value--red">${Number(report.total_pending || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="institution-finances__stat-item">
                    <div className="institution-finances__stat-icon institution-finances__stat-icon--orange">
                        <Icon name="NOTES" size="1.2rem" />
                    </div>
                    <div className="institution-finances__stat-info">
                        <p className="institution-finances__stat-label">{t('unpaid_count')}</p>
                        <p className="institution-finances__stat-value">
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
                    <div className="institution-finances__stat-item institution-finances__stat-item--selected">
                        <div className="institution-finances__stat-icon institution-finances__stat-icon--green">
                            <Icon name="CONFIRMED" size="1.2rem" />
                        </div>
                        <div className="institution-finances__stat-info">
                            <p className="institution-finances__stat-label">A Cobrar</p>
                            <p className="institution-finances__stat-value institution-finances__stat-value--green">${Number(selectedAmount).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutionSummary;
