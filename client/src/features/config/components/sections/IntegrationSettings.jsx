import React from 'react';
import shared from '@/styles/shared.module.css';

// Feature Molecules
import { IntegrationGoogleCalendar } from '@/features/config/components/sections/IntegrationGoogleCalendar';
import { IntegrationMetaWhatsApp } from '@/features/config/components/sections/IntegrationMetaWhatsApp';
import { IntegrationRemoteAccess } from '@/features/config/components/sections/IntegrationRemoteAccess';

/**
 * IntegrationSettings Feature Organism.
 * Orchestrates third-party service configurations within the config domain.
 */
export const IntegrationSettings = ({
    user,
    settings,
    updateSetting,
    loading,
    googleUnlinked,
    onGoogleAuth,
    onDisconnectGoogle,
    onRefreshToken,
    onRetryGoogle,
    onRefreshTunnel,
    onTestMeta,
    onShowQr
}) => {
    // Shared authorization logic for integration management
    const isAuthorized = user?.role === 'admin' || user?.role === 'secretary';

    return (
        <div className={`${shared.TabPanel} ${shared.AnimateFadeIn}`}>
            <IntegrationGoogleCalendar
                googleUnlinked={googleUnlinked}
                settings={settings}
                updateSetting={updateSetting}
                onGoogleAuth={onGoogleAuth}
                onDisconnectGoogle={onDisconnectGoogle}
                onRefreshToken={onRefreshToken}
                onRetryGoogle={onRetryGoogle}
                loading={loading}
            />

            <IntegrationMetaWhatsApp
                settings={settings}
                updateSetting={updateSetting}
                onTestMeta={onTestMeta}
                loading={loading}
                isAuthorized={isAuthorized}
            />

            <IntegrationRemoteAccess
                settings={settings}
                updateSetting={updateSetting}
                onRefreshTunnel={onRefreshTunnel}
                onShowQr={onShowQr}
                loading={loading}
                isAuthorized={isAuthorized}
            />
        </div>
    );
};

