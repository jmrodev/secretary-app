import React from 'react';
import Button from '../atoms/Button';

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
                    disabled={Number(report.total_pending) <= 0}
                >
                    💰 {t('pay')}
                </Button>
            </div>
        </div>
    );
};

export default InstitutionSummary;
