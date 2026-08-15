import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Input from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import styles from './MessageComposer.module.css';

/**
 * MessageComposer — Step 2 of the outreach flow.
 *
 * Textarea for composing the message body with character count,
 * and a CTA to generate 3 anti-detection variants.
 */
export const MessageComposer = ({
    body = '',
    onBodyChange,
    onGenerateVariants,
    hasVariants = false,
    showEmptyError = false
}) => {
    const { t } = useLanguage();
    const charCount = body.length;

    return (
        <section className={styles['MessageComposer__message-composer']}>
            <h3 className={styles['MessageComposer__message-composer__title']}>
                {t('outreach_step_2')}
            </h3>

            <div className={styles['MessageComposer__message-composer__form']}>
                <div className={styles['MessageComposer__message-composer__field']}>
                    <label
                        className={styles['MessageComposer__message-composer__label']}
                        htmlFor="outreach-body"
                    >
                        {t('outreach_composer_label')}
                    </label>
                    <div className={styles['MessageComposer__message-composer__input-wrapper']}>
                        <Input
                            id="outreach-body"
                            type="textarea"
                            rows={5}
                            value={body}
                            onChange={(e) => onBodyChange(e.target.value)}
                            placeholder={t('outreach_composer_placeholder')}
                            variant={showEmptyError ? 'error' : 'default'}
                        />
                        <span className={styles['MessageComposer__message-composer__char-count']}>
                            {t('outreach_composer_char_count')}
                        </span>
                    </div>
                </div>

                {showEmptyError && (
                    <div className={styles['MessageComposer__message-composer__error']} role="alert">
                        {t('outreach_composer_empty_error')}
                    </div>
                )}

                <div className={styles['MessageComposer__message-composer__actions']}>
                    <Button
                        onClick={onGenerateVariants}
                        disabled={!body || !body.trim()}
                    >
                        {hasVariants
                            ? t('outreach_composer_regenerate')
                            : t('outreach_composer_generate')
                        }
                    </Button>
                </div>
            </div>

            <p className={styles['MessageComposer__message-composer__hint']}>
                {t('outreach_composer_hint')}
            </p>
        </section>
    );
};
