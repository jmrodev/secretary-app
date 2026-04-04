import React from 'react';

// Feature Molecules
import IntegrationGoogleCalendar from './IntegrationGoogleCalendar';
import IntegrationMetaWhatsApp from './IntegrationMetaWhatsApp';
import IntegrationRemoteAccess from './IntegrationRemoteAccess';

/**
 * IntegrationSettings Feature Organism.
 * Orchestrates third-party service configurations within the config domain.
 */
const IntegrationSettings = ({
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
    onTestMeta
}) => {
    // Shared authorization logic for integration management
    const isAuthorized = user?.role === 'admin' || user?.role === 'secretary';

    return (
        <div className="tab-panel animate-fadeIn">
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
                loading={loading}
                isAuthorized={isAuthorized}
            />
        </div>
    );
};

export default IntegrationSettings;
