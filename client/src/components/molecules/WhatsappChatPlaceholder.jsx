import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import styles from '../organisms/GlobalWhatsappMessenger.module.css';

/**
 * WhatsappChatPlaceholder Molecule.
 * Renders the empty state when no chat is selected in the WhatsApp messenger.
 */
export const WhatsappChatPlaceholder = ({ t }) => {
    return (
        <div className={styles.GlobalWhatsappMessenger__placeholder}>
            <div className={styles.GlobalWhatsappMessenger__placeholderIcon}>
                <Icon name="whatsapp" size="4rem" />
            </div>
            <h3>{t('select_chat_title')}</h3>
            <p>{t('select_chat_desc')}</p>
        </div>
    );
};

