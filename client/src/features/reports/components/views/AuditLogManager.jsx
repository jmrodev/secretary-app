import React from 'react';
import AuditLogTable from '@/features/reports/components/tables/AuditLogTable';
import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import { formatDate } from '@/utils/core/dateUtils';
import './AuditLogManager.css';

const AuditLogManager = ({
    logs,
    selectedLog,
    setSelectedLog,
    t
}) => {

    const formatDetails = (detailsRaw) => {
        if (!detailsRaw) return <span className="audit-log-detail__text--muted">-</span>;

        let content = detailsRaw;
        let isJson = false;
        try {
            const parsed = JSON.parse(detailsRaw);
            if (typeof parsed === 'object' && parsed !== null) {
                content = parsed;
                isJson = true;
            }
        } catch (e) { /* Not JSON */ }

        if (isJson) {
            return (
                <div className="audit-log-detail__json-content">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="audit-log-detail__json-item">
                            <span className="audit-log-detail__json-key">{key}:</span>{' '}
                            <span className="audit-log-detail__json-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="audit-log-detail__text-value">{String(detailsRaw)}</span>;
    };

    return (
        <div className="audit-log-manager">
            <header className="audit-log-manager__header">
                <div className="audit-log-manager__header-top">
                    <div>
                        <h2 className="audit-log-manager__title">{t('audit_logs')}</h2>
                        <p className="audit-log-manager__subtitle">{t('audit_logs_subtitle')}</p>
                    </div>
                    <div className="audit-log-manager__count-badge">
                        {logs.length} {t('logs_count')}
                    </div>
                </div>
            </header>

            <div className="audit-log-manager__content dashboard-card dashboard-card--highlighted">
                <div className="audit-log-manager__scrollable">
                    <AuditLogTable
                        logs={logs}
                        onSelectLog={setSelectedLog}
                        t={t}
                    />
                </div>
            </div>

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title={t('log_details')}
                footer={
                    <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                        {t('close')}
                    </Button>
                }
            >
                {selectedLog && (
                    <div className="audit-log-detail">
                        <div className="audit-log-detail__summary-grid">
                            <div>
                                <div className="audit-log-detail__field-label">{t('action')}</div>
                                <div className="audit-log-detail__field-value">{selectedLog.action}</div>
                            </div>
                            <div>
                                <div className="audit-log-detail__field-label">{t('user')}</div>
                                <div className="audit-log-detail__field-value audit-log-detail__field-value--secondary">{selectedLog.username}</div>
                            </div>
                            <div>
                                <div className="audit-log-detail__field-label">{t('date')}</div>
                                <div className="audit-log-detail__field-value audit-log-detail__field-value--time">{formatDate(selectedLog.created_at, { time: true })}</div>
                            </div>
                            <div>
                                <div className="audit-log-detail__field-label">{t('ip_header')}</div>
                                <div className="audit-log-detail__field-value audit-log-detail__field-value--mono">{selectedLog.ip_address}</div>
                            </div>
                        </div>

                        <div className="audit-log-detail__details-section">
                            <h4 className="audit-log-detail__details-title">{t('details_header')}</h4>
                            <div className="audit-log-detail__details-box custom-scrollbar">
                                {formatDetails(selectedLog.details)}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AuditLogManager;
