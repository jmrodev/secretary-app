import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
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
    const navigate = useNavigate();
    const { pendingItems, loading, accept, suggestAlternative, reject } = usePendingApproval();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [suggestItem, setSuggestItem] = useState(null);

    const handleViewInAgenda = (item) => {
        navigate('/appointments', {
            state: {
                selectedDate: item.requested_slot_date,
                viewDoctorId: String(item.doctor_id)
            }
        });
    };

    const handleOpenChat = (item) => {
        window.dispatchEvent(
            new CustomEvent('whatsapp:open-chat', {
                detail: {
                    phone: item.patient_phone,
                    patientId: item.patient_id || item.id,
                    patientName: item.patient_name
                }
            })
        );
    };

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
                <aside className={styles.PendingApprovalQueue} aria-label={t('pending_approval_title')}>
                    <header className={styles.PendingApprovalQueue__header}>
                        <h4 className={styles.PendingApprovalQueue__title}>
                            <Icon name="NOTIFICATIONS" size="1rem" />
                            {t('pending_approval_title')}
                        </h4>
                        <Icon
                            name="EXPAND_LESS"
                            size="1.2rem"
                            className={styles.PendingApprovalQueue__collapse}
                            onIconClick={() => setExpanded(false)}
                        />
                    </header>
                    <div className={styles.PendingApprovalQueue__body}>
                        {loading ? (
                            <Loading variant="centered" size="sm" />
                        ) : pendingItems.length === 0 ? (
                            <p className={styles.PendingApprovalQueue__empty}>{t('pending_approval_empty')}</p>
                        ) : (
                            <ul className={styles.PendingApprovalQueue__list}>
                                {pendingItems.map((item) => (
                                    <li key={item.id} className={styles.PendingApprovalQueue__item}>
                                        <div className={styles.PendingApprovalQueue__info}>
                                            <div className={styles.PendingApprovalQueue__headerRow}>
                                                <strong className={styles.PendingApprovalQueue__patient}>{item.patient_name}</strong>
                                                <span className={styles.PendingApprovalQueue__doctor}>
                                                    <Icon name="DOCTORS" size="0.85rem" />
                                                    {item.doctor_name}
                                                </span>
                                            </div>

                                            {item.patient_message && (
                                                <div className={styles.PendingApprovalQueue__messageQuote} title={t('pending_approval_patient_message')}>
                                                    <Icon name="CHAT" size="0.85rem" className={styles.PendingApprovalQueue__quoteIcon} />
                                                    <p className={styles.PendingApprovalQueue__quoteText}>"{item.patient_message}"</p>
                                                </div>
                                            )}

                                            <div className={styles.PendingApprovalQueue__slotRow}>
                                                <span className={styles.PendingApprovalQueue__slotLabel}>
                                                    <Icon name="AUTO_AWESOME" size="0.85rem" />
                                                    {t('pending_approval_suggested_slot')}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.PendingApprovalQueue__slotLink}
                                                    onClick={() => handleViewInAgenda(item)}
                                                    title={t('pending_approval_view_in_agenda')}
                                                >
                                                    <Icon name="CALENDAR" size="0.85rem" />
                                                    {formatDate(
                                                        new Date(`${item.requested_slot_date}T${item.requested_slot_time}:00`),
                                                        { monthName: true }
                                                    )} · {item.requested_slot_time} hs
                                                </button>
                                            </div>
                                        </div>
                                        {item.status === 'pending' ? (
                                            <div className={styles.PendingApprovalQueue__actions}>
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
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={styles.PendingApprovalQueue__chatBtn}
                                                    onClick={() => handleOpenChat(item)}
                                                    title={t('pending_approval_view_chat')}
                                                    icon={<Icon name="CHAT" size="0.9rem" />}
                                                >
                                                    {t('pending_approval_view_chat')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className={styles.PendingApprovalQueue__status}>
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
