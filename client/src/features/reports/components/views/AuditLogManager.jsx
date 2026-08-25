import React from 'react';
import { AuditLogTable } from '@/features/reports/components/tables/AuditLogTable';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './AuditLogManager.module.css';

const formatDetails = (detailsRaw) => {
    if (!detailsRaw) return <span className={styles.AuditLogManager__textMuted}>-</span>;

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
            <div className={styles.AuditLogManager__jsonContent}>
                {Object.entries(content).map(([key, value]) => (
                    <div key={key} className={styles.AuditLogManager__jsonItem}>
                        <span className={styles.AuditLogManager__jsonKey}>{key}:</span>{' '}
                        <span className={styles.AuditLogManager__jsonValue}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return <span className={styles.AuditLogManager__textValue}>{String(detailsRaw)}</span>;
};

export const AuditLogManager = ({
    logs,
    selectedLog,
    setSelectedLog,
    t
}) => {
    return (
        <div className={styles.AuditLogManager__auditLogManager}>
            <header className={styles.AuditLogManager__header}>
                <div className={styles.AuditLogManager__headerTop}>
                    <div>
                        <h2 className={styles.AuditLogManager__title}>{t('audit_logs')}</h2>
                        <p className={styles.AuditLogManager__subtitle}>{t('audit_logs_subtitle')}</p>
                    </div>
                    <div className={styles.AuditLogManager__countBadge}>
                        {logs.length} {t('logs_count')}
                    </div>
                </div>
            </header>

            <div className={`${styles.AuditLogManager__content} dashboard-card dashboard-card--highlighted`}>
                <div className={styles.AuditLogManager__scrollable}>
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
                    <div className={styles.AuditLogManager__root}>
                        <div className={styles.AuditLogManager__summaryGrid}>
                            <div>
                                <div className={styles.AuditLogManager__fieldLabel}>{t('action')}</div>
                                <div className={styles.AuditLogManager__fieldValue}>{selectedLog.action}</div>
                            </div>
                            <div>
                                <div className={styles.AuditLogManager__fieldLabel}>{t('user')}</div>
                                <div className={`${styles.AuditLogManager__fieldValue} ${styles.AuditLogManager__fieldValueSecondary}`}>{selectedLog.username}</div>
                            </div>
                            <div>
                                <div className={styles.AuditLogManager__fieldLabel}>{t('date')}</div>
                                <div className={`${styles.AuditLogManager__fieldValue} ${styles.AuditLogManager__fieldValueTime}`}>{formatDate(selectedLog.created_at, { time: true })}</div>
                            </div>
                            <div>
                                <div className={styles.AuditLogManager__fieldLabel}>{t('ip_header')}</div>
                                <div className={`${styles.AuditLogManager__fieldValue} ${styles.AuditLogManager__fieldValueMono}`}>{selectedLog.ip_address}</div>
                            </div>
                        </div>

                        <div className={styles.AuditLogManager__detailsSection}>
                            <h4 className={styles.AuditLogManager__detailsTitle}>{t('details_header')}</h4>
                            <div className={`${styles.AuditLogManager__detailsBox} custom-scrollbar`}>
                                {formatDetails(selectedLog.details)}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
