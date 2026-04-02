import React from 'react';
import Modal from '../../../components/molecules/Modal';
import { useLanguage } from '../../../context/LanguageContext';
import { useConfig } from '../../../context/ConfigContext';
import { useTransactionForm } from '../hooks/useTransactionForm';
import { formatPrice } from '../../../utils/format';
import {
    getTransactionTypes,
    getPaymentMethods,
    getStatusOptions,
    getServiceTypes
} from '../../../constants/transactionOptions';

// Atomic Components
import Input from '../../../components/atoms/Input';
import Select from '../../../components/atoms/Select';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import CurrencyInput from '../../../components/atoms/CurrencyInput';
import FormGroup from '../../../components/molecules/FormGroup';
import PrescriptionSection from '../../../components/molecules/PrescriptionSection';
import './TransactionModal.css';

const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = null, requestId }) => {
    const { t } = useLanguage();
    const { settings } = useConfig();

    // Logic Hook
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
        handleSubmit,
        medications,
        selectedPatient,
        addMedication,
        removeMedication,
        setTotalPrice
    } = useTransactionForm(isOpen, initialData, requestId, onSuccess, onClose);

    // Derived State
    const currentPaidTotal = formData.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const debtAmount = Math.max(0, totalPrice - currentPaidTotal);

    // Options from Constants
    const transactionTypes = getTransactionTypes(t);
    const paymentMethods = getPaymentMethods(t);
    const statusOptions = getStatusOptions(t);
    const serviceTypes = getServiceTypes(t);

    const doctorOptions = [{ value: '', label: t('select_doctor') }, ...doctors.map(d => ({ value: d.id, label: d.full_name }))];
    const doctorUserOptions = [{ value: '', label: t('select_doctor') }, ...doctors.map(d => ({ value: d.user_id, label: d.full_name }))];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('record_payment')}
            footer={
                <div className="transaction-modal-footer">
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={loading} variant="primary" icon={<Icon name="check" size="1.2rem" />}>
                        {loading ? t('processing') : t('confirm_payment')}
                    </Button>
                </div>
            }
        >
            <div className="transaction-modal">
                {/* Information Header for Requests/Known Transactions */}
                {requestId && (
                    <div className="transaction-modal__summary-header">
                        <div className="summary-item">
                            <span className="summary-label">{t('patient')}:</span>
                            <span className="summary-value">{patientSearch}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">{t('doctor')}:</span>
                            <span className="summary-value">{doctors.find(d => d.id === formData.doctor_id)?.full_name}</span>
                        </div>
                    </div>
                )}

                {/* Transaction Type - Hidden for specific requests */}
                {!requestId && (
                    <FormGroup label={t('type')}>
                        <Select
                            value={formData.type}
                            onChange={e => updateField('type', e.target.value)}
                            options={transactionTypes}
                        />
                    </FormGroup>
                )}

                {/* Patient Search (Autocomplete) - Hidden for specific requests */}
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
                            />
                            {showPatientList && patientSearch && !formData.related_user_id && (
                                <ul className="transaction-modal__results">
                                    {patients.filter(p =>
                                        p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                        (p.dni && p.dni.includes(patientSearch))
                                    ).map(p => (
                                        <li
                                            key={p.id}
                                            onClick={() => selectPatient(p)}
                                            className="transaction-modal__item"
                                        >
                                            {p.full_name} <span className="transaction-modal__hint">{p.dni}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </FormGroup>
                )}

                {/* Rental Logic */}
                {formData.type === 'income_rental' && (
                    <FormGroup label={t('doctor_payer')}>
                        <Select
                            value={formData.related_user_id}
                            onChange={e => updateField('related_user_id', e.target.value)}
                            options={doctorUserOptions}
                        />
                    </FormGroup>
                )}

                {/* Beneficiary Doctor - Hidden for specific requests */}
                {!requestId && (
                    <FormGroup label={t('beneficiary_doctor_cash_box')}>
                        <Select
                            value={formData.doctor_id}
                            onChange={e => updateDoctor(e.target.value)}
                            options={doctorOptions}
                        />
                    </FormGroup>
                )}

                {/* Service Type - Hidden for specific requests */}
                {!requestId && formData.type === 'income_patient' && (
                    <FormGroup label={t('service_type')}>
                        <Select
                            value={formData.service_type}
                            onChange={e => updateServiceType(e.target.value)}
                            options={serviceTypes}
                        />
                    </FormGroup>
                )}

                {/* Medication Autocomplete - Hidden for specific requests as it comes from the medical side */}
                {!requestId && formData.type === 'income_patient' && (
                    <PrescriptionSection
                        medications={medications}
                        onAdd={addMedication}
                        onRemove={removeMedication}
                        selectedPatient={selectedPatient}
                    />
                )}

                {/* Payments Section */}
                <div className="payment-methods-card">
                    <div className="payment-summary__totals payment-summary__totals--main">
                        {pricingInfo && (
                            <p className="payment-summary__pricing-info">
                                <Icon name="info" size="1.1rem" />
                                {pricingInfo}
                            </p>
                        )}
                        <div className="payment-summary__row">
                            <span className="payment-summary__label payment-summary__label--large">{t('total_to_charge')}:</span>
                            <div className="payment-summary__input-wrapper payment-summary__input-wrapper--large">
                                <CurrencyInput
                                    value={totalPrice}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setTotalPrice(val);
                                        if (formData.payments.length === 1) {
                                            handlePaymentChange(0, 'amount', val);
                                        }
                                    }}
                                    className="payment-summary__total-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="payment-methods-card__header">
                        <label className="payment-methods-card__title">{t('payment_methods')}</label>
                        <Button variant="ghost" size="sm-compact" onClick={addPaymentMethod} icon={<Icon name="add" size="1.1rem" />}>
                            {t('add_payment_method')}
                        </Button>
                    </div>

                    {formData.payments.map((payment, index) => (
                        <div key={index} className="payment-row">
                            <div className="payment-row__amount">
                                <CurrencyInput
                                    placeholder={t('amount_label')}
                                    value={payment.amount}
                                    onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                />
                            </div>
                            <div className="payment-row__method">
                                <Select
                                    value={payment.method}
                                    onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                    options={paymentMethods}
                                />
                            </div>
                            <div className="payment-row__action">
                                {formData.payments.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm-icon"
                                        onClick={() => removePaymentMethod(index)}
                                        icon={<Icon name="close" size="1rem" />}
                                    />
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="payment-summary">
                        <div className="payment-summary__totals">
                            {totalPrice > 0 && (
                                <>
                                    <div className="payment-summary__row">
                                        <span className="payment-summary__label">{t('paid')}:</span>
                                        <span className="payment-summary__value payment-summary__value--paid">{formatPrice(currentPaidTotal)}</span>
                                    </div>
                                    {debtAmount > 0 ? (
                                        <div className="payment-summary__row">
                                            <span className="payment-summary__label">{t('debt')}:</span>
                                            <span className="payment-summary__value payment-summary__value--debt">{formatPrice(debtAmount)}</span>
                                        </div>
                                    ) : (
                                        <div className="payment-summary__status">
                                            <Icon name="check" size="1.2rem" />
                                            {t('completed_payment')}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status - Hidden for specific requests as it defaults to 'paid' */}
                {!requestId && (
                    <FormGroup label={t('status')}>
                        <Select
                            value={formData.status}
                            onChange={e => updateField('status', e.target.value)}
                            options={statusOptions}
                        />
                    </FormGroup>
                )}

                {/* Date */}
                {/* Date - Hidden for specific requests as it defaults to NOW() */}
                {!requestId && settings.allow_admin_edit_finance_date === 'true' && (
                    <FormGroup label={t('transaction_date')}>
                        <Input
                            type="datetime-local"
                            value={formData.transaction_date}
                            onChange={e => updateField('transaction_date', e.target.value)}
                        />
                        <p className="edit-transaction-form__warning">
                            <Icon name="warning" size="1.1rem" />
                            {t('edit_date_warning')}
                        </p>
                    </FormGroup>
                )}

                {/* Description */}
                <FormGroup label={t('description')}>
                    <Input
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder={t('description_placeholder')}
                    />
                </FormGroup>

                {/* Proof */}
                <FormGroup label={t('proof_payment_optional')}>
                    <Input
                        type="file"
                        onChange={e => updateField('proof', e.target.files[0])}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default TransactionModal;
