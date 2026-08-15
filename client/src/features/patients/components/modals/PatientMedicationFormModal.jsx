import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import api from '@/api/axios';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PatientMedicationFormModal.module.css';

/**
 * PatientMedicationFormModal Molecule Component.
 * Follows AGENTS.md: Functional Component, Named Export, BEM + CSS Modules, i18n.
 * Allows adding or editing chronic/habitual patient medications with live Vademecum search.
 */
export const PatientMedicationFormModal = ({
    isOpen,
    onClose,
    patientId,
    initialData = null,
    onSuccess
}) => {
    const { t } = useLanguage();
    const [medName, setMedName] = useState('');
    const [dose, setDose] = useState('');
    const [frequency, setFrequency] = useState('');
    const [boxesCount, setBoxesCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [isChronic, setIsChronic] = useState(true);
    const [selectedVademecumId, setSelectedVademecumId] = useState(null);
    const [presentation, setPresentation] = useState('');
    const [monodroga, setMonodroga] = useState('');

    // Autocomplete State
    const [vademecumResults, setVademecumResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setMedName(initialData.medication_name || initialData.name || '');
                setDose(initialData.dose || '');
                setFrequency(initialData.frequency || '');
                setBoxesCount(initialData.boxes_count || 1);
                setNotes(initialData.notes || '');
                setIsChronic(initialData.is_chronic === 1 || initialData.is_chronic === true);
                setSelectedVademecumId(initialData.vademecum_id || null);
                setPresentation(initialData.presentation || '');
                setMonodroga(initialData.monodroga || '');
            } else {
                setMedName('');
                setDose('');
                setFrequency('');
                setBoxesCount(1);
                setNotes('');
                setIsChronic(true);
                setSelectedVademecumId(null);
                setPresentation('');
                setMonodroga('');
            }
            setVademecumResults([]);
            setShowDropdown(false);
        }
    }, [isOpen, initialData]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchVademecum = async (query) => {
        setMedName(query);
        if (!query || query.trim().length < 2) {
            setVademecumResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.get(`/medical/vademecum/search?q=${encodeURIComponent(query)}`);
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setVademecumResults(list);
            setShowDropdown(list.length > 0);
        } catch (err) {
            console.error('Error searching vademecum:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectVademecumItem = (item) => {
        setMedName(item.name || item.full_label);
        setPresentation(item.presentation || '');
        setMonodroga(item.drug || '');
        setSelectedVademecumId(item.id);
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!medName.trim()) return;

        setSaving(true);
        try {
            const payload = {
                patient_id: patientId,
                medication_name: medName.trim(),
                presentation,
                monodroga,
                dose,
                frequency,
                boxes_count: parseInt(boxesCount) || 1,
                notes,
                is_chronic: isChronic ? 1 : 0,
                vademecum_id: selectedVademecumId
            };

            if (initialData?.id) {
                await api.put(`/medical/patients/medications/${initialData.id}`, payload);
            } else {
                await api.post('/medical/patients/medications', payload);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving patient medication:', err);
            alert(t('error_saving_medication') || 'Error al guardar la medicación');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? (t('edit_medication') || 'Editar Medicación') : (t('add_medication') || 'Agregar Medicación Habitual')}
            size="md"
        >
            <form onSubmit={handleSubmit} className={styles.PatientMedicationFormModal__root}>
                {/* Vademecum Autocomplete */}
                <div className={styles.PatientMedicationFormModal__fieldGroup} ref={dropdownRef}>
                    <label className={styles.PatientMedicationFormModal__label}>
                        {t('medication_name') || 'Nombre del Medicamento / Vademécum'} *
                    </label>
                    <div className={styles.PatientMedicationFormModal__inputWrapper}>
                        <input
                            type="text"
                            className={styles.PatientMedicationFormModal__input}
                            value={medName}
                            onChange={(e) => handleSearchVademecum(e.target.value)}
                            placeholder={t('search_medication_placeholder') || 'Buscar en Vademécum (ej: Atenix, Clonagin...)'}
                            required
                            autoComplete="off"
                        />
                        {isSearching && <span className={styles.PatientMedicationFormModal__searchingSpinner} />}
                    </div>

                    {showDropdown && (
                        <ul className={styles.PatientMedicationFormModal__dropdown}>
                            {vademecumResults.map((item) => (
                                <li
                                    key={item.id}
                                    className={styles.PatientMedicationFormModal__dropdownItem}
                                    onClick={() => handleSelectVademecumItem(item)}
                                >
                                    <div className={styles.PatientMedicationFormModal__itemTitle}>{item.name}</div>
                                    <div className={styles.PatientMedicationFormModal__itemMeta}>
                                        {item.presentation} {item.drug ? `(${item.drug})` : ''} [{item.lab}]
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Dose & Frequency Grid */}
                <div className={styles.PatientMedicationFormModal__gridTwoCols}>
                    <div className={styles.PatientMedicationFormModal__fieldGroup}>
                        <label className={styles.PatientMedicationFormModal__label}>{t('dosage') || 'Dosis (ej: 50 mg, 1 comp.)'}</label>
                        <input
                            type="text"
                            className={styles.PatientMedicationFormModal__input}
                            value={dose}
                            onChange={(e) => setDose(e.target.value)}
                            placeholder="ej: 50 mg"
                        />
                    </div>
                    <div className={styles.PatientMedicationFormModal__fieldGroup}>
                        <label className={styles.PatientMedicationFormModal__label}>{t('frequency') || 'Frecuencia (ej: Cada 12 hs)'}</label>
                        <input
                            type="text"
                            className={styles.PatientMedicationFormModal__input}
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="ej: Cada 24 hs por la mañana"
                        />
                    </div>
                </div>

                {/* Boxes count & Chronic Checkbox */}
                <div className={styles.PatientMedicationFormModal__gridTwoCols}>
                    <div className={styles.PatientMedicationFormModal__fieldGroup}>
                        <label className={styles.PatientMedicationFormModal__label}>{t('boxes_count') || 'Cantidad de Cajas'}</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className={styles.PatientMedicationFormModal__input}
                            value={boxesCount}
                            onChange={(e) => setBoxesCount(e.target.value)}
                        />
                    </div>
                    <div className={styles.PatientMedicationFormModal__fieldGroupCheck}>
                        <label className={styles.PatientMedicationFormModal__checkLabel}>
                            <input
                                type="checkbox"
                                checked={isChronic}
                                onChange={(e) => setIsChronic(e.target.checked)}
                            />
                            <span>{t('is_chronic') || 'Medicación Habitual / Crónica'}</span>
                        </label>
                    </div>
                </div>

                {/* Notes */}
                <div className={styles.PatientMedicationFormModal__fieldGroup}>
                    <label className={styles.PatientMedicationFormModal__label}>{t('notes') || 'Indicaciones / Observaciones'}</label>
                    <textarea
                        className={styles.PatientMedicationFormModal__textarea}
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ej: Tomar con alimentos, mantener refrigeration..."
                    />
                </div>

                {/* Actions */}
                <div className={styles.PatientMedicationFormModal__actions}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                        {t('cancel') || 'Cancelar'}
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving || !medName.trim()} icon={<Icon name="save" size="1rem" />}>
                        {saving ? t('saving') || 'Guardando...' : (t('save') || 'Guardar')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
