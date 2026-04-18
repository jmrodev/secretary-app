<<<<<<< HEAD
=======
import React from 'react';
>>>>>>> main
import Icon from '@/components/atoms/Icon';
import './InstitutionSummary.css';

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
        <section className="institution-summary animate-fadeIn">
            <h2 className="visually-hidden">{t('institution_billing_summary')}</h2>
            <div className="institution-summary__stats">
                <div className="institution-summary__stat-item">
                    <div className="institution-summary__stat-icon institution-summary__stat-icon--blue">
                        <Icon name="HISTORY" size="1.2rem" />
                    </div>
                    <div className="institution-summary__stat-info">
                        <p className="institution-summary__stat-label">{t('historical_total')}</p>
                        <p className="institution-summary__stat-value">${Number(report.total_amount || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="institution-summary__stat-item">
                    <div className="institution-summary__stat-icon institution-summary__stat-icon--red">
                        <Icon name="PENDING" size="1.2rem" />
                    </div>
                    <div className="institution-summary__stat-info">
                        <p className="institution-summary__stat-label">{t('pending')}</p>
                        <p className="institution-summary__stat-value institution-summary__stat-value--red">${Number(report.total_pending || 0).toLocaleString()}</p>
                    </div>
                </div>
                <div className="institution-summary__stat-item">
                    <div className="institution-summary__stat-icon institution-summary__stat-icon--orange">
                        <Icon name="NOTES" size="1.2rem" />
                    </div>
                    <div className="institution-summary__stat-info">
                        <p className="institution-summary__stat-label">{t('unpaid_count')}</p>
                        <p className="institution-summary__stat-value">
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
                    <div className="institution-summary__stat-item institution-summary__stat-item--selected">
                        <div className="institution-summary__stat-icon institution-summary__stat-icon--green">
                            <Icon name="CONFIRMED" size="1.2rem" />
                        </div>
                        <div className="institution-summary__stat-info">
                            <p className="institution-summary__stat-label">{t('total_to_charge')}</p>
                            <p className="institution-summary__stat-value institution-summary__stat-value--green">${Number(selectedAmount).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default InstitutionSummary;
