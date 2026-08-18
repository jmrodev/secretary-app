import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useTransactionForm } from '@/features/finances/hooks/useTransactionForm';
import { formatCurrency } from '@/utils/core/format';
import {
    getTransactionTypes,
    getStatusOptions,
    getServiceTypes
} from '@/constants/transactionOptions';

// Atomic Components
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { AutoTextarea } from '@/components/atoms/AutoTextarea';
import { FormGroup } from '@/components/molecules/FormGroup';
import styles from './TransactionModal.module.css';

import { TransactionSummaryHeader } from '../sections/TransactionSummaryHeader';
import { TransactionPaymentsSection } from '../sections/TransactionPaymentsSection';

/**
 * TransactionModal Molecule.
 * Orchestrates the creation and editing of financial records.
 */
export const TransactionModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialData = null,
    requestId,
    medicationInputSlot,
    MedicationInputComponent
}) => {
    const { t } = useLanguage();
    const { settings } = useConfig();

    const {
        formData, loading, patients, doctors, pricingInfo, totalPrice, patientSearch, showPatientList,
        setPatientSearch, setShowPatientList, updateField, updateServiceType, updateDoctor, selectPatient,
        handlePaymentChange, addPaymentMethod, removePaymentMethod, saveTransaction, medications,
        selectedPatient, addMedication, removeMedication, setTotalPrice
    } = useTransactionForm(isOpen, initialData, requestId, onSuccess, onClose);

    const currentPaidTotal = formData.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const debtAmount = Math.max(0, totalPrice - currentPaidTotal);

    const transactionTypes = getTransactionTypes(t);
    const statusOptions = getStatusOptions(t);
    const serviceTypes = getServiceTypes(t);

    const doctorOptions = React.useMemo(() => [
        { value: '', label: t('select_doctor') }, 
        ...doctors.map(d => ({ value: String(d.id), label: d.full_name }))
    ], [doctors, t]);

    const doctorUserOptions = React.useMemo(() => [
        { value: '', label: t('select_doctor') }, 
        ...doctors.map(d => ({ value: String(d.user_id), label: d.full_name }))
    ], [doctors, t]);

    const filteredPatients = React.useMemo(() => {
        if (!patientSearch || !patients) return [];
        const search = patientSearch.toLowerCase();
        return patients.filter(p =>
            p.full_name.toLowerCase().includes(search) ||
            (p.dni && p.dni.includes(patientSearch))
        );
    }, [patients, patientSearch]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('record_payment')}
            size="lg"
            footer={
                <div className={styles.TransactionModal__footerButtons}>
                    <Button variant="secondary" onClick={onClose} icon={<Icon name="close" size="1.1rem" />}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={saveTransaction} disabled={loading} variant="primary" icon={<Icon name="check" size="1.2rem" />}>
                        {loading ? t('processing') : t('confirm_payment')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.TransactionModal__root}`}>
                <div className={styles.TransactionModal__fieldFull}>
                    <TransactionSummaryHeader 
                        requestId={requestId} 
                        patientSearch={patientSearch} 
                        doctors={doctors} 
                        doctor_id={formData.doctor_id} 
                        t={t} 
                    />
                </div>

                {!requestId && formData.type === 'income_patient' && (
                    <div className={styles.TransactionModal__fieldThird}>
                        <FormGroup label={t('patient')}>
                            <div className={`${styles.TransactionModal__autocomplete}`}>
                                <Input
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); updateField('related_user_id', ''); }}
                                    onFocus={() => !initialData?.patientId && setShowPatientList(true)}
                                    placeholder={t('search_name_dni')} disabled={!!initialData?.patientId}
                                    icon={<Icon name="search" size="1.1rem" />} className="transaction-modal__input"
                                />
                                {showPatientList && patientSearch && !formData.related_user_id && (
                                    <ul className={`${styles.TransactionModal__results}`} role="listbox">
                                        {filteredPatients.map(p => (
                                            <li
                                                key={p.id} onClick={() => selectPatient(p)}
                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPatient(p); } }}
                                                className={`${styles.TransactionModal__item}`} role="option" aria-selected={false} tabIndex={0}
                                            >
                                                <span className="transaction-modal__item-name">{p.full_name}</span>
                                                <span className={`${styles.TransactionModal__hint}`}>{p.dni}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </FormGroup>
                    </div>
                )}

                {formData.type === 'income_rental' && (
                    <div className={styles.TransactionModal__fieldThird}>
                        <FormGroup label={t('doctor_payer')}>
                            <Select
                                value={formData.related_user_id}
                                onChange={e => updateField('related_user_id', e.target.value)}
                                options={doctorUserOptions}
                                className="transaction-modal__select"
                            />
                        </FormGroup>
                    </div>
                )}

                {!requestId && (
                    <div className={styles.TransactionModal__fieldThird}>
                        <FormGroup label={t('beneficiary_doctor_cash_box')}>
                            <Select
                                value={formData.doctor_id}
                                onChange={e => updateDoctor(e.target.value)}
                                options={doctorOptions}
                                className="transaction-modal__select"
                            />
                        </FormGroup>
                    </div>
                )}

                {!requestId && formData.type === 'income_patient' && (
                    <div className={styles.TransactionModal__fieldThird}>
                        <FormGroup label={t('service_type')}>
                            <Select
                                value={formData.service_type}
                                onChange={e => updateServiceType(e.target.value)}
                                options={serviceTypes}
                                className="transaction-modal__select"
                            />
                        </FormGroup>
                    </div>
                )}





                <div className={styles.TransactionModal__fieldFull}>
                    <TransactionPaymentsSection 
                        pricingInfo={pricingInfo} totalPrice={totalPrice} setTotalPrice={setTotalPrice}
                        payments={formData.payments} handlePaymentChange={handlePaymentChange}
                        addPaymentMethod={addPaymentMethod} removePaymentMethod={removePaymentMethod}
                        currentPaidTotal={currentPaidTotal} debtAmount={debtAmount}
                        formatCurrency={formatCurrency} t={t}
                    />
                </div>

                <div className={styles.TransactionModal__fieldFull}>
                    <FormGroup label={t('description')}>
                        <AutoTextarea
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder={t('description_placeholder')}
                            className="transaction-modal__textarea"
                        />
                    </FormGroup>
                </div>

                <div className={styles.TransactionModal__fieldHalf}>
                    <FormGroup label={t('proof_payment_optional')}>
                        <Input
                            type="file"
                            onChange={e => updateField('proof', e.target.files[0])}
                            className="transaction-modal__file-input"
                        />
                    </FormGroup>
                </div>
            </div>
        </Modal>
    );
};

