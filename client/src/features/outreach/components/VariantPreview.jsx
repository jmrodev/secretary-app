import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/atoms/Button';
import styles from './VariantPreview.module.css';

/**
 * VariantPreview — Step 3 of the outreach flow.
 *
 * Shows 3 message variant cards side by side with a send CTA.
 * Each card displays: header (bold), body (regular), footer (muted).
 */
export const VariantPreview = ({
    variants = [],
    patients = [],
    onSend,
    sending = false,
    sendResult = null
}) => {
    const { t } = useLanguage();
    const hasVariants = variants.length > 0;
    const hasPatients = patients.length > 0;
    const canSend = hasVariants && hasPatients && !sending;

    return (
        <section className={styles['variant-preview']}>
            <h3 className={styles['variant-preview__title']}>
                {t('outreach_step_3')}
            </h3>

            {!hasVariants && (
                <div className={styles['variant-preview__empty']}>
                    {t('outreach_variant_preview_header')}
                </div>
            )}

            {hasVariants && (
                <>
                    <div className={styles['variant-preview__grid']}>
                        {variants.map((variant, i) => (
                            <article key={i} className={styles['variant-preview__card']}>
                                <span className={styles['variant-preview__card-number']}>
                                    {t('outreach_variant_title', { number: i + 1 })}
                                </span>
                                <p className={styles['variant-preview__header']}>
                                    {variant.header}
                                </p>
                                <p className={styles['variant-preview__body']}>
                                    {variant.body}
                                </p>
                                <p className={styles['variant-preview__footer']}>
                                    {variant.footer}
                                </p>
                            </article>
                        ))}
                    </div>

                    <div className={styles['variant-preview__actions']}>
                        {!hasPatients && (
                            <p className={styles['variant-preview__no-patients']}>
                                {t('outreach_variant_no_patients')}
                            </p>
                        )}

                        <Button
                            onClick={onSend}
                            disabled={!canSend}
                            loading={sending}
                        >
                            {sending
                                ? t('outreach_variant_sending')
                                : t('outreach_variant_send', { count: patients.length })
                            }
                        </Button>
                    </div>
                </>
            )}

            {sendResult && (
                <div
                    className={styles['variant-preview__result']}
                    role="status"
                >
                    <span className={`${styles['variant-preview__result-icon']} ${sendResult.total_failed > 0 ? styles['variant-preview__result-icon--failed'] : styles['variant-preview__result-icon--success']}`}>
                    </span>
                    <div>
                        <p className={styles['variant-preview__result-title']}>
                            {t('outreach_variant_sent')}
                        </p>
                        <p className={styles['variant-preview__result-detail']}>
                            {t('outreach_variant_sent_detail')}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};
