
import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';

const PendingClosuresModal = ({ isOpen, onClose, pendingClosures, duplicateClosures, onAutoClosure, onFixDuplicates, t }) => {
    // pendingClosures is array of { date, balance, doctor_id, lastTime }
    const [processingDate, setProcessingDate] = React.useState(null);

    const handleClosure = async (day) => {
        if (processingDate) return;
        setProcessingDate(day.date);
        await onAutoClosure(day);
        setProcessingDate(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Cajas Pendientes de Entrega (${pendingClosures.length})`}
            size="lg"
        >
            <div className="flex flex-col gap-4">
                {duplicateClosures && duplicateClosures.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md relative flex flex-col gap-2">
                        <div className="font-bold flex items-center gap-2">
                            ⚠️ Se detectaron {duplicateClosures.length} días con múltiples cierres automáticos.
                        </div>
                        <p className="text-sm">Esto puede deberse a clics repetidos. El sistema puede fusionarlos dejando solo el último.</p>
                        <Button
                            size="sm"
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white w-fit"
                            onClick={onFixDuplicates}
                        >
                            Corregir Duplicados Automáticamente
                        </Button>
                    </div>
                )}

                <p className="text-sm text-gray-600">
                    A continuación se muestran los días que tienen un saldo pendiente (Efectivo o Transferencias) sin retirar.
                    Puede hacer clic en "Entregar" para registrar automáticamente el cierre de ambos saldos.
                </p>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Saldo Caja</th>
                                <th className="px-6 py-3">Saldo Virtual</th>
                                <th className="px-6 py-3">Último Mov.</th>
                                <th className="px-6 py-3">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingClosures.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        ¡Todo al día! No hay cierres pendientes.
                                    </td>
                                </tr>
                            ) : (
                                pendingClosures.map((day) => (
                                    <tr key={day.date} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {day.date}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            ${day.balance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            ${(day.transferBalance || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {day.lastTime}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                size="sm"
                                                variant={processingDate === day.date ? "ghost" : "primary"}
                                                onClick={() => handleClosure(day)}
                                                disabled={!!processingDate}
                                                title="Registrar retiro de ambos saldos"
                                            >
                                                {processingDate === day.date ? "Procesando..." : "Entregar / Cerrar"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onFixDuplicates}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Usar si hay múltiples cierres el mismo día"
                    >
                        🛠️ Limpiar Duplicados (Forzar)
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PendingClosuresModal;
