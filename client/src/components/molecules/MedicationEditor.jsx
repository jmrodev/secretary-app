import React from 'react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './MedicationEditor.css';

/**
 * MedicationEditor Molecule.
 * Facilitates editing of a medication list.
 */
const MedicationEditor = ({
    meds,
    onMedChange,
    onRemoveMed,
    newMed,
    onNewMedChange,
    onAddMed,
    t
}) => {
    const baseClass = 'medication-editor';

    return (
        <div className={baseClass}>
            <div className={`${baseClass}__list`}>
                {meds.map((med, idx) => (
                    <div key={idx} className={`${baseClass}__row`}>
                        <div className={`${baseClass}__inputs`}>
                            <Input
                                size="sm"
                                placeholder={t('name') || "Nombre"}
                                value={med.name}
                                onChange={(e) => onMedChange(idx, 'name', e.target.value)}
                            />
                            <Input
                                size="sm"
                                placeholder={t('dose') || "Dosis"}
                                value={med.dose}
                                onChange={(e) => onMedChange(idx, 'dose', e.target.value)}
                            />
                            <Input
                                size="sm"
                                placeholder={t('freq') || "Frec"}
                                value={med.frequency}
                                onChange={(e) => onMedChange(idx, 'frequency', e.target.value)}
                            />
                            <Input
                                size="sm"
                                type="number"
                                placeholder={t('qty') || "Cant"}
                                value={med.quantity}
                                onChange={(e) => onMedChange(idx, 'quantity', e.target.value)}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => onRemoveMed(idx)}
                            title={t('remove') || "Eliminar"}
                            icon={<Icon name="delete" size="1rem" color="var(--error)" />}
                        />
                    </div>
                ))}
            </div>

            <div className={`${baseClass}__add-form`}>
                <div className={`${baseClass}__inputs`}>
                    <Input
                        size="sm"
                        placeholder={t('new_med') || "Nuevo med..."}
                        value={newMed.name}
                        onChange={(e) => onNewMedChange('name', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAddMed()}
                    />
                    <Input
                        size="sm"
                        placeholder={t('dose') || "Dosis"}
                        value={newMed.dose}
                        onChange={(e) => onNewMedChange('dose', e.target.value)}
                    />
                    <Input
                        size="sm"
                        placeholder={t('freq') || "Frec"}
                        value={newMed.frequency}
                        onChange={(e) => onNewMedChange('frequency', e.target.value)}
                    />
                    <Input
                        size="sm"
                        type="number"
                        placeholder={t('qty') || "Cant"}
                        value={newMed.quantity}
                        onChange={(e) => onNewMedChange('quantity', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAddMed()}
                    />
                </div>
                <Button
                    size="sm"
                    variant="accent"
                    onClick={onAddMed}
                    disabled={!newMed.name.trim()}
                    className={`${baseClass}__add-btn`}
                    icon={<Icon name="add" size="1rem" />}
                >
                    {t('add_to_list') || 'Agregar a la lista'}
                </Button>
            </div>
        </div>
    );
};

export default MedicationEditor;
