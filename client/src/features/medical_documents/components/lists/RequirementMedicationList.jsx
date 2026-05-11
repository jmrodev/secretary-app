import React from 'react';
import Icon from '@/components/atoms/Icon';
import MedicationCard from '@/features/medical_documents/components/sections/MedicationCard';
import { calculateDuration } from '@/features/medical_documents/utils/medicationHelpers';

/**
 * RequirementMedicationList Feature Molecule.
 * Displays the list of requested medications, separating known/habitual from unknown items.
 * Used within the RequirementDetailModal to present prescription data to the doctor.
 */
const RequirementMedicationList = ({
    meds,
    notes,
    checkIsKnown,
    canEdit,
    addToChronic,
    t
}) => {
    const knownMeds = meds.filter(m => checkIsKnown(m.name));
    const unknownMeds = meds.filter(m => !checkIsKnown(m.name));

    return (
        <div className="requirements-content animate-fade-in">
            {meds.length > 0 && (
                <div className="medication-list">
                    <h4 className="requirements-detail__section-title">
                        <Icon name="medication" size="1.2rem" color="var(--accent-color)" />
                        {t('requested_medication') || 'Medicación Solicitada'}
                    </h4>

                    {unknownMeds.length > 0 && (
                        <section className="requirements-detail__group">
                            <h5 className="requirements-detail__group-title requirements-detail__group-title--unknown">
                                <Icon name="warning" size="1rem" color="var(--error)" />
                                {t('new_meds_warning') || 'Nuevos / No Habituales'}
                            </h5>
                            <div className="requirements-detail__grid">
                                {unknownMeds.map((m, i) => (
                                    <MedicationCard
                                        key={i}
                                        {...m}
                                        isKnown={false}
                                        canEdit={canEdit}
                                        onSave={addToChronic}
                                        duration={calculateDuration(m.quantity, m.frequency)}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {knownMeds.length > 0 && (
                        <section className="requirements-detail__group">
                            <h5 className="requirements-detail__group-title requirements-detail__group-title--known">
                                <Icon name="verified" size="1rem" color="var(--success)" />
                                {t('habitual_meds') || 'Habituales (Validado)'}
                            </h5>
                            <div className="requirements-detail__grid">
                                {knownMeds.map((m, i) => (
                                    <MedicationCard
                                        key={i}
                                        {...m}
                                        isKnown={true}
                                        duration={calculateDuration(m.quantity, m.frequency)}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {notes && (
                <div className="requirements-detail__notes mt-6">
                    <strong className="requirements-detail__label">
                        <Icon name="notes" size="1rem" color="var(--text-secondary)" />
                        {meds.length > 0 ? t('additional_notes') : t('detail_reason')}:
                    </strong>
                    <div className="requirements-detail__notes-content">
                        {notes}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequirementMedicationList;
