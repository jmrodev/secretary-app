import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import PatientManagerModal from './PatientManagerModal';

const GoogleSanitizer = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // Editor State
    // Editor State
    const [editingAppt, setEditingAppt] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // State for filtering
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1st of current month
        end: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0] // Next 2 months
    });
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchDoctors();
        fetchAuditData();
    }, []); // Initial load

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get('/users/doctors');
            setDoctors(data);
        } catch (e) {
            console.error(e);
            toast.error("Error al cargar lista de doctores");
        }
    };

    const fetchAuditData = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: dateRange.start,
                end_date: dateRange.end
            };
            if (selectedDoctor) params.doctor_id = selectedDoctor;

            const { data } = await api.get('/google/audit-appointments', { params });
            setAppointments(data);
            setCurrentPage(1);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar auditoría");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (appt) => {
        setEditingAppt(appt);
        setEditModalOpen(true);
    };

    const handleUpdateSuccess = (updatedPatient) => {
        toast.success("Paciente Actualizado/Linkeado");
        fetchAuditData(); // Refresh list to show updated state
    };

    // Helper to detect messy names (digits in name usually means title copy-paste)
    const isMessy = (name) => {
        return name && /\d/.test(name);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = appointments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(appointments.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    if (!token) {
        return <div className="p-4 text-center text-red-600">Error: No se encontró token de autenticación. Por favor inicie sesión nuevamente.</div>;
    }

    if (loading) return (
        <div className="card text-center p-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-muted font-medium">Buscando turnos en Google Calendar...</p>
        </div>
    );

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                    🛠️
                </div>
                <div>
                    <h2 className="text-xl font-bold text-main-800">Saneador de Turnos</h2>
                    <p className="text-sm text-muted">Auditoría y corrección de sincronización con Google Calendar.</p>
                </div>
            </div>

            {/* FILTERS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="input-label text-xs uppercase tracking-wider mb-1">Profesional</label>
                        <select
                            className="input-field bg-white"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                        >
                            <option value="">-- Todos los Doctores --</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-40">
                        <label className="input-label text-xs uppercase tracking-wider mb-1">Desde</label>
                        <input
                            type="date"
                            className="input-field bg-white"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>

                    <div className="w-40">
                        <label className="input-label text-xs uppercase tracking-wider mb-1">Hasta</label>
                        <input
                            type="date"
                            className="input-field bg-white"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={fetchAuditData}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? '⏳' : '🔍 Buscar'}
                    </button>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editModalOpen && editingAppt && (
                <PatientManagerModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingAppt(null);
                    }}
                    patient={{
                        ...editingAppt,
                        id: editingAppt.patient_id, // Map patient_id to id for the form
                        // Ensure fields match what PatientForm expects if names differ
                        // PatientForm expects: full_name, dni, phone, email...
                        // editingAppt (from query) likely has these matching names.
                    }}
                    onUpdate={handleUpdateSuccess}
                    comparisonData={editingAppt.google_data}
                    isSanitizeMode={true}
                    // Optionally pass doctors if needed, or let Modal fetch them
                    doctors={doctors}
                />
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold text-main-500 uppercase text-xs">Horario</th>
                            <th className="py-3 px-4 text-left font-bold text-main-500 uppercase text-xs w-1/3">APP (Local)</th>
                            <th className="py-3 px-4 text-left font-bold text-main-500 uppercase text-xs w-1/3">GOOGLE (Nube)</th>
                            <th className="py-3 px-4 text-center font-bold text-main-500 uppercase text-xs">Estado</th>
                            <th className="py-3 px-4 text-center font-bold text-main-500 uppercase text-xs">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.map((appt) => {
                            const googleData = appt.google_data;
                            const isExactMatch = googleData && googleData.start &&
                                new Date(googleData.start).getTime() === new Date(appt.appointment_date).getTime();
                            const isGhost = appt.suggested_match; // Found by time, not ID

                            return (
                                <tr key={appt.id} className={`hover:bg-slate-50 transition-colors ${isMessy(appt.full_name) ? "bg-red-50/50" : ""}`}>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="font-mono text-main-600 font-medium">
                                            {new Date(appt.appointment_date).toLocaleDateString()}
                                        </div>
                                        <div className="font-bold text-main-800 text-lg">
                                            {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>

                                    {/* APP SIDE */}
                                    <td className="py-3 px-4 align-top">
                                        <div className="font-bold text-main-800">{appt.full_name || <span className="text-red-400 italic">Desconocido</span>}</div>
                                        {appt.reason && <div className="text-xs text-main-500 mt-1">{appt.reason}</div>}
                                        {isMessy(appt.full_name) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-bold mt-2">
                                                🧼 Requiere Limpieza
                                            </span>
                                        )}
                                    </td>

                                    {/* GOOGLE SIDE */}
                                    <td className="py-3 px-4 align-top border-l border-slate-100 bg-slate-50/30">
                                        {googleData ? (
                                            <div>
                                                <div className="font-bold text-emerald-700">{googleData.summary || '(Sin Título)'}</div>
                                                <div className="text-[10px] text-muted font-mono mt-1 line-clamp-2" title={googleData.description}>
                                                    {googleData.description ? googleData.description.substring(0, 80) + '...' : '(Sin descripción)'}
                                                </div>
                                                {!isExactMatch && !isGhost && (
                                                    <div className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
                                                        ⏰ Hora diferente
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted italic text-xs">No encontrado en nube</span>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-3 px-4 text-center align-middle">
                                        {appt.google_event_id && googleData ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                                Enlazado
                                            </span>
                                        ) : isGhost ? (
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                                Coincidencia
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                Solo App
                                            </span>
                                        )}
                                    </td>

                                    <td className="py-3 px-4 text-center align-middle">
                                        <button
                                            onClick={() => handleEdit(appt)}
                                            className="btn btn-secondary py-1 px-3 text-xs h-auto shadow-sm"
                                        >
                                            {isGhost ? '🔗 Enlazar' : '✏️ Editar'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {appointments.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-muted">
                                    <div className="text-4xl mb-2">🤷‍♂️</div>
                                    No hay turnos para mostrar en este rango.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {appointments.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`btn btn-secondary py-1 px-4 text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        ← Anterior
                    </button>
                    <span className="text-sm font-medium text-main-600 bg-slate-100 px-3 py-1 rounded-full">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`btn btn-secondary py-1 px-4 text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleSanitizer;
