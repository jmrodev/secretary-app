import React from 'react';
import Modal from '@/components/molecules/Modal';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useTransactionForm } from '@/features/finances/hooks/useTransactionForm';
import { formatPrice } from '@/utils/core/format';
import {
    getTransactionTypes,
    getPaymentMethods,
    getStatusOptions,
    getServiceTypes
} from '@/constants/transactionOptions';

// Atomic Components
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import AutoTextarea from '@/components/atoms/AutoTextarea';
import FormGroup from '@/components/molecules/FormGroup';
import { MedicationInput } from '@/features/medical_documents';
import './TransactionModal.css';

/**
 * TransactionSummaryHeader Sub-component.
 */
const TransactionSummaryHeader = ({ requestId, patientSearch, doctors, doctor_id, t }) => {
    if (!requestId) return null;
    return (
        <div className="transaction-modal__summary-header">
            <div className="transaction-modal__summary-item">
                <span className="transaction-modal__summary-label">{t('patient')}:</span>
                <span className="transaction-modal__summary-value">{patientSearch}</span>
            </div>
            <div className="transaction-modal__summary-item">
                <span className="transaction-modal__summary-label">{t('doctor')}:</span>
                <span className="transaction-modal__summary-value">{doctors.find(d => d.id === doctor_id)?.full_name}</span>
            </div>
        </div>
    );
};

/**
 * TransactionPaymentsSection Sub-component.
 */
