import React from 'react';

export const TransactionSummaryHeader = ({ requestId, patientSearch, doctors, doctor_id, t }) => (
    requestId ? (
        <div className="transaction-modal__summary-header">
            <div className="transaction-modal__summary-item">
                <span className="transaction-modal__summary-label">{t('patient')}:</span>
                <span className="transaction-modal__summary-value">{patientSearch}</span>
            </div>
            <div className="transaction-modal__summary-item">
                <span className="transaction-modal__summary-label">{t('doctor')}:</span>
                <span className="transaction-modal__summary-value">{doctors.find(d => String(d.id) === String(doctor_id))?.full_name}</span>
            </div>
        </div>
    ) : null
);
