import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import Icon from '../atoms/Icon';

const PatientMedications = ({ patientId }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [medications, setMedications] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]); // [NEW] History
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // State for multiple medications being added
    const [pendingMedications, setPendingMedications] = useState([]);

    // State for the current medication being configured
    const [currentMed, setCurrentMed] = useState({
        medication_name: '',
        presentation: '',
        monodroga: '',
        dose: '',
        frequency: '', // Now optional
        is_chronic: true,
        next_refill_date: '',
        notes: '',
        daily_intake: '',
        units_per_box: '',
        boxes_count: '1'
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

        // If no pending medications, nothing to save
        if (pendingMedications.length === 0) {
            showMessage(t('no_medications_to_add') || 'No hay medicamentos para agregar', 'warning');
            return;
        }

        try {
            // Save all pending medications
            for (const med of pendingMedications) {
                await api.post('/medical/patients/medications', {
                    ...med,
                    patient_id: patientId
                });
            }

            showMessage(
                t('medications_added') || `${pendingMedications.length} medicamento(s) agregado(s)`,
                'success'
            );

            setIsAdding(false);
            setPendingMedications([]);
            setCurrentMed({
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

        const date = calculateRefillDate(extractedUnits, currentMed.daily_intake, currentMed.boxes_count);

        // Update current medication form with selected data
        setCurrentMed(prev => ({
            ...prev,
            medication_name: `${med.name} ${med.presentation}`,
            presentation: med.presentation,
            monodroga: med.drug,
            units_per_box: extractedUnits,
            next_refill_date: date || prev.next_refill_date || ''
        }));
    };

    const handleAddToPending = (e) => {
        if (e) e.preventDefault();

        if (!currentMed.medication_name) return;

        // Add to pending list
        setPendingMedications(prev => [...prev, { ...currentMed }]);

        // Reset form for next entry
        setCurrentMed({
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
    };

    const handleRemovePendingMedication = (index) => {
        setPendingMedications(prev => prev.filter((_, i) => i !== index));
    };

    const handleDailyIntakeChange = (val) => {
        const date = calculateRefillDate(currentMed.units_per_box, val, currentMed.boxes_count);
        setCurrentMed(prev => ({
            ...prev,
            daily_intake: val,
            dose: val ? `${val} por día` : '', // Auto-fill dose text
            next_refill_date: date || ''
        }));
    };

    const handleUnitsChange = (val) => {
        const date = calculateRefillDate(val, currentMed.daily_intake, currentMed.boxes_count);
        setCurrentMed(prev => ({
            ...prev,
            units_per_box: val,
            next_refill_date: date || ''
        }));
    };

    const handleBoxesChange = (val) => {
        const date = calculateRefillDate(currentMed.units_per_box, currentMed.daily_intake, val);
        setCurrentMed(prev => ({
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
                    <Icon name="HISTORY" size="1.2rem" />
                    {t('recent_prescriptions') || 'Historial de Recetas'}
                </h3>
            </div>

            {recentRequests.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 mb-6">
                    <div className="text-2xl mb-2">
                        <Icon name="DOCUMENTS" size="2rem" />
                    </div>
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
                        <Icon name="PRESCRIPTION" size="1rem" />
                        {t('patient_current_meds') || 'Medicación Habitual / Crónicos'}
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
                        {/* Box 1: Search & List */}
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm mb-4">
                            {/* Medication Search */}
                            <div className="input-group mb-3">
                                <label className="input-label font-bold text-main-800">{t('search_medication') || 'Buscar Medicamento'}</label>
                                <MedicationAutocomplete
                                    value={currentMed.medication_name}
                                    onChange={(val) => setCurrentMed({ ...currentMed, medication_name: val })}
                                    onSelectMedication={handleSelectFromVademecum}
                                    placeholder={t('search_add_medication') || "Buscar y seleccionar..."}
                                />
                            </div>

                            {/* Show Pending Medications */}
                            {pendingMedications.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                        {t('medications_to_add') || 'Lista a Guardar'} ({pendingMedications.length})
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        {pendingMedications.map((med, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <div>
                                                    <div className="font-bold text-sm text-blue-900">{med.medication_name}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {med.daily_intake && `${med.daily_intake} u/día`}
                                                        {med.frequency && ` • ${med.frequency}`}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemovePendingMedication(idx)}
                                                    className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    type="button"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Box 2: Configuration (Only visible when med is selected or typing) */}
                        <div className={`transition-all duration-300 ${currentMed.medication_name ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 grayscale pointer-events-none'}`}>
                            <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200 mb-3">
                                <h5 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                                    <Icon name="CONFIG" size="1rem" /> {t('configuration') || 'Configuración'}
                                    <span className="text-[10px] font-normal text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                                        {currentMed.medication_name || 'Seleccione un medicamento'}
                                    </span>
                                </h5>

                                {/* Row 1: Calculator */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="input-group mb-0">
                                        <label className="input-label text-xs">
                                            <Icon name="DOCUMENTS" size="0.8rem" className="mr-1" />
                                            {t('units_per_box')}
                                        </label>
                                        <input
                                            type="number"
                                            className="input-field text-center font-bold text-slate-700 h-9"
                                            value={currentMed.units_per_box}
                                            onChange={e => handleUnitsChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                            placeholder="Ej: 30"
                                        />
                                    </div>
                                    <div className="input-group mb-0">
                                        <label className="input-label text-xs">
                                            <Icon name="DOCUMENTS" size="0.8rem" className="mr-1" />
                                            {t('boxes_count')}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input-field text-center font-bold text-slate-700 h-9"
                                            value={currentMed.boxes_count}
                                            onChange={e => handleBoxesChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="input-group mb-0">
                                        <label className="input-label text-xs">
                                            <Icon name="PRESCRIPTION" size="0.8rem" className="mr-1" />
                                            {t('daily_intake')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            className="input-field text-center font-bold text-blue-600 h-9"
                                            value={currentMed.daily_intake}
                                            onChange={e => handleDailyIntakeChange(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                            placeholder="Ej: 1"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div className="input-group mb-0">
                                        <label className="input-label text-xs">
                                            {t('frequency')} <span className="text-slate-400 font-normal">(Opcional)</span>
                                        </label>
                                        <input
                                            className="input-field h-9 text-sm"
                                            value={currentMed.frequency}
                                            onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                            placeholder="Ej: cada 8 hs"
                                        />
                                    </div>
                                    <div className="input-group mb-0">
                                        <label className="input-label text-xs font-bold text-blue-700">
                                            <Icon name="TODAY" size="0.8rem" className="mr-1" />
                                            {t('next_refill_date')}
                                        </label>
                                        <input
                                            type="date"
                                            className="input-field h-9 text-sm font-semibold bg-blue-50 border-blue-200"
                                            value={currentMed.next_refill_date}
                                            onChange={e => setCurrentMed({ ...currentMed, next_refill_date: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Notes & Chronic */}
                                <div className="flex gap-3 items-center">
                                    <div className="input-group mb-0 flex-grow">
                                        <input
                                            className="input-field h-9 text-sm"
                                            value={currentMed.notes}
                                            onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToPending(e)}
                                            placeholder={t('notes_placeholder') || "Notas (opcional)"}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-1 min-w-max">
                                        <input
                                            type="checkbox"
                                            id="is_chronic"
                                            checked={currentMed.is_chronic}
                                            onChange={e => setCurrentMed({ ...currentMed, is_chronic: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                        <label htmlFor="is_chronic" className="input-label mb-0 cursor-pointer text-xs font-bold text-slate-600">
                                            {t('chronic') || 'Crónico'}
                                        </label>
                                    </div>
                                </div>

                                {/* Add Button */}
                                <div className="mt-3 flex justify-end">
                                    <button
                                        disabled={!currentMed.medication_name}
                                        className="btn btn-sm btn-secondary w-full md:w-auto text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Icon name="SAVE" size="1rem" className="mr-1" />
                                        {t('add_to_list') || 'Confirmar y Agregar a Lista'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <button type="button" className="text-slate-400 hover:text-slate-600 text-sm underline" onClick={() => {
                                setIsAdding(false);
                                setPendingMedications([]);
                            }}>
                                {t('cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={pendingMedications.length === 0}
                            >
                                {t('save_all')} {pendingMedications.length > 0 ? `(${pendingMedications.length})` : ''}
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
                                                    <Icon name="PENDING" size="0.8rem" />
                                                    Renovar: {new Date(med.next_refill_date).toLocaleDateString()}
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
