
import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';

import './PendingClosuresModal.css';

const PendingClosuresModal = ({ isOpen, onClose, pendingClosures, duplicateClosures, onAutoClosure, onCloseAll, onFixDuplicates, t }) => {
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
            <div className="pending-closures-container">
                {duplicateClosures && duplicateClosures.length > 0 && (
                    <div className="pending-closures-alert">
                        <div className="pending-closures-alert__title">
                            ⚠️ Se detectaron {duplicateClosures.length} cierres duplicados (mismo día y método).
                        </div>
                        <p>Esto ocurre si se procesó la entrega más de una vez para el mismo método de pago. El sistema puede fusionarlos dejando solo el último.</p>
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

                <div className="pending-closures-header-actions">
                    <p className="pending-closures-description">
                        A continuación se muestran los días que tienen un saldo pendiente (Efectivo o Transferencias) sin retirar.
                    </p>
                    {pendingClosures.length > 1 && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onCloseAll}
                            className="pending-closures-btn-all"
                        >
                            🚀 Entregar Todo el Mes ({pendingClosures.length} días)
                        </Button>
                    )}
                </div>

                <div className="pending-closures-table-container">
                    <table className="pending-closures-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Saldo Caja</th>
                                <th>Saldo Virtual</th>
                                <th>Último Mov.</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingClosures.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="pending-closures-table__empty">
                                        ¡Todo al día! No hay cierres pendientes.
                                    </td>
                                </tr>
                            ) : (
                                pendingClosures.map((day) => (
                                    <tr key={day.date}>
                                        <td className="pending-closures-table__date">
                                            {day.date}
                                        </td>
                                        <td className="pending-closures-table__balance--cash">
                                            ${day.balance.toLocaleString()}
                                        </td>
                                        <td className="pending-closures-table__balance--virtual">
                                            ${(day.transferBalance || 0).toLocaleString()}
                                        </td>
                                        <td className="pending-closures-table__last-time">
                                            {day.lastTime}
                                        </td>
                                        <td>
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

                <div className="pending-closures-footer">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onFixDuplicates}
                        className="pending-closures-footer__btn-fix"
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
