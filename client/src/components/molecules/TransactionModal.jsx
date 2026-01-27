import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useConfig } from '../../context/ConfigContext';
import { useTransactionForm } from '../../hooks/useTransactionForm';
import { formatPrice } from '../../utils/format';
import {
    getTransactionTypes,
    getPaymentMethods,
    getStatusOptions,
    getServiceTypes
} from '../../constants/transactionOptions';

// Atomic Components
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import CurrencyInput from '../atoms/CurrencyInput';
import FormGroup from './FormGroup';
import PrescriptionSection from './PrescriptionSection';

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
        removeMedication
    } = useTransactionForm(isOpen, initialData, requestId, onSuccess, onClose);

    // Derived State
    const currentPaidTotal = formData.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const debtAmount = Math.max(0, totalPrice - currentPaidTotal);

    // Options from Constants
    const transactionTypes = getTransactionTypes(t);
    const paymentMethods = getPaymentMethods(t);
    const statusOptions = getStatusOptions(t);
    const serviceTypes = getServiceTypes(t);

    const doctorOptions = [{ value: '', label: t('select_doctor') || 'Seleccionar Profesional' }, ...doctors.map(d => ({ value: d.id, label: d.full_name }))];
    const doctorUserOptions = [{ value: '', label: t('select_doctor') || 'Seleccionar Profesional' }, ...doctors.map(d => ({ value: d.user_id, label: d.full_name }))];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('record_payment')}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={loading} variant="primary">
                        {loading ? t('processing') : t('confirm_payment')}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Transaction Type */}
                <FormGroup label={t('type')}>
                    <Select
                        value={formData.type}
                        onChange={e => updateField('type', e.target.value)}
                        options={transactionTypes}
                    />
                </FormGroup>

                {/* Patient Search (Autocomplete) */}
                {formData.type === 'income_patient' && (
                    <FormGroup label={t('patient')}>
                        <div className="relative">
                            <Input
                                value={patientSearch}
                                onChange={(e) => {
                                    setPatientSearch(e.target.value);
                                    setShowPatientList(true);
                                    updateField('related_user_id', '');
                                }}
                                onFocus={() => !initialData?.patientId && setShowPatientList(true)}
                                placeholder={t('search_name_dni')}
                                className={initialData?.patientId ? 'bg-gray-100 cursor-not-allowed' : ''}
                                disabled={!!initialData?.patientId}
                            />
                            {showPatientList && patientSearch && !formData.related_user_id && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                                    {patients.filter(p =>
                                        p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                        (p.dni && p.dni.includes(patientSearch))
                                    ).map(p => (
                                        <li
                                            key={p.id}
                                            onClick={() => selectPatient(p)}
                                            className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                                        >
                                            {p.full_name} <span className="text-gray-400 text-xs">{p.dni}</span>
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

                {/* Beneficiary Doctor */}
                <FormGroup label={t('beneficiary_doctor_cash_box')}>
                    <Select
                        value={formData.doctor_id}
                        onChange={e => updateDoctor(e.target.value)}
                        options={doctorOptions}
                    />
                </FormGroup>

                {/* Service Type */}
                {formData.type === 'income_patient' && (
                    <FormGroup label={t('service_type')}>
                        <Select
                            value={formData.service_type}
                            onChange={e => updateServiceType(e.target.value)}
                            options={serviceTypes}
                        />
                    </FormGroup>
                )}

                {/* Medication Autocomplete (Only for prescriptions or consultations) */}
                {formData.type === 'income_patient' && (
                    <PrescriptionSection
                        medications={medications}
                        onAdd={addMedication}
                        onRemove={removeMedication}
                        selectedPatient={selectedPatient}
                    />
                )}

                {/* Payments Section */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-700">{t('payment_methods')}</label>
                        <Button variant="ghost" size="sm-compact" onClick={addPaymentMethod} className="text-blue-600">
                            + {t('add_payment_method') || 'Agregar'}
                        </Button>
                    </div>

                    {formData.payments.map((payment, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center animate-fadeIn">
                            <div className="col-span-5">
                                <CurrencyInput
                                    placeholder={t('amount')}
                                    className="input-field w-full text-right"
                                    value={payment.amount}
                                    onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                />
                            </div>
                            <div className="col-span-6">
                                <Select
                                    value={payment.method}
                                    onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                    options={paymentMethods}
                                />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                {formData.payments.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm-icon"
                                        className="text-red-500 hover:bg-red-50"
                                        onClick={() => removePaymentMethod(index)}
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="mt-2 text-right text-sm">
                        {pricingInfo && (
                            <p className="text-xs text-gray-500 mb-1 italic">{pricingInfo}</p>
                        )}
                        <div className="flex justify-end items-center gap-3 font-medium">
                            {totalPrice > 0 && (
                                <>
                                    <span className="text-gray-600">{t('total')}: {formatPrice(totalPrice)}</span>
                                    <span className="text-green-600">{t('paid')}: {formatPrice(currentPaidTotal)}</span>
                                    {debtAmount > 0 ? (
                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full text-xs border border-red-100">
                                            {t('debt')}: {formatPrice(debtAmount)}
                                        </span>
                                    ) : (
                                        <span className="text-green-600 font-bold">✓</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status */}
                <FormGroup label={t('status')}>
                    <Select
                        value={formData.status}
                        onChange={e => updateField('status', e.target.value)}
                        options={statusOptions}
                    />
                </FormGroup>

                {/* Date */}
                {settings.allow_admin_edit_finance_date === 'true' && (
                    <FormGroup label={t('transaction_date') || 'Fecha de Transacción'} className="relative">
                        <Input
                            type="datetime-local"
                            value={formData.transaction_date}
                            onChange={e => updateField('transaction_date', e.target.value)}
                        />
                        <p className="text-xs text-amber-600 mt-1">⚠️ {t('edit_date_warning') || 'Modificar la fecha afecta el orden en la caja diaria.'}</p>
                    </FormGroup>
                )}

                {/* Description */}
                <FormGroup label={t('description')}>
                    <Input
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Descripción, detalle del cobro..."
                    />
                </FormGroup>

                {/* Proof */}
                <FormGroup label={t('proof_payment_optional') || 'Comprobante (Opcional)'}>
                    <Input
                        type="file"
                        onChange={e => updateField('proof', e.target.files[0])}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default TransactionModal;
