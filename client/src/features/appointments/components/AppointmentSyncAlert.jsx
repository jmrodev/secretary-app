import React from 'react';
import Icon from '../../../components/atoms/Icon';

/**
 * AppointmentSyncAlert Molecule (Internal to feature).
 * Displays info when an appointment is being synced from Google Calendar.
 */
const AppointmentSyncAlert = ({ info }) => {
    if (!info) return null;
    return (
        <div className="appointment-sync-alert">
            <Icon name="auto_awesome" size="1.2rem" className="appointment-sync-alert__icon" />
            <div className="appointment-sync-alert__content">
                <strong className="appointment-sync-alert__title">Ajuste de Calendario Google</strong>
                <p className="appointment-sync-alert__text">Completando turno para: <em>{info}</em></p>
            </div>
        </div>
    );
};

export default AppointmentSyncAlert;
