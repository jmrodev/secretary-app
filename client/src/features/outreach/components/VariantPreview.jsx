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
        <section className={styles['VariantPreview__variant-preview']}>
            <h3 className={styles['VariantPreview__title']}>
                {t('outreach_step_3')}
            </h3>

            {!hasVariants && (
                <div className={styles['VariantPreview__empty']}>
                    {t('outreach_variant_preview_header')}
                </div>
            )}

            {hasVariants && (
                <>
                    <div className={styles['VariantPreview__grid']}>
                        {variants.map((variant, i) => (
                            <article key={`variant-${variant.header}-${variant.body}`} className={styles['VariantPreview__card']}>
                                <span className={styles['VariantPreview__card-number']}>
                                    {t('outreach_variant_title', { number: i + 1 })}
                                </span>
                                <p className={styles['VariantPreview__header']}>
                                    {variant.header}
                                </p>
                                <p className={styles['VariantPreview__body']}>
                                    {variant.body}
                                </p>
                                <p className={styles['VariantPreview__footer']}>
                                    {variant.footer}
                                </p>
                            </article>
                        ))}
                    </div>

                    <div className={styles['VariantPreview__actions']}>
                        {!hasPatients && (
                            <p className={styles['VariantPreview__no-patients']}>
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
                    className={styles['VariantPreview__result']}
                    role="status"
                >
                    <span className={`${styles['VariantPreview__result-icon']} ${sendResult.total_failed > 0 ? styles['VariantPreview__result-icon--failed'] : styles['VariantPreview__result-icon--success']}`}>
                    </span>
                    <div>
                        <p className={styles['VariantPreview__result-title']}>
                            {t('outreach_variant_sent')}
                        </p>
                        <p className={styles['VariantPreview__result-detail']}>
                            {t('outreach_variant_sent_detail')}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};
