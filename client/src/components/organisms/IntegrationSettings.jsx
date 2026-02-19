import React from 'react';

// Molecules
import IntegrationGoogleCalendar from '../molecules/IntegrationGoogleCalendar';
import IntegrationMetaWhatsApp from '../molecules/IntegrationMetaWhatsApp';
import IntegrationRemoteAccess from '../molecules/IntegrationRemoteAccess';

/**
 * IntegrationSettings Organism.
 * Orchestrates various third-party integration settings sections.
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
    // Both admin and secretary can manage these integrations
    const isAuthorized = user.role === 'admin' || user.role === 'secretary';

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
