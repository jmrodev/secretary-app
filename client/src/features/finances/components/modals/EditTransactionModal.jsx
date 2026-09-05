import React, { useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { AutoTextarea } from '@/components/atoms/AutoTextarea';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { FormGroup } from '@/components/molecules/FormGroup';
import { toInputDateTime, parseDate } from '@/utils/core/dateUtils';
import { printInvoice } from '@/utils/printing/printInvoice';
import styles from './EditTransactionModal.module.css';

/**
 * EditTransactionModal Molecule.
 * Unified modal for reviewing transaction details and quick inline editing.
 * Refactored to follow BEM, Design Tokens, and Atomic Design standards.
 */
export const EditTransactionModal = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    setTransaction,
    settings,
    user,
    t
}) => {
    const [isEditing, setIsEditing] = useState(Boolean(transaction?._isDirectEdit));
    const [localOverrides, setLocalOverrides] = useState({});

    if (!transaction) return null;

    const formData = { ...transaction, ...localOverrides };

    const handleFormChange = (field, value) => {
        setLocalOverrides(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const formattedDate = toInputDateTime(formData?.transaction_date);

    const formatDateUnambiguous = (dateStr) => {
        if (!dateStr) return '-';
        const d = parseDate(dateStr);
        if (!d || isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const months = t('months_array') || [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');

        const format = t('date_format_long') || '{day} de {month} de {year}';
        return `${format.replace('{day}', day).replace('{month}', month).replace('{year}', year)} - ${hours}:${mins} hs`;
    };

    const handlePrintInvoice = () => {
        if (!formData.invoice_number) return;
        printInvoice({
            ptoVta: formData.invoice_punto_vta,
            number: formData.invoice_number,
            cbteTipo: formData.invoice_cbte_tipo,
            cae: formData.invoice_cae,
            vto: formData.invoice_cae_vto,
            fecha: formData.transaction_date ? new Date(formData.transaction_date).toISOString().split('T')[0] : null,
            patient: formData.patient_full_name,
            patientDni: formData.patient_dni,
            doctor: formData.doctor_name,
            doctorCuit: formData.doctor_cuit,
            amount: formData.amount
        });
    };

    const paymentMethods = [
        { value: 'cash', label: t('cash') },
        { value: 'transfer', label: t('transfer') },
        { value: 'card', label: t('card') },
        { value: 'on_account', label: t('on_account') }
    ];

    const statusOptions = [
        { value: 'paid', label: t('paid') },
        { value: 'pending', label: t('pending') }
    ];

    const isWithdrawal = Boolean(formData.is_withdrawal) || formData.type === 'withdrawal' || formData.type === 'expense_withdrawal';
    const isPending = formData.status === 'pending' || formData.payment_status === 'pending';
    const isIncome = !isWithdrawal && !isPending && (
        formData.type === 'income' ||
        formData.type?.includes('income') ||
        formData.type === 'appointment' ||
        formData.type === 'request' ||
        Boolean(formData.appointment_id) ||
        Boolean(formData.request_type) ||
        Number(formData.amount) > 0
    );

    const typeBadgeVariant = isIncome ? 'success' : (isWithdrawal ? 'warning' : (isPending ? 'danger' : 'rejected'));
    const statusBadgeVariant = formData.bonified === 1 ? 'info' : (formData.status === 'paid' ? 'success' : 'danger');

    const canEdit = user && (user.role === 'admin' || settings?.enable_secretary_finance_crud === 'true');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('edit_transaction') : t('transaction_detail')}
            size="md"
            footer={
                <div className={styles.EditTransactionModal__footer}>
                    {isEditing ? (
                        <>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleSave} variant="primary" icon={<Icon name="save" size="1.1rem" />}>
                                {t('save')}
                            </Button>
                        </>
                    ) : (
                        <>
                            {formData.invoice_number && (
                                <Button
                                    variant="secondary"
                                    onClick={handlePrintInvoice}
                                    icon={<Icon name="PRINT" size="1.1rem" />}
                                >
                                    {t('print_invoice')}
                                </Button>
                            )}
                            <Button variant="secondary" onClick={onClose}>
                                {t('close_action')}
                            </Button>
                            {canEdit && (
                                <Button
                                    variant="primary"
                                    onClick={() => setIsEditing(true)}
                                    icon={<Icon name="edit" size="1.1rem" />}
                                >
                                    {t('edit')}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            }
        >
            <div className={`${styles.EditTransactionModal__root} animate-fade-in`}>
                {!isEditing ? (
                    /* Read-Only Structured Detail View */
                    <div className={styles.EditTransactionModal__detailView}>
                        {/* Header with Type & Status Badges */}
                        <div className={styles.EditTransactionModal__headerBadges}>
                            <Badge variant={typeBadgeVariant}>
                                {formData.appointment_id
                                    ? t('appointment')
                                    : formData.request_type
                                        ? (t(formData.request_type) || formData.request_type)
                                        : (t(formData.type) || formData.type?.replace('_', ' ') || t('transaction'))}
                            </Badge>
                            <Badge variant={statusBadgeVariant}>
                                {formData.bonified === 1
                                    ? t('bonified')
                                    : (formData.status === 'paid' ? t('paid') : (t(formData.status) || formData.status))}
                            </Badge>
                        </div>

                        {/* Amount Highlight Card */}
                        <div className={`${styles.EditTransactionModal__amountCard} ${isWithdrawal ? styles.EditTransactionModal__amountCardWithdrawal : (isIncome ? styles.EditTransactionModal__amountCardIncome : styles.EditTransactionModal__amountCardExpense)}`}>
                            <span className={styles.EditTransactionModal__amountLabel}>{t('total_amount')}</span>
                            <span className={styles.EditTransactionModal__amountValue}>
                                {isWithdrawal ? '↩ ' : (isIncome ? '+ ' : '- ')}${Math.abs(Number(formData.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Metadata Grid */}
                        <div className={styles.EditTransactionModal__metaGrid}>
                            <div className={styles.EditTransactionModal__metaItem}>
                                <span className={styles.EditTransactionModal__metaLabel}>{t('date_time')}</span>
                                <span className={styles.EditTransactionModal__metaValue}>
                                    {formatDateUnambiguous(formData.transaction_date)}
                                </span>
                            </div>

                            <div className={styles.EditTransactionModal__metaItem}>
                                <span className={styles.EditTransactionModal__metaLabel}>{t('payment_method')}</span>
                                <span className={styles.EditTransactionModal__metaValue}>
                                    {t(formData.method) || formData.method || t('cash')}
                                </span>
                            </div>

                            <div className={styles.EditTransactionModal__metaItem}>
                                <span className={styles.EditTransactionModal__metaLabel}>{t('beneficiary_patient')}</span>
                                <span className={styles.EditTransactionModal__metaValue}>
                                    {formData.patient_full_name || formData.doctor_name || t('general_clinic')}
                                </span>
                            </div>

                            {formData.doctor_name && formData.patient_full_name && (
                                <div className={styles.EditTransactionModal__metaItem}>
                                    <span className={styles.EditTransactionModal__metaLabel}>{t('doctor_in_charge')}</span>
                                    <span className={styles.EditTransactionModal__metaValue}>
                                        Dr. {formData.doctor_name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description Section */}
                        {formData.description && (
                            <div className={styles.EditTransactionModal__descriptionCard}>
                                <span className={styles.EditTransactionModal__metaLabel}>{t('description')}</span>
                                <p className={styles.EditTransactionModal__descriptionText}>{formData.description}</p>
                            </div>
                        )}

                        {/* Proof Attachment */}
                        {formData.proof_file && (
                            <div className={styles.EditTransactionModal__proofCard}>
                                <Icon name="attachment" size="1.2rem" className={styles.EditTransactionModal__proofIcon} />
                                <div className={styles.EditTransactionModal__proofInfo}>
                                    <span className={styles.EditTransactionModal__proofLabel}>{t('proof_file_attached')}</span>
                                    <a
                                        href={formData.proof_file}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.EditTransactionModal__proofLink}
                                    >
                                        {t('view_file')}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* AFIP Electronic Invoice Info */}
                        {formData.invoice_number && (
                            <div className={styles.EditTransactionModal__afipCard}>
                                <div className={styles.EditTransactionModal__afipHeader}>
                                    <Icon name="receipt" size="1.2rem" />
                                    <span>{t('electronic_invoice_afip')}</span>
                                </div>
                                <div className={styles.EditTransactionModal__afipGrid}>
                                    <div>
                                        <span className={styles.EditTransactionModal__metaLabel}>{t('invoice_type')}</span>
                                        <div className={styles.EditTransactionModal__afipNumber}>
                                            {t('invoice')} {formData.invoice_cbte_tipo === 11 ? 'C' : formData.invoice_cbte_tipo} N° {String(formData.invoice_punto_vta || 1).padStart(4, '0')}-{String(formData.invoice_number).padStart(8, '0')}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={styles.EditTransactionModal__metaLabel}>{t('invoice_cae_vto')}</span>
                                        <div className={styles.EditTransactionModal__metaValue}>
                                            {formData.invoice_cae} (Vto: {formData.invoice_cae_vto || '-'})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Edit Mode Form */
                    <div className={styles.EditTransactionModal__editForm}>
                        <FormGroup label={t('amount')}>
                            <CurrencyInput
                                value={formData.amount}
                                onChange={e => handleFormChange('amount', e.target.value)}
                            />
                        </FormGroup>

                        <FormGroup label={t('description')}>
                            <AutoTextarea
                                value={formData.description}
                                onChange={e => handleFormChange('description', e.target.value)}
                                placeholder={t('description_placeholder')}
                            />
                        </FormGroup>

                        <div className={styles.EditTransactionModal__formRow}>
                            <FormGroup label={t('payment_method')}>
                                <Select
                                    value={formData.method}
                                    onChange={e => handleFormChange('method', e.target.value)}
                                    options={paymentMethods}
                                />
                            </FormGroup>

                            <FormGroup label={t('status')}>
                                <Select
                                    value={formData.status}
                                    onChange={e => handleFormChange('status', e.target.value)}
                                    options={statusOptions}
                                />
                            </FormGroup>
                        </div>

                        {((settings?.allow_admin_edit_finance_date === 'true') || (user && user.role === 'admin')) && (
                            <FormGroup label={t('transaction_date')}>
                                <Input
                                    type="datetime-local"
                                    value={formattedDate}
                                    onChange={e => handleFormChange('transaction_date', e.target.value)}
                                />
                                <div className={styles.EditTransactionModal__warning}>
                                    <Icon name="WARNING" size="1.1rem" className={styles.EditTransactionModal__warningIcon} />
                                    <span>{t('date_order_warning') || t('date_browser_warning')}</span>
                                </div>
                            </FormGroup>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};


