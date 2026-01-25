import React from 'react';
import { useInstitutionFinances } from '../../hooks/useInstitutionFinances';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Modal from '../molecules/Modal';
import StatCard from '../molecules/StatCard'; // Reusing StatCard if suitable, or simple cards

const InstitutionFinances = ({ institutions }) => {
    const {
        selectedInstId,
        setSelectedInstId,
        report,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    } = useInstitutionFinances(institutions);

    return (
        <div className="flex flex-col gap-4">
            <div className="card p-4 bg-slate-50 flex items-center gap-4">
                <label className="font-bold text-main-800">Seleccionar Institución:</label>
                <select
                    className="input-field max-w-xs"
                    value={selectedInstId}
                    onChange={e => setSelectedInstId(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {institutions.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            {loadingReport && <div className="text-center py-4">Cargando reporte ({loadingReport})...</div>}

            {report && (
                <div className="flex flex-col gap-4 animate-fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* We can use StatCard here if we want consistent look */}
                        <div className="card bg-blue-50 border-blue-100 p-4 rounded-xl">
                            <h3 className="text-blue-800 font-bold text-lg mb-1">Total Histórico</h3>
                            <p className="text-3xl text-blue-600 font-black">${report.total_amount}</p>
                        </div>
                        <div className="card bg-red-50 border-red-100 p-4 rounded-xl">
                            <h3 className="text-red-800 font-bold text-lg mb-1">Pendiente de Pago</h3>
                            <p className="text-3xl text-red-600 font-black">${report.total_pending}</p>
                        </div>
                        <div className="flex items-center">
                            <Button
                                className="w-full h-full py-4 text-lg shadow-md"
                                onClick={() => setIsPayModalOpen(true)}
                                disabled={Number(report.total_pending) <= 0}
                            >
                                💰 Registrar Pago
                            </Button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="card overflow-x-auto">
                        <h3 className="title text-base mb-4">Detalle de Movimientos</h3>
                        <table className="table-base w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Paciente</th>
                                    <th>Doctor</th>
                                    <th>Estado Turno</th>
                                    <th>Monto</th>
                                    <th>Estado Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.transactions.map(t => (
                                    <tr key={t.transaction_id}>
                                        <td>{new Date(t.transaction_date).toLocaleString()}</td>
                                        <td className="font-medium">{t.patient_name || 'N/A'}</td>
                                        <td>{t.doctor_name || 'N/A'}</td>
                                        <td>
                                            <Badge variant={t.appointment_status === 'completed' ? 'green' : 'gray'}>
                                                {t.appointment_status || 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="font-mono">${t.amount}</td>
                                        <td>
                                            <Badge variant={t.payment_status === 'paid' ? 'green' : 'red'}>
                                                {t.payment_status === 'paid' ? 'Pagado' : 'Pendiente/Deuda'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                                {report.transactions.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-4 text-muted">No hay movimientos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                title="Registrar Pago de Institución"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-main-600 bg-blue-50 p-3 rounded border border-blue-100">
                        ℹ️ Se aplicará el pago a las deudas más antiguas de la institución.
                    </p>
                    <div className="input-group">
                        <label className="input-label">Monto a Pagar</label>
                        <input
                            type="number"
                            className="input-field"
                            value={paymentData.amount}
                            onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Método de Pago</label>
                        <select
                            className="input-field"
                            value={paymentData.method}
                            onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                        >
                            <option value="transfer">Transferencia</option>
                            <option value="cash">Efectivo</option>
                            <option value="check">Cheque</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handlePaymentSubmit}
                            disabled={!paymentData.amount || Number(paymentData.amount) <= 0}
                        >
                            Confirmar Pago
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InstitutionFinances;
