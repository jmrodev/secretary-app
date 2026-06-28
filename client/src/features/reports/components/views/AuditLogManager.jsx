import React from 'react';
import AuditLogTable from '@/features/reports/components/tables/AuditLogTable';
import { Button } from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './AuditLogManager.module.css';

const AuditLogManager = ({
    logs,
    selectedLog,
    setSelectedLog,
    t
}) => {

    const formatDetails = (detailsRaw) => {
        if (!detailsRaw) return <span className={`${styles.textMuted}`}>-</span>;

        let content = detailsRaw;
        let isJson = false;
        try {
            const parsed = JSON.parse(detailsRaw);
            if (typeof parsed === 'object' && parsed !== null) {
                content = parsed;
                isJson = true;
            }
        } catch { /* Not JSON */ }

        if (isJson) {
            return (
                <div className="audit-log-detail__json-content">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="audit-log-detail__json-item">
                            <span className={`${styles.jsonKey}`}>{key}:</span>{' '}
                            <span className={`${styles.jsonValue}`}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className={`${styles.textValue}`}>{String(detailsRaw)}</span>;
    };

    return (
        <div className={`${styles.auditLogManager}`}>
            <header className={`${styles.header}`}>
                <div className={`${styles.headerTop}`}>
                    <div>
                        <h2 className={`${styles.title}`}>{t('audit_logs')}</h2>
                        <p className={`${styles.subtitle}`}>{t('audit_logs_subtitle')}</p>
                    </div>
                    <div className={`${styles.countBadge}`}>
                        {logs.length} {t('logs_count')}
                    </div>
                </div>
            </header>

            <div className={`${styles.content} dashboard-card dashboard-card--highlighted`}>
                <div className={`${styles.scrollable}`}>
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
                    <div className={`${styles.root}`}>
                        <div className={`${styles.summaryGrid}`}>
                            <div>
                                <div className={`${styles.fieldLabel}`}>{t('action')}</div>
                                <div className={`${styles.fieldValue}`}>{selectedLog.action}</div>
                            </div>
                            <div>
                                <div className={`${styles.fieldLabel}`}>{t('user')}</div>
                                <div className={`${styles.fieldValue} ${styles.fieldValueSecondary}`}>{selectedLog.username}</div>
                            </div>
                            <div>
                                <div className={`${styles.fieldLabel}`}>{t('date')}</div>
                                <div className={`${styles.fieldValue} ${styles.fieldValueTime}`}>{formatDate(selectedLog.created_at, { time: true })}</div>
                            </div>
                            <div>
                                <div className={`${styles.fieldLabel}`}>{t('ip_header')}</div>
                                <div className={`${styles.fieldValue} ${styles.fieldValueMono}`}>{selectedLog.ip_address}</div>
                            </div>
                        </div>

                        <div className={`${styles.detailsSection}`}>
                            <h4 className={`${styles.detailsTitle}`}>{t('details_header')}</h4>
                            <div className={`${styles.detailsBox} custom-scrollbar`}>
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
