
import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

const DoctorGoogleSettings = ({
    connected,
    onConnect,
    onDisconnect,
    onVerifyCalendar,
    onImportContacts,
    confirm
}) => {
    return (
        <div className="doctor-google-settings space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-lg mb-1">Google Integration</h4>
                    <p className="text-sm text-slate-500">Sincroniza calendar y contactos.</p>
                </div>
                <Badge variant={connected ? 'green' : 'gray'}>
                    {connected ? '● CONECTADO' : '○ DESCONECTADO'}
                </Badge>
            </div>

            <div className="flex gap-3">
                {!connected ? (
                    <Button variant="primary" className="w-full py-3" onClick={onConnect}>🔗 Conectar Cuenta G-Suite</Button>
                ) : (
                    <Button variant="outline-danger" className="w-full py-3" onClick={onDisconnect}>❌ Desvincular Cuenta</Button>
                )}
            </div>

            {connected && (
                <div className="grid grid-cols-1 gap-2">
                    <Button variant="secondary" className="text-sm" onClick={onVerifyCalendar}>📅 Verificar Turnos en Calendar</Button>
                    <Button variant="accent" className="text-sm" onClick={onImportContacts}>📥 Sincronizar Contactos</Button>
                </div>
            )}
        </div>
    );
};

export default DoctorGoogleSettings;
