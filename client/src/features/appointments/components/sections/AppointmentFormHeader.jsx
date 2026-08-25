import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/format';
import styles from './AppointmentHeader.module.css';

/**
 * AppointmentFormHeader Molecule.
 * Displays title and date/time for the creation/edition form, matching Detail modal style.
 */
export const AppointmentFormHeader = ({ isEdit, date, t }) => {
    return (
        <header className={styles.root}>
            <section className={styles.patientInfo}>
                <h3 className={styles.text}>
                    {isEdit ? (t('edit_appointment') || 'Editar Turno') : (t('new_appointment') || 'Nuevo Turno')}
                </h3>
                <p className={styles.date}>
                    <Icon name="calendar_month" size="1.1rem" />
                    {date ? formatDate(date, true) : t('select_date')}
                </p>
            </section>

            <aside className={styles.badges}>
                <Badge variant={isEdit ? 'accent' : 'blue'}>
                    {isEdit ? (t('modification') || 'Modificando') : (t('creating') || 'Creando')}
                </Badge>
            </aside>
        </header>
    );
};

