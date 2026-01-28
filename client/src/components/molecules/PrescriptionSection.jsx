import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import MedicationInput from './MedicationInput';
import './PrescriptionSection.css';

/**
 * PrescriptionSection Molecule
 * Handles prescription medication selection with WhatsApp integration
 * @param {Array} medications - List of selected medications
 * @param {function} onAdd - Callback when medication is added
 * @param {function} onRemove - Callback when medication is removed
 * @param {Object} selectedPatient - Patient object with phone and full_name
 */
const PrescriptionSection = ({
    medications,
    onAdd,
    onRemove,
    selectedPatient
}) => {
    const { t } = useLanguage();

    const generateWhatsAppMessage = () => {
        const medList = medications
            .map(m => m.name || m.full_label || m.medication_name)
            .join(', ');
        return `Hola ${selectedPatient.full_name}, le envío el pedido de sus recetas: ${medList}.`;
    };

    const whatsappUrl = selectedPatient?.phone
        ? `https://wa.me/${selectedPatient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generateWhatsAppMessage())}`
        : null;

    return (
        <div className="prescription-section">
            <MedicationInput
                medications={medications}
                onAdd={onAdd}
                onRemove={onRemove}
                label={t('medications_optional') || 'Medicamentos (Opcional)'}
                placeholder={t('search_add_medication') || "Buscar y agregar medicamento..."}
                optional={true}
                className="prescription-section__medication-input"
            />

            {/* WhatsApp Link Generator */}
            {selectedPatient && medications.length > 0 && (
                <div className="prescription-section__whatsapp">
                    {whatsappUrl ? (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="prescription-section__whatsapp-link"
                        >
                            <span className="prescription-section__whatsapp-icon">📱</span>
                            {t('send_via_whatsapp') || 'Enviar pedido por WhatsApp'}
                        </a>
                    ) : (
                        <p className="prescription-section__no-phone">
                            * {t('patient_no_phone') || 'El paciente no tiene teléfono registrado para WhatsApp.'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrescriptionSection;
