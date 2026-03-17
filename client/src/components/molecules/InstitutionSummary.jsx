import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * InstitutionSummary Molecule.
 * Displays key financial metrics and controls for institution reports.
 */
const InstitutionSummary = ({
    report,
    showPendingOnly,
    setShowPendingOnly,
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
                            {report.transactions.filter(t => t.payment_status === 'pending').length}
                        </p>
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
                    variant="success"
                    onClick={onPayClick}
                    icon={<Icon name="payments" size="1.1rem" />}
                >
                    {t('pay')}
                </Button>
            </div>
        </div>
    );
};

export default InstitutionSummary;
