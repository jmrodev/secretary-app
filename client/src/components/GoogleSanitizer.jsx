import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const GoogleSanitizer = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // Editor State
    const [editingAppt, setEditingAppt] = useState(null);
    const [formData, setFormData] = useState({
        patientName: '',
        patientDni: '',
        patientPhone: '',
        patientEmail: '',
        reason: '',
        status: 'pending',
        paymentStatus: 'none',
        type: 'consultation'
    });

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
            // Remove /api if it's already in the ENV, or adjust logic. 
            // The logs showed .../api/api/..., so removing one /api here.
            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
            const res = await fetch(`${baseUrl}/api/users/doctors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDoctors(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    const fetchAuditData = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: dateRange.start,
                end_date: dateRange.end
            };
            if (selectedDoctor) params.doctor_id = selectedDoctor;

            const queryParams = new URLSearchParams(params);

            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
            const res = await fetch(`${baseUrl}/api/google/audit-appointments?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
                // Reset page on search
                setCurrentPage(1);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar auditoría");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (appt) => {
        setEditingAppt(appt);
        setFormData({
            patientName: appt.full_name || '',
            patientDni: appt.dni || '',
            patientPhone: appt.phone || '',
            patientEmail: appt.email || '',
            reason: appt.reason || '',
            status: appt.status || 'pending',
            paymentStatus: appt.payment_status || 'none',
            type: appt.type || 'consultation'
        });
    };

    const handleSave = async () => {
        if (!editingAppt) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
            const res = await fetch(`${baseUrl}/api/google/sanitize/${editingAppt.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Turno Saneado y Sincronizado");
                setEditingAppt(null);
                fetchAuditData(); // Refresh list to show updated state
            } else {
                toast.error("Error al guardar correcciones");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de red");
        }
    };

    const handleCancel = () => {
        setEditingAppt(null);
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

            {/* EDIT MODE */}
            {editingAppt && (
                <div className="mb-8 animate-in border-2 border-indigo-100 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex justify-between items-center">
                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                            <span>✏️</span> Editando Turno #{editingAppt.id}
                        </h3>
                        <div className="flex gap-2">
                            {editingAppt.google_data && (
                                <button
                                    onClick={() => {
                                        if (!confirm('¿Sobreescribir formulario con datos de Google?')) return;
                                        const g = editingAppt.google_data;
                                        const updates = { ...formData };

                                        // 1. Name
                                        if (g.summary) updates.patientName = g.summary;

                                        // 2. Parse Description
                                        if (g.description) {
                                            const motivoMatch = g.description.match(/Motivo:\s*(.*?)(?:\n|$)/i);
                                            if (motivoMatch) updates.reason = motivoMatch[1].trim();

                                            const phoneMatch = g.description.match(/Teléfono:\s*(.*?)(?:\n|$)/i);
                                            if (phoneMatch && phoneMatch[1] !== 'N/A') updates.patientPhone = phoneMatch[1].trim();

                                            const emailMatch = g.description.match(/Email:\s*(.*?)(?:\n|$)/i);
                                            if (emailMatch && emailMatch[1] !== 'N/A') updates.patientEmail = emailMatch[1].trim();
                                        }
                                        setFormData(updates);
                                        toast.success('Datos importados de Google');
                                    }}
                                    className="btn btn-secondary text-xs py-1 px-2 border-indigo-200 text-indigo-700 bg-white"
                                    title="Usar info de Google para llenar el formulario"
                                >
                                    📥 Traer de Google
                                </button>
                            )}
                            <span className="text-xs font-mono bg-white px-2 py-1 rounded text-indigo-400 border border-indigo-100 flex items-center">
                                Dr. {editingAppt.doctor_name}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 bg-white">
                        {editingAppt.google_data && (
                            <div className="mb-6 p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800 flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <div>
                                    <strong>Atención: conflicto potencial.</strong>
                                    <p>Al guardar, se <u>sobreescribirá</u> el evento en Google Calendar con los datos de este formulario.</p>
                                    <ul className="mt-1 list-disc pl-4 space-y-1">
                                        {editingAppt.google_data.summary !== formData.patientName && (
                                            <li>
                                                Google tiene: <strong>{editingAppt.google_data.summary}</strong> vs App: <strong>{formData.patientName}</strong>
                                                <button
                                                    className="ml-2 text-indigo-600 underline cursor-pointer"
                                                    onClick={() => setFormData({ ...formData, patientName: editingAppt.google_data.summary })}
                                                >Usar Google</button>
                                            </li>
                                        )}
                                        {/* Simple check for description/reason difference logic could go here but it's complex due to metadata */}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Patient Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-muted uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
                                    Datos del Paciente
                                </h4>

                                <div>
                                    <label className="input-label text-xs">Nombre Completo (Título)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.patientName}
                                            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                            placeholder="Ej: Juan Perez"
                                        />
                                    </div>
                                    <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                                        <span>⚠️</span> Esto es lo que se muestra en el calendario.
                                    </p>
                                </div>

                                <div>
                                    <label className="input-label text-xs">DNI / Identificación</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.patientDni}
                                        onChange={(e) => setFormData({ ...formData, patientDni: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label text-xs">Teléfono</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.patientPhone}
                                            onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label text-xs">Email</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            value={formData.patientEmail}
                                            onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Appt Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-muted uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
                                    Detalles del Turno
                                </h4>

                                <div>
                                    <label className="input-label text-xs">Motivo de Consulta</label>
                                    <textarea
                                        className="input-field min-h-[80px]"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label text-xs">Estado</label>
                                        <select
                                            className="input-field"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="pending">🟡 Pendiente</option>
                                            <option value="confirmed">🟢 Confirmado</option>
                                            <option value="completed">✅ Completado</option>
                                            <option value="cancelled">🔴 Cancelado</option>
                                            <option value="absent">🚫 Ausente</option>
                                            <option value="rescheduled">📅 Reprogramado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label text-xs">Estado de Pago</label>
                                        <select
                                            className="input-field"
                                            value={formData.paymentStatus}
                                            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                        >
                                            <option value="pending">⏳ Pendiente</option>
                                            <option value="paid">💰 Pagado</option>
                                            <option value="debt">📛 Deuda</option>
                                            <option value="partial">🌗 Parcial</option>
                                            <option value="none">⚪ Bonificado/Ninguno</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="input-label text-xs">Modalidad</label>
                                        <select
                                            className="input-field"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="consultation">🏥 Presencial (Consultorio)</option>
                                            <option value="virtual">💻 Virtual (Videollamada)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary shadow-lg shadow-indigo-200"
                            >
                                💾 Guardar y Sobreescribir Google
                            </button>
                        </div>
                    </div>
                </div>
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
