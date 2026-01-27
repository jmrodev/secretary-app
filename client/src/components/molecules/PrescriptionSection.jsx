import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import FormGroup from './FormGroup';
import MedicationAutocomplete from './MedicationAutocomplete';

const PrescriptionSection = ({
    medications,
    onAdd,
    onRemove,
    selectedPatient
}) => {
    const { t } = useLanguage();

    return (
        <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/50">
            <label className="text-sm font-semibold text-blue-800 mb-2 block">
                {t('medications_optional') || 'Medicamentos (Opcional)'}
            </label>

            <MedicationAutocomplete
                onSelectMedication={onAdd}
                placeholder={t('search_add_medication') || "Buscar y agregar medicamento..."}
                className="input-field w-full bg-white"
            />

            {medications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {medications.map((med, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 shadow-sm animate-fadeIn">
                            {med.name || med.full_label}
                            <button
                                onClick={() => onRemove(idx)}
                                className="text-red-400 hover:text-red-600 ml-1 font-bold"
                                type="button"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* WhatsApp Link Generator */}
            {selectedPatient && selectedPatient.phone && medications.length > 0 && (
                <div className="mt-3 pt-2 border-t border-blue-100">
                    <a
                        href={`https://wa.me/${selectedPatient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedPatient.full_name}, le envío el pedido de sus recetas: ${medications.map(m => m.name || m.full_label).join(', ')}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                        <span className="text-lg">📱</span> {t('send_via_whatsapp') || 'Enviar pedido por WhatsApp'}
                    </a>
                </div>
            )}

            {selectedPatient && !selectedPatient.phone && medications.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 italic">
                    * {t('patient_no_phone') || 'El paciente no tiene teléfono registrado para WhatsApp.'}
                </p>
            )}
        </div>
    );
};

export default PrescriptionSection;