const TransactionPaymentsSection = ({ 
    pricingInfo, totalPrice, setTotalPrice, payments, 
    handlePaymentChange, addPaymentMethod, removePaymentMethod, 
    currentPaidTotal, debtAmount, formatPrice, t 
}) => {
    const paymentMethods = getPaymentMethods(t);
    return (
        <div className="transaction-modal__payment-section">
            <div className="transaction-modal__totals">
                {pricingInfo && (
                    <div className="transaction-modal__pricing-alert">
                        <Icon name="info" size="1.1rem" className="transaction-modal__pricing-icon" />
                        <span>{pricingInfo}</span>
                    </div>
                )}
                <div className="transaction-modal__total-display">
                    <span className="transaction-modal__label transaction-modal__label--large">{t('total_to_charge')}:</span>
                    <div className="transaction-modal__total-input-wrapper">
                        <CurrencyInput
                            value={totalPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setTotalPrice(val);
                                if (payments.length === 1) {
                                    handlePaymentChange(0, 'amount', val);
                                }
                            }}
                            className="transaction-modal__total-input"
                        />
                    </div>
                </div>
            </div>

            <div className="transaction-modal__payment-methods-header">
                <label className="transaction-modal__payment-methods-title">{t('payment_methods')}</label>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={addPaymentMethod} 
                    icon={<Icon name="add_circle" size="1.1rem" />}
                    className="transaction-modal__add-btn"
                >
                    {t('add_payment_method')}
                </Button>
            </div>

            <div className="transaction-modal__payment-methods-list">
                {payments.map((payment, index) => (
                    <div key={payment._tmpId || index} className="transaction-modal__payment-row">
                        <div className="transaction-modal__payment-row-amount">
                            <CurrencyInput
                                placeholder={t('amount_label')}
                                value={payment.amount}
                                onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                className="transaction-modal__payment-input"
                            />
                        </div>
                        <div className="transaction-modal__payment-row-method">
                            <Select
                                value={payment.method}
                                onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                options={paymentMethods}
                                className="transaction-modal__payment-select"
                            />
                        </div>
                        <div className="transaction-modal__payment-row-action">
                            {payments.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    onClick={() => removePaymentMethod(index)}
                                    icon={<Icon name="close" size="1rem" />}
                                    className="transaction-modal__remove-btn"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="transaction-modal__payment-summary">
                {totalPrice > 0 && (
                    <div className="transaction-modal__summary-content">
                        <div className="transaction-modal__summary-line">
                            <span className="transaction-modal__label">{t('paid')}:</span>
                            <span className="transaction-modal__value transaction-modal__value--paid">{formatPrice(currentPaidTotal)}</span>
                        </div>
                        {debtAmount > 0 ? (
                            <div className="transaction-modal__summary-line">
                                <span className="transaction-modal__label">{t('debt')}:</span>
                                <span className="transaction-modal__value transaction-modal__value--debt">{formatPrice(debtAmount)}</span>
                            </div>
                        ) : (
                            <div className="transaction-modal__status-paid">
                                <Icon name="check" size="1.2rem" className="transaction-modal__status-icon" />
                                {t('completed_payment')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * TransactionModal Molecule.
 * Orchestrates the creation and editing of financial records.
 */
const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = null, requestId }) => {
    const { t } = useLanguage();
    const { settings } = useConfig();

    const {
        formData,
        loading,
        patients,
        doctors,
        pricingInfo,
        totalPrice,
        patientSearch,
        showPatientList,
        setPatientSearch,
        setShowPatientList,
        updateField,
        updateServiceType,
        updateDoctor,
        selectPatient,
        handlePaymentChange,
        addPaymentMethod,
        removePaymentMethod,
        saveTransaction,
        medications,
        selectedPatient,
        addMedication,
        removeMedication,
        setTotalPrice
    } = useTransactionForm(isOpen, initialData, requestId, onSuccess, onClose);

    const currentPaidTotal = formData.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const debtAmount = Math.max(0, totalPrice - currentPaidTotal);

    const transactionTypes = getTransactionTypes(t);
    const statusOptions = getStatusOptions(t);
    const serviceTypes = getServiceTypes(t);

    const doctorOptions = React.useMemo(() => [
        { value: '', label: t('select_doctor') }, 
        ...doctors.map(d => ({ value: d.id, label: d.full_name }))
    ], [doctors, t]);

    const doctorUserOptions = React.useMemo(() => [
        { value: '', label: t('select_doctor') }, 
        ...doctors.map(d => ({ value: d.user_id, label: d.full_name }))
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
            footer={
                <div className="transaction-modal__footer">
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={saveTransaction} disabled={loading} variant="primary" icon={<Icon name="check" size="1.2rem" />}>
                        {loading ? t('processing') : t('confirm_payment')}
                    </Button>
                </div>
            }
        >
            <div className="transaction-modal">
                <TransactionSummaryHeader 
                    requestId={requestId} 
                    patientSearch={patientSearch} 
                    doctors={doctors} 
                    doctor_id={formData.doctor_id} 
                    t={t} 
                />

                {!requestId && (
                    <FormGroup label={t('type')}>
                        <Select
                            value={formData.type}
                            onChange={e => updateField('type', e.target.value)}
                            options={transactionTypes}
                            className="transaction-modal__select"
                        />
                    </FormGroup>
                )}

                {!requestId && formData.type === 'income_patient' && (
                    <FormGroup label={t('patient')}>
                        <div className="transaction-modal__autocomplete">
                            <Input
                                value={patientSearch}
                                onChange={(e) => {
                                    setPatientSearch(e.target.value);
                                    setShowPatientList(true);
                                    updateField('related_user_id', '');
                                }}
                                onFocus={() => !initialData?.patientId && setShowPatientList(true)}
                                placeholder={t('search_name_dni')}
                                disabled={!!initialData?.patientId}
                                icon={<Icon name="search" size="1.1rem" />}
                                className="transaction-modal__input"
                            />
                            {showPatientList && patientSearch && !formData.related_user_id && (
                                <ul className="transaction-modal__results" role="listbox">
                                    {filteredPatients.map(p => (
                                        <li
                                            key={p.id}
                                            onClick={() => selectPatient(p)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    selectPatient(p);
                                                }
                                            }}
                                            className="transaction-modal__item"
                                            role="option"
                                            aria-selected={false}
                                            tabIndex={0}
                                        >
                                            <span className="transaction-modal__item-name">{p.full_name}</span>
                                            <span className="transaction-modal__hint">{p.dni}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </FormGroup>
                )}

                {formData.type === 'income_rental' && (
                    <FormGroup label={t('doctor_payer')}>
                        <Select
                            value={formData.related_user_id}
                            onChange={e => updateField('related_user_id', e.target.value)}
                            options={doctorUserOptions}
                            className="transaction-modal__select"
                        />
                    </FormGroup>
                )}

                {!requestId && (
                    <FormGroup label={t('beneficiary_doctor_cash_box')}>
                        <Select
                            value={formData.doctor_id}
                            onChange={e => updateDoctor(e.target.value)}
                            options={doctorOptions}
                            className="transaction-modal__select"
                        />
                    </FormGroup>
                )}

                {!requestId && formData.type === 'income_patient' && (
                    <FormGroup label={t('service_type')}>
                        <Select
                            value={formData.service_type}
                            onChange={e => updateServiceType(e.target.value)}
                            options={serviceTypes}
                            className="transaction-modal__select"
                        />
                    </FormGroup>
                )}

                {!requestId && formData.type === 'income_patient' && (
                    <MedicationInput
                        medications={medications}
                        onAdd={addMedication}
                        onRemove={removeMedication}
                        selectedPatient={selectedPatient}
                        label={t('medications')}
                        className="transaction-modal__medication-input"
                    />
                )}

                <TransactionPaymentsSection 
                    pricingInfo={pricingInfo}
                    totalPrice={totalPrice}
                    setTotalPrice={setTotalPrice}
                    payments={formData.payments}
                    handlePaymentChange={handlePaymentChange}
                    addPaymentMethod={addPaymentMethod}
                    removePaymentMethod={removePaymentMethod}
                    currentPaidTotal={currentPaidTotal}
                    debtAmount={debtAmount}
                    formatPrice={formatPrice}
                    t={t}
                />

                {!requestId && (
                    <FormGroup label={t('status')}>
                        <Select
                            value={formData.status}
                            onChange={e => updateField('status', e.target.value)}
                            options={statusOptions}
                            className="transaction-modal__select"
                        />
                    </FormGroup>
                )}

                {!requestId && settings.allow_admin_edit_finance_date === 'true' && (
                    <FormGroup label={t('transaction_date')}>
                        <Input
                            type="datetime-local"
                            value={formData.transaction_date}
                            onChange={e => updateField('transaction_date', e.target.value)}
                            className="transaction-modal__input"
                        />
                        <div className="transaction-modal__date-warning">
                            <Icon name="warning" size="1.1rem" className="transaction-modal__warning-icon" />
                            <span>{t('edit_date_warning')}</span>
                        </div>
                    </FormGroup>
                )}

                <FormGroup label={t('description')}>
                    <AutoTextarea
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder={t('description_placeholder')}
                        className="transaction-modal__textarea"
                    />
                </FormGroup>

                <FormGroup label={t('proof_payment_optional')}>
                    <Input
                        type="file"
                        onChange={e => updateField('proof', e.target.files[0])}
                        className="transaction-modal__file-input"
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default TransactionModal;
