import React from 'react';
import api from '@/api/axios';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './WhatsappBroadcast.module.css';

const FILTERS = ['last_12_months', 'all', 'upcoming', 'year_to_date', 'month', 'attended', 'ever'];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const initialState = {
    filter: 'last_12_months',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    maxLimit: '50',
    message: '',
    recipientCount: null,
    recipients: [],
    loadingCount: false,
    confirming: false,
    sending: false,
    result: null,
    error: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_FILTER': return { ...state, filter: action.payload, result: null };
        case 'SET_MONTH': return { ...state, month: Number(action.payload) };
        case 'SET_YEAR': return { ...state, year: Number(action.payload) };
        case 'SET_LIMIT': return { ...state, maxLimit: action.payload };
        case 'SET_MESSAGE': return { ...state, message: action.payload };
        case 'SET_PREVIEW_DATA': return { ...state, recipientCount: action.payload.count, recipients: action.payload.recipients || [], loadingCount: false };
        case 'SET_LOADING_COUNT': return { ...state, loadingCount: action.payload };
        case 'SET_CONFIRMING': return { ...state, confirming: action.payload };
        case 'SET_SENDING': return { ...state, sending: action.payload };
        case 'SET_RESULT': return { ...state, result: action.payload, sending: false, confirming: false };
        case 'SET_ERROR': return { ...state, error: action.payload, sending: false };
        default: return state;
    }
}

const filterKey = (f) => `broadcast_filter_${f}`;

