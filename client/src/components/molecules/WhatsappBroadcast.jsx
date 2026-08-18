import React from 'react';
import { api } from '@/api/axios';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './WhatsappBroadcast.module.css';

const FILTERS = ['last_12_months', 'all'];

const initialState = {
    filter: 'last_12_months',
    message: '',
    recipientCount: null,
    loadingCount: false,
    confirming: false,
    sending: false,
    result: null,
    error: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_FILTER': return { ...state, filter: action.payload, result: null };
        case 'SET_MESSAGE': return { ...state, message: action.payload };
        case 'SET_COUNT': return { ...state, recipientCount: action.payload, loadingCount: false };
        case 'SET_LOADING_COUNT': return { ...state, loadingCount: action.payload };
        case 'SET_CONFIRMING': return { ...state, confirming: action.payload };
        case 'SET_SENDING': return { ...state, sending: action.payload };
        case 'SET_RESULT': return { ...state, result: action.payload, sending: false, confirming: false };
        case 'SET_ERROR': return { ...state, error: action.payload, sending: false };
        default: return state;
    }
}

export const WhatsappBroadcast = ({ t }) => {
    const [state, dispatch] = React.useReducer(reducer, initialState);
    const { filter, message, recipientCount, loadingCount, confirming, sending, result, error } = state;

    const fetchCount = React.useCallback(async (currentFilter) => {
        dispatch({ type: 'SET_LOADING_COUNT', payload: true });
        try {
            const res = await api.post('/whatsapp/broadcast-preview', { filter: currentFilter });
            dispatch({ type: 'SET_COUNT', payload: res.data.count });
        } catch (err) {
            console.error('[Broadcast] Failed to fetch count:', err);
            dispatch({ type: 'SET_COUNT', payload: null });
        }
    }, []);

    React.useEffect(() => {
        fetchCount(filter);
    }, [filter, fetchCount]);

    const handleFilterChange = (e) => {
        dispatch({ type: 'SET_FILTER', payload: e.target.value });
    };

    const handleSendClick = () => {
        if (!message.trim()) {
            dispatch({ type: 'SET_ERROR', payload: t('broadcast_empty_message') });
            return;
        }
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_CONFIRMING', payload: true });
    };

    const handleConfirm = async () => {
        dispatch({ type: 'SET_SENDING', payload: true });
        try {
            const res = await api.post('/whatsapp/broadcast-direct', { message, filter });
            dispatch({ type: 'SET_RESULT', payload: res.data.results });
        } catch (err) {
            console.error('[Broadcast] Send failed:', err);
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || err.message });
        }
    };

    const previewMessage = message
        ? message.replace(/\{patient_name\}/gi, 'Juan Pérez')
        : '';

    const countLabel = loadingCount
        ? '...'
        : recipientCount !== null
            ? t('broadcast_recipients_count').replace('{count}', recipientCount)
            : '-';

    if (result) {
        return (
            <div className={styles.WhatsappBroadcast__root}>
                <div className={styles.WhatsappBroadcast__resultCard}>
                    <Icon name="check_circle" size="3rem" className={styles.WhatsappBroadcast__resultIcon} />
                    <h3 className={styles.WhatsappBroadcast__resultTitle}>
                        {t('broadcast_success_summary')
                            .replace('{success}', result.success.length)
                            .replace('{failed}', result.failed.length)}
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: 'SET_RESULT', payload: null })}
                    >
                        {t('broadcast_confirm_no')}
                    </Button>
                </div>
            </div>
        );
    }

    if (confirming) {
        return (
            <div className={styles.WhatsappBroadcast__root}>
                <div className={styles.WhatsappBroadcast__confirmCard}>
                    <Icon name="warning" size="2.5rem" className={styles.WhatsappBroadcast__confirmIcon} />
                    <h3 className={styles.WhatsappBroadcast__confirmTitle}>{t('broadcast_confirm_title')}</h3>
                    <p className={styles.WhatsappBroadcast__confirmDesc}>
                        {t('broadcast_confirm_desc').replace('{count}', recipientCount ?? '?')}
                    </p>
                    <div className={styles.WhatsappBroadcast__confirmActions}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dispatch({ type: 'SET_CONFIRMING', payload: false })}
                            disabled={sending}
                        >
                            {t('broadcast_confirm_no')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleConfirm}
                            disabled={sending}
                            icon={sending ? <Icon name="progress_activity" size="1rem" className={styles.WhatsappBroadcast__spin} /> : null}
                        >
                            {sending ? t('broadcast_sending') : t('broadcast_confirm_yes')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.WhatsappBroadcast__root}>
            {/* Filter selector */}
            <div className={styles.WhatsappBroadcast__field}>
                <label className={styles.WhatsappBroadcast__label}>
                    <Icon name="group" size="1rem" />
                    {t('broadcast_filter_label')}
                </label>
                <div className={styles.WhatsappBroadcast__filterRow}>
                    <select
                        className={styles.WhatsappBroadcast__select}
                        value={filter}
                        onChange={handleFilterChange}
                    >
                        {FILTERS.map(f => (
                            <option key={f} value={f}>
                                {f === 'last_12_months'
                                    ? t('broadcast_filter_last12')
                                    : t('broadcast_filter_all')}
                            </option>
                        ))}
                    </select>
                    <span className={styles.WhatsappBroadcast__countBadge}>{countLabel}</span>
                </div>
            </div>

            {/* Message textarea */}
            <div className={styles.WhatsappBroadcast__field}>
                <label className={styles.WhatsappBroadcast__label}>
                    <Icon name="edit" size="1rem" />
                    {t('broadcast_message_label')}
                </label>
                <textarea
                    className={styles.WhatsappBroadcast__textarea}
                    rows={5}
                    placeholder={t('broadcast_message_placeholder')}
                    value={message}
                    onChange={(e) => dispatch({ type: 'SET_MESSAGE', payload: e.target.value })}
                />
                <p className={styles.WhatsappBroadcast__hint}>
                    <Icon name="info" size="0.85rem" />
                    {t('broadcast_personalization_hint')}
                </p>
            </div>

            {/* Preview */}
            {previewMessage && (
                <div className={styles.WhatsappBroadcast__field}>
                    <span className={styles.WhatsappBroadcast__label}>
                        <Icon name="visibility" size="1rem" />
                        {t('broadcast_preview_label')}
                    </span>
                    <div className={styles.WhatsappBroadcast__preview}>{previewMessage}</div>
                </div>
            )}

            {/* Error */}
            {error && <p className={styles.WhatsappBroadcast__errorMsg}>{error}</p>}

            {/* Send button */}
            <Button
                variant="success"
                className={styles.WhatsappBroadcast__sendBtn}
                onClick={handleSendClick}
                disabled={!message.trim() || recipientCount === 0}
                icon={<Icon name="campaign" size="1.1rem" />}
            >
                {t('broadcast_send_btn').replace('{count}', recipientCount ?? '?')}
            </Button>
        </div>
    );
};
