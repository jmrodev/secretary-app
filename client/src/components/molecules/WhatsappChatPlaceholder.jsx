import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './WhatsappChatPlaceholder.module.css';

/**
 * WhatsappChatPlaceholder Molecule.
 * Renders the empty state when no chat is selected in the WhatsApp messenger.
 */
const WhatsappChatPlaceholder = ({ t }) => {
    return (
        <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>
                <Icon name="whatsapp" size="4rem" />
            </div>
            <h3>{t('select_chat_title')}</h3>
            <p>{t('select_chat_desc')}</p>
        </div>
    );
};

export default WhatsappChatPlaceholder;