export const WhatsappBroadcast = ({ t }) => {
    const [state, dispatch] = React.useReducer(reducer, {
        ...initialState,
        message: t('broadcast_default_template'),
    });
    const { filter, month, year, maxLimit, message, recipientCount, recipients, loadingCount, confirming, sending, result, error } = state;

    const fetchCount = React.useCallback(async (currentFilter, m, y, limitStr) => {
        dispatch({ type: 'SET_LOADING_COUNT', payload: true });
        try {
            const body = { 
                filter: currentFilter, 
                limit: limitStr === 'all' ? 0 : Number(limitStr) 
            };
            if (currentFilter === 'month') {
                body.month = m;
                body.year = y;
            }
            const res = await api.post('/whatsapp/broadcast-preview', body);
            dispatch({ 
                type: 'SET_PREVIEW_DATA', 
                payload: { count: res.data.count, recipients: res.data.recipients } 
            });
        } catch (err) {
            console.error('[Broadcast] Failed to fetch count:', err);
            dispatch({ type: 'SET_PREVIEW_DATA', payload: { count: null, recipients: [] } });
        }
    }, []);

    React.useEffect(() => {
        queueMicrotask(() => {
            fetchCount(filter, month, year, maxLimit);
        });
    }, [filter, month, year, maxLimit, fetchCount]);

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
            const body = { message, filter, limit: maxLimit === 'all' ? 0 : Number(maxLimit) };
            if (filter === 'month') {
                body.month = month;
                body.year = year;
            }
            const res = await api.post('/whatsapp/broadcast-direct', body);
            dispatch({ type: 'SET_RESULT', payload: res.data.results });
        } catch (err) {
            console.error('[Broadcast] Send failed:', err);
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || err.message });
        }
    };

    const SAMPLE_HEADER = "👋 ¡Hola Juan Pérez! Esperamos que estés muy bien. 🌿";
    const SAMPLE_FOOTER = "Quedamos a disposición ante cualquier consulta. ¡Que tengas un buen día! ✨";

    const previewMessage = message
        ? message.includes('---')
            ? message.split(/[\r\n]*---[\r\n]*/)[0]?.replace(/\{patient_name\}/gi, 'Juan Pérez')
            : `${SAMPLE_HEADER}\n\n${message.replace(/\{patient_name\}/gi, 'Juan Pérez').trim()}\n\n${SAMPLE_FOOTER}`
        : '';

    const countLabel = loadingCount
        ? '...'
        : recipientCount !== null
            ? t('broadcast_recipients_count').replace('{count}', recipientCount)
            : '-';

    if (result) {
        return (
            <div className={styles.root}>
                <div className={styles.resultCard}>
                    <Icon name="check_circle" size="3rem" className={styles.resultIcon} />
                    <h3 className={styles.resultTitle}>
                        {t('broadcast_success_summary')
                            .replace('{success}', result.success.length)
                            .replace('{failed}', result.failed.length)}
                    </h3>

                    {result.success.length > 0 && (
                        <div className={styles.recipientListWrapper}>
                            <h4 className={styles.recipientListTitle}>
                                <Icon name="person" size="0.9rem" /> Enviados ({result.success.length})
                            </h4>
                            <div className={styles.recipientList}>
                                {result.success.map((r, idx) => (
                                    <div key={idx} className={styles.recipientItem}>
                                        <span className={styles.recipientName}>{r.name}</span>
                                        <span className={styles.recipientPhone}>{r.phone}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
            <div className={styles.root}>
                <div className={styles.confirmCard}>
                    <Icon name="warning" size="2.5rem" className={styles.confirmIcon} />
                    <h3 className={styles.confirmTitle}>{t('broadcast_confirm_title')}</h3>
                    <p className={styles.confirmDesc}>
                        {t('broadcast_confirm_desc').replace('{count}', recipientCount ?? '?')}
                    </p>

                    {recipients && recipients.length > 0 && (
                        <div className={styles.recipientListWrapper}>
                            <h4 className={styles.recipientListTitle}>
                                <Icon name="group" size="0.9rem" /> Lista de destinatarios ({recipients.length})
                            </h4>
                            <div className={styles.recipientList}>
                                {recipients.map((r) => (
                                    <div key={r.id || r.phone} className={styles.recipientItem}>
                                        <span className={styles.recipientName}>{r.full_name || 'Paciente'}</span>
                                        <span className={styles.recipientPhone}>{r.phone}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.confirmActions}>
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
                            icon={sending ? <Icon name="progress_activity" size="1rem" className={styles.spin} /> : null}
                        >
                            {sending ? t('broadcast_sending') : t('broadcast_confirm_yes')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <div className={styles.field}>
                <label className={styles.label}>
                    <Icon name="group" size="1rem" />
                    {t('broadcast_filter_label')}
                </label>
                <div className={styles.filterRow}>
                    <select
                        className={styles.select}
                        value={filter}
                        onChange={handleFilterChange}
                    >
                        {FILTERS.map(f => (
                            <option key={f} value={f}>
                                {t(filterKey(f))}
                            </option>
                        ))}
                    </select>
                    <span className={styles.countBadge}>{countLabel}</span>
                </div>
                {filter === 'month' && (
                    <div className={styles.monthRow}>
                        <select
                            className={styles.select}
                            value={month}
                            onChange={(e) => dispatch({ type: 'SET_MONTH', payload: e.target.value })}
                        >
                            {MONTHS.map(m => (
                                <option key={m} value={m}>
                                    {new Date(2000, m - 1).toLocaleString('es', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className={styles.yearInput}
                            value={year}
                            min={2000}
                            max={2100}
                            onChange={(e) => dispatch({ type: 'SET_YEAR', payload: e.target.value })}
                        />
                    </div>
                )}
            </div>
            <div className={styles.field}>
                <label className={styles.label}>
                    <Icon name="tune" size="1rem" />
                    {t('broadcast_limit_label')}
                </label>
                <select
                    className={styles.select}
                    value={maxLimit}
                    onChange={(e) => dispatch({ type: 'SET_LIMIT', payload: e.target.value })}
                >
                    <option value="20">20 pacientes (Recomendado diario)</option>
                    <option value="50">50 pacientes (Por tandas)</option>
                    <option value="100">100 pacientes</option>
                    <option value="all">{t('broadcast_limit_all')}</option>
                </select>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>
                    <Icon name="edit" size="1rem" />
                    {t('broadcast_message_label')}
                </label>
                <textarea
                    className={styles.textarea}
                    rows={5}
                    placeholder={t('broadcast_message_placeholder')}
                    value={message}
                    onChange={(e) => dispatch({ type: 'SET_MESSAGE', payload: e.target.value })}
                />
                <p className={styles.hint}>
                    <Icon name="info" size="0.85rem" />
                    {t('broadcast_personalization_hint')}
                </p>
            </div>

            {previewMessage && (
                <div className={styles.field}>
                    <span className={styles.label}>
                        <Icon name="visibility" size="1rem" />
                        {t('broadcast_preview_label')}
                    </span>
                    <div className={styles.preview}>{previewMessage}</div>
                </div>
            )}

            {error && <p className={styles.errorMsg}>{error}</p>}

            <Button
                variant="success"
                className={styles.sendBtn}
                onClick={handleSendClick}
                disabled={!message.trim() || recipientCount === 0}
                icon={<Icon name="campaign" size="1.1rem" />}
            >
                {t('broadcast_send_btn').replace('{count}', recipientCount ?? '?')}
            </Button>
        </div>
    );
};
