import React from 'react';
import { Icon } from '@/components/atoms/Icon';

/**
 * WhatsappChatPlaceholder Molecule.
 * Renders the empty state when no chat is selected in the WhatsApp messenger.
 */
const WhatsappChatPlaceholder = ({ t }) => {
    return (
        <div className="global-wa-messenger__placeholder">
            <div className="global-wa-messenger__placeholder-icon">
                <Icon name="whatsapp" size="4rem" />
            </div>
            <h3>{t('select_chat_title')}</h3>
            <p>{t('select_chat_desc')}</p>
        </div>
    );
};

export default WhatsappChatPlaceholder;
