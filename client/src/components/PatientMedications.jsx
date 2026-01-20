import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import MedicationAutocomplete from './MedicationAutocomplete';

const PatientMedications = ({ patientId }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [medications, setMedications] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]); // [NEW] History
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newMed, setNewMed] = useState({
        medication_name: '',
        presentation: '',
        monodroga: '',
        dose: '',
        frequency: '',
        is_chronic: true, // [user-request] Default to chronic
        next_refill_date: '',
        notes: '',
        daily_intake: '',
        units_per_box: '',
        boxes_count: '1' // [NEW] Multiplier
    });

    // [NEW] Helper calculate date based on explicit units and boxes
    const calculateRefillDate = (units, daily, boxes = 1) => {
        if (!units || !daily || isNaN(daily) || Number(daily) <= 0 || isNaN(units)) return null;

        const totalUnits = Number(units) * Number(boxes || 1);
        const daysLasting = Math.floor(totalUnits / Number(daily));
        const date = new Date();
        date.setDate(date.getDate() + daysLasting);
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (patientId) fetchMedications();
    }, [patientId]);

    const fetchMedications = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/medical/patients/${patientId}/medications`);
            setMedications(res.data);

            // Fetch requests history
            const reqRes = await api.get(`/medical/requests?patientId=${patientId}`);
            setRecentRequests(reqRes.data.filter(r => r.type === 'prescription'));

        } catch (err) {
            console.error("Error fetching patient meds:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = async (e) => {
        e.preventDefault();
        try {
            await api.post('/medical/patients/medications', {
                ...newMed,
                patient_id: patientId
            });
            showMessage(t('medication_added') || 'Medicamento agregado', 'success');
            setIsAdding(false);
            setNewMed({
                medication_name: '',
                presentation: '',
                monodroga: '',
                dose: '',
                frequency: '',
                is_chronic: true,
                next_refill_date: '',
                notes: '',
                daily_intake: '',
                units_per_box: '',
                boxes_count: '1'
            });
            fetchMedications();
        } catch (err) {
            showMessage(t('error_adding_medication') || 'Error al agregar medicamento', 'error');
        }
    };

    const handleDiscontinue = async (id) => {
        if (!window.confirm(t('confirm_discontinue_med') || '¿Descontinuar este medicamento?')) return;
        try {
            await api.delete(`/medical/patients/medications/${id}`);
            showMessage(t('medication_discontinued') || 'Medicamento descontinuado', 'success');
            fetchMedications();
        } catch (err) {
            showMessage(t('error_discontinuing_med') || 'Error al descontinuar', 'error');
        }
    };

    const handleSelectFromVademecum = (med) => {
        // Try initial parse
        let extractedUnits = '';
        const match = med.presentation.match(/x\s*(\d+)/i);
        if (match && match[1]) extractedUnits = match[1];

        const date = calculateRefillDate(extractedUnits, newMed.daily_intake, newMed.boxes_count);

        setNewMed({
            ...newMed,
            medication_name: `${med.name} ${med.presentation}`,
            presentation: med.presentation,
            monodroga: med.drug,
            units_per_box: extractedUnits,
            next_refill_date: date || ''
        });
    };

    const handleDailyIntakeChange = (val) => {
        const date = calculateRefillDate(newMed.units_per_box, val, newMed.boxes_count);
        setNewMed(prev => ({
            ...prev,
            daily_intake: val,
            dose: val ? `${val} por día` : '', // Auto-fill dose text
            next_refill_date: date || ''
        }));
    };

    const handleUnitsChange = (val) => {
        const date = calculateRefillDate(val, newMed.daily_intake, newMed.boxes_count);
        setNewMed(prev => ({
            ...prev,
            units_per_box: val,
            next_refill_date: date || ''
        }));
    };

    const handleBoxesChange = (val) => {
        const date = calculateRefillDate(newMed.units_per_box, newMed.daily_intake, val);
        setNewMed(prev => ({
            ...prev,
            boxes_count: val,
            next_refill_date: date || ''
        }));
    };

    return (
        <div className="card mt-4">
            {/* SECTION 1: Prescription History (Priority) */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-main-800">
                    📜 {t('history') || 'Historial de Recetas'}
                </h3>
            </div>

            {recentRequests.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 mb-6">
                    <div className="text-2xl mb-2">📭</div>
                    <p>{t('no_history') || 'No se han generado recetas para este paciente.'}</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {recentRequests.map(req => (
                        <div key={req.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex justify-between items-start mb-2 pl-3">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                        {new Date(req.created_at).toLocaleDateString()} • {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className="text-xs text-slate-400">Dr/a. {req.doctor_name}</div>
                                </div>
                                <div className={`badge ${req.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                    {req.status === 'completed' ? 'Entregado' : 'Pendiente'}
                                </div>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-line pl-3 mt-2 font-medium">
                                {req.request_note}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SECTION 2: Active/Chronic Medications (Secondary) */}
            <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-widest">
                        💊 {t('patient_current_meds') || 'Medicación Habitual / Crónicos'}
                        <span className="badge badge-neutral font-normal normal-case text-xs ml-2 opacity-50">Opcional</span>
                    </h4>
                    {!isAdding && (
                        <button className="btn btn-sm btn-ghost text-blue-600" onClick={() => setIsAdding(true)}>
                            + {t('add') || 'Configurar'}
                        </button>
                    )}
                </div>

                {/* Adding Form */}
                {isAdding && (
                    <form onSubmit={handleAddMedication} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-fade-in">
                        {/* Row 1: Medication */}
                        <div className="input-group mb-3">
                            <label className="input-label">{t('medication')}</label>
                            <MedicationAutocomplete
                                value={newMed.medication_name}
                                onChange={(val) => setNewMed({ ...newMed, medication_name: val })}
                                onSelectMedication={handleSelectFromVademecum}
                            />
                        </div>

                        {/* Row 2: Calculator (3 Cols) */}
                        <div className="grid grid-cols-3 gap-3 mb-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                            <div className="input-group">
                                <label className="input-label text-xs">📦 {t('units_per_box')}</label>
                                <input
                                    type="number"
                                    className="input-field text-center font-bold text-slate-700"
                                    value={newMed.units_per_box}
                                    onChange={e => handleUnitsChange(e.target.value)}
                                    placeholder="Ej: 30"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label text-xs">📦 {t('boxes_count')}</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input-field text-center font-bold text-slate-700"
                                    value={newMed.boxes_count}
                                    onChange={e => handleBoxesChange(e.target.value)}
                                    placeholder="1"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label text-xs">💊 {t('daily_intake') || 'Dosis x Día'}</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    className="input-field text-center font-bold text-blue-600"
                                    value={newMed.daily_intake}
                                    onChange={e => handleDailyIntakeChange(e.target.value)}
                                    placeholder="Ej: 1"
                                />
                            </div>
                        </div>

                        {/* Row 3: Details & Result */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="input-group">
                                <label className="input-label">{t('frequency') || 'Instrucciones / Frecuencia'}</label>
                                <input
                                    className="input-field"
                                    value={newMed.frequency}
                                    onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                    placeholder="Ej: cada 8 horas, con las comidas..."
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label text-blue-800 font-bold">📅 {t('next_refill_date')}</label>
                                <input
                                    type="date"
                                    className="input-field font-semibold bg-blue-50 border-blue-200"
                                    value={newMed.next_refill_date}
                                    onChange={e => setNewMed({ ...newMed, next_refill_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-group mt-3">
                            <label className="input-label">{t('notes')}</label>
                            <input
                                className="input-field"
                                value={newMed.notes}
                                onChange={e => setNewMed({ ...newMed, notes: e.target.value })}
                                placeholder="Ej: No suspender sin consulta previa"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-4 ml-1">
                            <input
                                type="checkbox"
                                id="is_chronic"
                                checked={newMed.is_chronic}
                                onChange={e => setNewMed({ ...newMed, is_chronic: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor="is_chronic" className="input-label mb-0 cursor-pointer text-sm font-medium text-slate-700">
                                {t('chronic') || 'Tratamiento Crónico'}
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {t('save')}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="py-2 text-center text-xs text-slate-400">Cargando...</div>
                ) : medications.length === 0 ? (
                    <div className="text-xs text-slate-300 italic pl-1">
                        {/* Empty state hidden to avoid clutter */}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 italic text-slate-500 text-xs">
                                    <th className="pb-2">{t('medication')}</th>
                                    <th className="pb-2">{t('dose')}</th>
                                    <th className="pb-2">{t('frequency')}</th>
                                    <th className="pb-2 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications.map(med => (
                                    <tr key={med.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="py-2">
                                            <div className="font-semibold text-main-700 text-sm">
                                                {med.medication_name} {med.is_chronic && <span className="badge badge-info ml-1 text-[10px]">C</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {med.presentation} - {med.monodroga}
                                            </div>
                                            {med.next_refill_date && (
                                                <div className="text-[10px] text-orange-600 font-medium mt-1 flex items-center gap-1">
                                                    ⏰ Renovar: {new Date(med.next_refill_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 text-xs">{med.dose}</td>
                                        <td className="py-2 text-xs">{med.frequency}</td>
                                        <td className="py-2 text-right">
                                            <button
                                                className="text-red-400 hover:text-red-600 p-1"
                                                onClick={() => handleDiscontinue(med.id)}
                                                title={t('discontinue')}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div >
        </div >
    );
};

export default PatientMedications;
