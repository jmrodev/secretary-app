
import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

const DoctorGoogleSettings = ({
    connected,
    onConnect,
    onDisconnect,
    onVerifyCalendar,
    onImportContacts,
    onResetSpreadsheet,
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
                    <div className="flex flex-col gap-2 w-full">
                        <Button variant="primary" className="w-full py-3" onClick={onConnect}>🔗 Conectar Cuenta G-Suite</Button>
                        <p className="text-[10px] text-slate-400 text-center italic">
                            * Asegúrate de estar logueado en la cuenta de Google del doctor en este navegador antes de conectar.
                        </p>
                    </div>
                ) : (
                    <Button variant="outline-danger" className="w-full py-3" onClick={onDisconnect}>❌ Desvincular Cuenta</Button>
                )}
            </div>

            {connected && (
                <div className="grid grid-cols-1 gap-2">
                    <Button variant="secondary" className="text-sm" onClick={onVerifyCalendar}>📅 Verificar Turnos en Calendar</Button>
                    <Button variant="accent" className="text-sm" onClick={onImportContacts}>📥 Sincronizar Contactos</Button>
                    <hr className="my-2 opacity-10" />
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-[11px] text-amber-700 mb-2 font-medium">
                            ⚠️ ¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
                        </p>
                        <Button variant="ghost" className="text-xs w-full text-amber-600 hover:bg-amber-100" onClick={onResetSpreadsheet}>
                            ♻️ Re-generar Planilla de Finanzas
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorGoogleSettings;
