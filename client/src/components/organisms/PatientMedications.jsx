import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import './PatientMedications.css';

const PatientMedications = ({ patientId, patientName }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { user } = useAuth();
    const [medications, setMedications] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);
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
        frequency: '',
        is_chronic: true,
        next_refill_date: '',
        notes: '',
        daily_intake: '',
        units_per_box: '',
        boxes_count: '1',
        vademecum_id: null,
        reminder_mode: 'calculation', // 'calculation', 'fixed_day', 'fixed_date'
        reminder_day: ''
    });

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

            const reqRes = await api.get(`/medical/requests?patientId=${patientId}`);
            setRecentRequests(reqRes.data.filter(r => r.type === 'prescription'));

        } catch (err) {
            console.error("Error fetching patient meds:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = async (e) => {
        if (e) e.preventDefault();

        if (pendingMedications.length === 0) {
            showMessage(t('no_medications_to_add') || 'No hay medicamentos para agregar', 'warning');
            return;
        }

        try {
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
                boxes_count: '1',
                vademecum_id: null,
                reminder_mode: 'calculation',
                reminder_day: ''
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
        let extractedUnits = '';
        const match = med.presentation.match(/x\s*(\d+)/i);
        if (match && match[1]) extractedUnits = match[1];

        const date = calculateRefillDate(extractedUnits, currentMed.daily_intake, currentMed.boxes_count);

        setCurrentMed(prev => ({
            ...prev,
            medication_name: `${med.name} ${med.presentation}`,
            presentation: med.presentation,
            monodroga: med.drug,
            units_per_box: extractedUnits,
            next_refill_date: date || prev.next_refill_date || '',
            vademecum_id: med.id
        }));
    };

    const handleAddToPending = (e) => {
        if (e) e.preventDefault();
        if (!currentMed.medication_name) return;

        setPendingMedications(prev => [...prev, { ...currentMed }]);
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
            boxes_count: '1',
            vademecum_id: null,
            reminder_mode: 'calculation',
            reminder_day: ''
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
            dose: val ? `${val} por día` : prev.dose,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleUnitsChange = (val) => {
        const date = calculateRefillDate(val, currentMed.daily_intake, currentMed.boxes_count);
        setCurrentMed(prev => ({
            ...prev,
            units_per_box: val,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleBoxesChange = (val) => {
        const date = calculateRefillDate(currentMed.units_per_box, currentMed.daily_intake, val);
        setCurrentMed(prev => ({
            ...prev,
            boxes_count: val,
            next_refill_date: prev.reminder_mode === 'calculation' ? (date || prev.next_refill_date) : prev.next_refill_date
        }));
    };

    const handleModeChange = (mode) => {
        let nextDate = currentMed.next_refill_date;

        if (mode === 'calculation') {
            nextDate = calculateRefillDate(currentMed.units_per_box, currentMed.daily_intake, currentMed.boxes_count) || '';
        } else if (mode === 'fixed_day' && currentMed.reminder_day) {
            const date = new Date();
            date.setDate(currentMed.reminder_day);
            if (date <= new Date()) date.setMonth(date.getMonth() + 1);
            nextDate = date.toISOString().split('T')[0];
        }

        setCurrentMed(prev => ({
            ...prev,
            reminder_mode: mode,
            next_refill_date: nextDate
        }));
    };

    const handleReminderDayChange = (val) => {
        let nextDate = currentMed.next_refill_date;
        if (val) {
            const date = new Date();
            let day = parseInt(val);
            if (day < 1) day = 1;
            if (day > 31) day = 31;
            date.setDate(day);
            if (date <= new Date()) date.setMonth(date.getMonth() + 1);
            nextDate = date.toISOString().split('T')[0];
        }
        setCurrentMed(prev => ({ ...prev, reminder_day: val, next_refill_date: nextDate }));
    };

    return (
        <div className="patient-medications">
            {/* Block 3: Prescription History */}
            <section className="details-block details-block--medications">
                <header className="details-block__header">
                    <h3 className="details-block__title">
                        <Icon name="HISTORY" size="1.2rem" />
                        {t('recent_prescriptions') || 'Historial de Recetas'}
                    </h3>
                </header>

                <div className="details-block__content">
                    {recentRequests.length === 0 ? (
                        <div className="patient-medications__empty-state">
                            <Icon name="DOCUMENTS" size="2rem" />
                            <p>{t('no_history') || 'No se han generado recetas para este paciente.'}</p>
                        </div>
                    ) : (
                        <div className="patient-medications__history-container">
                            <table className="patient-medications__table">
                                <thead className="patient-medications__table-header">
                                    <tr>
                                        <th>{t('date')}</th>
                                        <th>{t('prescription_detail')}</th>
                                        <th>{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRequests.map(req => (
                                        <tr key={req.id} className="patient-medications__table-row">
                                            <td className="patient-medications__table-cell">
                                                <span className="patient-medications__date-badge">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                                <div className="patient-medications__doctor-name">
                                                    Dr/a. {req.doctor_name}
                                                </div>
                                            </td>
                                            <td className="patient-medications__table-cell">
                                                <div className="patient-medications__request-note">
                                                    {req.request_note}
                                                </div>
                                            </td>
                                            <td className="patient-medications__table-cell">
                                                <span className={`tag tag-${req.status === 'completed' ? 'completed' : 'pending'}`}>
                                                    {req.status === 'completed' ? t('delivered') || 'Entregado' : t('pending') || 'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Block 4: Active/Chronic Medications */}
            <section className="details-block details-block--medications">
                <header className="details-block__header">
                    <h3 className="details-block__title">
                        <Icon name="PRESCRIPTION" size="1.2rem" />
                        {t('patient_current_meds') || 'Medicación Habitual / Crónicos'}
                    </h3>
                    {!isAdding && (
                        <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>
                            + {t('configure') || 'Configurar'}
                        </Button>
                    )}
                </header>

                <div className="details-block__content">

                    {/* Adding Form */}
                    {isAdding && (
                        <div className="patient-medications__form">
                            <div className="patient-medications__form-card">
                                <div className="config-field">
                                    <label className="config-field__label">{t('search_medication') || 'Buscar Medicamento'}</label>
                                    <MedicationAutocomplete
                                        value={currentMed.medication_name}
                                        onChange={(val) => setCurrentMed({ ...currentMed, medication_name: val })}
                                        onSelectMedication={handleSelectFromVademecum}
                                        placeholder={t('search_add_medication') || "Buscar y seleccionar..."}
                                    />
                                </div>

                                {pendingMedications.length > 0 && (
                                    <div className="patient-medications__pending-list">
                                        <label className="patient-medications__subtitle mb-2">
                                            {t('medications_to_add') || 'Lista a Guardar'} ({pendingMedications.length})
                                        </label>
                                        {pendingMedications.map((med, idx) => (
                                            <div key={idx} className="patient-medications__pending-item">
                                                <div className="patient-medications__pending-info">
                                                    <div className="patient-medications__pending-name">{med.medication_name}</div>
                                                    <div className="patient-medications__pending-details">
                                                        {med.daily_intake && `${med.daily_intake} u/día`}
                                                        {med.frequency && ` • ${med.frequency}`}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemovePendingMedication(idx)}
                                                    className="patient-medications__remove-pending"
                                                    type="button"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {currentMed.medication_name && (
                                <div className="patient-medications__form-card animate-fadeIn">
                                    <div className="patient-medications__mode-selector mb-4">
                                        <label className="config-field__label">{t('reminder_mode') || 'Modo de Recordatorio'}</label>
                                        <div className="config-flex config-flex--gap-2">
                                            <Button
                                                size="xs"
                                                variant={currentMed.reminder_mode === 'calculation' ? 'primary' : 'secondary'}
                                                onClick={() => handleModeChange('calculation')}
                                            >
                                                {t('mode_calculation') || 'Por Cálculo'}
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant={currentMed.reminder_mode === 'fixed_day' ? 'primary' : 'secondary'}
                                                onClick={() => handleModeChange('fixed_day')}
                                            >
                                                {t('mode_fixed_day') || 'Todos los meses (día...)'}
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant={currentMed.reminder_mode === 'fixed_date' ? 'primary' : 'secondary'}
                                                onClick={() => handleModeChange('fixed_date')}
                                            >
                                                {t('mode_fixed_date') || 'Fecha específica'}
                                            </Button>
                                        </div>
                                    </div>

                                    {currentMed.reminder_mode === 'calculation' && (
                                        <div className="patient-medications__config-grid animate-fadeIn">
                                            <div className="config-field">
                                                <label className="config-field__label">{t('units_per_box')}</label>
                                                <input
                                                    type="number"
                                                    className="config-field__input"
                                                    value={currentMed.units_per_box}
                                                    onChange={e => handleUnitsChange(e.target.value)}
                                                />
                                            </div>
                                            <div className="config-field">
                                                <label className="config-field__label">{t('boxes_count')}</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="config-field__input"
                                                    value={currentMed.boxes_count}
                                                    onChange={e => handleBoxesChange(e.target.value)}
                                                />
                                            </div>
                                            <div className="config-field">
                                                <label className="config-field__label">{t('daily_intake')}</label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    className="config-field__input"
                                                    value={currentMed.daily_intake}
                                                    onChange={e => handleDailyIntakeChange(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {currentMed.reminder_mode === 'fixed_day' && (
                                        <div className="config-field animate-fadeIn">
                                            <label className="config-field__label">{t('reminder_day_of_month') || 'Día del mes para el recordatorio'}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                className="config-field__input"
                                                placeholder="Ej: 20"
                                                value={currentMed.reminder_day}
                                                onChange={e => handleReminderDayChange(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="patient-medications__config-row">
                                        <div className="config-field">
                                            <label className="config-field__label">{t('frequency')}</label>
                                            <input
                                                className="config-field__input"
                                                value={currentMed.frequency}
                                                onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                                placeholder="Cada 8hs..."
                                            />
                                        </div>
                                        <div className="config-field">
                                            <label className="config-field__label">{t('next_refill_date')}</label>
                                            <input
                                                type="date"
                                                className="config-field__input"
                                                value={currentMed.next_refill_date}
                                                onChange={e => setCurrentMed({ ...currentMed, next_refill_date: e.target.value })}
                                                readOnly={currentMed.reminder_mode !== 'fixed_date'}
                                            />
                                            {currentMed.reminder_mode !== 'fixed_date' && (
                                                <div className="text-xs text-muted mt-1">
                                                    {t('auto_calculated_date') || 'Fecha calculada automáticamente'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="patient-medications__config-footer">
                                        <div className="config-field flex-1 mb-0">
                                            <input
                                                className="config-field__input"
                                                value={currentMed.notes}
                                                onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
                                                placeholder={t('notes_placeholder') || "Notas adicionales..."}
                                            />
                                        </div>
                                        <div className="config-flex config-flex--gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_chronic"
                                                checked={currentMed.is_chronic}
                                                onChange={e => setCurrentMed({ ...currentMed, is_chronic: e.target.checked })}
                                                className="patient-medications__checkbox"
                                            />
                                            <label htmlFor="is_chronic" className="patient-medications__checkbox-label">{t('chronic')}</label>
                                        </div>
                                        <Button size="sm" onClick={handleAddToPending}>
                                            {t('add_to_list') || 'Agregar a Lista'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="patient-medications__form-actions">
                                <button type="button" className="patient-medications__cancel-link" onClick={() => {
                                    setIsAdding(false);
                                    setPendingMedications([]);
                                }}>
                                    {t('cancel')}
                                </button>
                                <Button
                                    variant="primary"
                                    onClick={handleAddMedication}
                                    disabled={pendingMedications.length === 0}
                                >
                                    {t('save_all')} {pendingMedications.length > 0 ? `(${pendingMedications.length})` : ''}
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-4 text-slate-400">Cargando...</div>
                    ) : medications.length === 0 ? (
                        <div className="patient-medications__empty-state">
                            <p>{t('no_current_medications') || 'No hay medicación habitual registrada.'}</p>
                        </div>
                    ) : (
                        <div className="patient-medications__history-container">
                            <table className="patient-medications__table">
                                <thead className="patient-medications__table-header">
                                    <tr>
                                        <th>{t('medication')}</th>
                                        <th>{t('dose')}</th>
                                        <th>{t('frequency')}</th>
                                        <th className="text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medications.map(med => (
                                        <tr key={med.id} className="patient-medications__table-row">
                                            <td className="patient-medications__table-cell">
                                                <div className="patient-medications__medication-name-box">
                                                    {med.medication_name}
                                                    {med.is_chronic && (
                                                        <span className="patient-medications__status-badge patient-medications__status-badge--chronic">
                                                            {t('chronic') || 'CRÓNICO'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="patient-medications__medication-subtext">
                                                    {med.presentation} - {med.monodroga}
                                                </div>
                                                {med.next_refill_date && (
                                                    <div className={`patient-medications__refill-info ${new Date(med.next_refill_date) <= new Date(new Date().setDate(new Date().getDate() + 2)) ? 'patient-medications__refill-info--urgent' : ''}`}>
                                                        <Icon name="TODAY" size="0.8rem" />
                                                        {t('next_refill_date')}: {new Date(med.next_refill_date).toLocaleDateString()}
                                                        <span className="patient-medications__mode-badge ml-2">
                                                            ({med.reminder_mode === 'calculation' ? t('by_calculation') || 'Cálculo' :
                                                                med.reminder_mode === 'fixed_day' ? `${t('day') || 'Día'} ${med.reminder_day}` :
                                                                    t('fixed') || 'Fijo'})
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="patient-medications__table-cell">{med.dose}</td>
                                            <td className="patient-medications__table-cell">{med.frequency}</td>
                                            <td className="patient-medications__table-cell text-right">
                                                <div className="config-flex config-flex--justify-end config-flex--gap-2">
                                                    {med.next_refill_date && (
                                                        <button
                                                            className="text-blue-400 hover:text-blue-600 p-1"
                                                            title={t('remind_refill') || 'Recordar Renovación'}
                                                            onClick={() => {
                                                                const template = settings.medication_refill_reminder_template ||
                                                                    'Hola {patient_name}, te recordamos que según nuestros registros tu medicación ({medication_name}) está próxima a terminarse. ¿Necesitas que te preparemos la receta?';

                                                                const msg = template
                                                                    .replace('{patient_name}', patientName || 'paciente')
                                                                    .replace('{medication_name}', med.medication_name)
                                                                    .replace('{secretary_name}', user?.full_name || '');

                                                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                            }}
                                                        >
                                                            <Icon name="CHAT" size="1rem" />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                        onClick={() => handleDiscontinue(med.id)}
                                                        title={t('discontinue')}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PatientMedications;
