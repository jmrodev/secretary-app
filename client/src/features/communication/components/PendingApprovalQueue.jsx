import React, { useState } from 'react';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import { Button } from '@/components/atoms/Button';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { usePendingApproval } from '@/context/PendingApprovalContext';
import { formatDate } from '@/utils/core/dateUtils';
import { PendingBookingBanner } from './PendingBookingBanner';
import { AlternativeSlotPicker } from './AlternativeSlotPicker';
import styles from './PendingApprovalQueue.module.css';

/**
 * PendingApprovalQueue Organism.
 * Global, non-blocking, collapsible queue for supervised WhatsApp auto-booking.
 * Collapsed → PendingBookingBanner trigger (fixed bottom). Expanded → panel
 * listing every pending booking with Accept / Suggest Alternative / Reject.
 * Alternative_sent items only show the waiting status (Accept/Suggest are
 * only valid for status 'pending' per the backend optimistic lock).
 */
export const PendingApprovalQueue = () => {
    const { pendingItems, loading, accept, suggestAlternative, reject } = usePendingApproval();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [suggestItem, setSuggestItem] = useState(null);

    const handleAccept = async (item) => {
        setBusyId(item.id);
        try {
            await accept(item.id);
            showMessage(t('pending_approval_accept_success'), 'success');
        } catch (error) {
            const status = error?.response?.data?.status;
            if (status === 'taken') showMessage(t('pending_approval_accept_taken'), 'error');
            else if (status === 'slot_taken') showMessage(t('pending_approval_accept_slot_taken'), 'error');
            else if (status === 'phone_changed') showMessage(t('pending_approval_accept_phone_changed'), 'error');
            else showMessage(t('pending_approval_accept_error'), 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (item) => {
        setBusyId(item.id);
        try {
            await reject(item.id);
            showMessage(t('pending_approval_reject_success'), 'success');
        } catch {
            showMessage(t('pending_approval_reject_error'), 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleSuggestSubmit = async (iso) => {
        if (!suggestItem) return;
        setBusyId(suggestItem.id);
        try {
            await suggestAlternative(suggestItem.id, iso, '');
            showMessage(t('pending_approval_suggest_success'), 'success');
        } catch {
            showMessage(t('pending_approval_suggest_error'), 'error');
        } finally {
            setBusyId(null);
            setSuggestItem(null);
        }
    };

    return (
        <>
            {expanded && (
                <aside className={styles.panel} aria-label={t('pending_approval_title')}>
                    <header className={styles.panel__header}>
                        <h4 className={styles.panel__title}>
                            <Icon name="NOTIFICATIONS" size="1rem" />
                            {t('pending_approval_title')}
                        </h4>
                        <Icon
                            name="EXPAND_LESS"
                            size="1.2rem"
                            className={styles.panel__collapse}
                            onIconClick={() => setExpanded(false)}
                        />
                    </header>
                    <div className={styles.panel__body}>
                        {loading ? (
                            <Loading variant="centered" size="sm" />
                        ) : pendingItems.length === 0 ? (
                            <p className={styles.panel__empty}>{t('pending_approval_empty')}</p>
                        ) : (
                            <ul className={styles.panel__list}>
                                {pendingItems.map((item) => (
                                    <li key={item.id} className={styles.panel__item}>
                                        <div className={styles.panel__info}>
                                            <strong className={styles.panel__patient}>{item.patient_name}</strong>
                                            <span className={styles.panel__doctor}>
                                                <Icon name="DOCTORS" size="0.85rem" />
                                                {item.doctor_name}
                                            </span>
                                            <span className={styles.panel__slot}>
                                                <Icon name="TIME" size="0.85rem" />
                                                {formatDate(
                                                    new Date(`${item.requested_slot_date}T${item.requested_slot_time}:00`),
                                                    { monthName: true }
                                                )} · {item.requested_slot_time} hs
                                            </span>
                                        </div>
                                        {item.status === 'pending' ? (
                                            <div className={styles.panel__actions}>
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    loading={busyId === item.id}
                                                    disabled={busyId !== null}
                                                    onClick={() => handleAccept(item)}
                                                >
                                                    {t('pending_approval_accept')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busyId !== null}
                                                    onClick={() => setSuggestItem(item)}
                                                >
                                                    {t('pending_approval_suggest')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={busyId !== null}
                                                    onClick={() => handleReject(item)}
                                                >
                                                    {t('pending_approval_reject')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className={styles.panel__status}>
                                                <Icon name="PENDING" size="0.85rem" />
                                                {t('pending_approval_status_alternative')}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            )}
            <PendingBookingBanner
                count={pendingItems.length}
                expanded={expanded}
                loading={loading}
                onToggle={() => setExpanded((prev) => !prev)}
            />
            <AlternativeSlotPicker
                item={suggestItem}
                onClose={() => setSuggestItem(null)}
                onSubmit={handleSuggestSubmit}
            />
        </>
    );
};
