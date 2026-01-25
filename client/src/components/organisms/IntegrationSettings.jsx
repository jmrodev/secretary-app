import React from 'react';
import Button from '../atoms/Button';
import Switch from '../atoms/Switch';

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
    const isAdmin = user.role === 'admin';

    return (
        <div className="tab-panel animate-in">
            {/* GOOGLE INTEGRATION */}
            <div className="card mb-8">
                <h2 className="text-xl font-bold text-main-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span> Integración con Google Calendar
                </h2>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-main-600 mb-2">
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-3 h-3 rounded-full ${googleUnlinked ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></div>
                                <span className="font-medium text-main-700">
                                    Estado: {googleUnlinked ? 'Desconectado' : 'Conectado'}
                                </span>
                            </div>
                        </div>

                        {!googleUnlinked && (
                            <div className="flex flex-col items-end gap-2">
                                <Switch
                                    id="google-sync-toggle"
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                    label={settings.google_sync_enabled === 'false' ? '⏸️ Sincronización PAUSADA' : '✅ Sincronización ACTIVA'}
                                    className="flex-row-reverse gap-3"
                                />
                                <p className="text-xs text-muted text-right">
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                <Button variant="secondary" onClick={onRefreshToken}>
                                    🔄 Refrescar Enlace
                                </Button>
                                <Button
                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                    onClick={onDisconnectGoogle}
                                >
                                    ❌ Desconectar Cuenta
                                </Button>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h4 className="text-sm font-bold text-orange-800 mb-2">¿Problemas de Sincronización?</h4>
                                <p className="text-xs text-orange-700 mb-3">
                                    Si los turnos no se están enviando a Google, puede que haya elementos atascados.
                                </p>
                                <Button
                                    className="bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 text-xs px-3 py-1.5"
                                    onClick={onRetryGoogle}
                                    disabled={loading}
                                >
                                    ⚡ Reintentar Elementos Fallidos
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl transition-all hover:-translate-y-0.5"
                            onClick={onGoogleAuth}
                        >
                            {/* Use a clear accessible label or alt text if it were an image, button text is fine */}
                            <span>Conectar Google Calendar</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* META INTEGRATION */}
            <div className="card mb-8">
                <h3 className="config-section-title">💬 Meta Business (WhatsApp API)</h3>
                <p className="text-muted mb-6">Configure las credenciales de WhatsApp Cloud API.</p>
                <div className="space-y-6">
                    <div className="input-group">
                        <label className="input-label" htmlFor="meta-phone-id">Phone Number ID</label>
                        <input
                            type="text"
                            id="meta-phone-id"
                            className="input-field font-mono text-sm"
                            value={settings.meta_phone_number_id || ''}
                            onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                            disabled={!isAdmin}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="meta-token">Access Token</label>
                        <input
                            type="password"
                            id="meta-token"
                            className="input-field font-mono text-sm"
                            value={settings.meta_access_token || ''}
                            onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                            placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                            disabled={!isAdmin}
                        />
                    </div>
                    <div className="pt-2 flex gap-4">
                        <Button onClick={onTestMeta} disabled={loading || !settings.meta_phone_number_id}>
                            🧪 Probar Conexión
                        </Button>
                        <Button variant="secondary" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}>
                            🛠️ Setup Guide
                        </Button>
                    </div>
                </div>
            </div>

            {/* CLOUDFLARE */}
            <div className="card mb-8">
                <h3 className="config-section-title">🌐 Conectividad Web (Cloudflare)</h3>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex flex-col flex-1 min-w-[280px]">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Estado del Túnel</span>
                        <div className="flex flex-col gap-2">
                            <div className="chip-green status-chip w-fit">Túnel Activo</div>
                            <span className="text-sm font-mono text-main-600 break-all bg-white/50 p-2 rounded border border-slate-100">
                                {settings.public_base_url || 'No detectada'}
                            </span>
                        </div>
                    </div>
                    <Button onClick={onRefreshTunnel} disabled={loading}>
                        🔄 Refrescar Túnel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationSettings;
