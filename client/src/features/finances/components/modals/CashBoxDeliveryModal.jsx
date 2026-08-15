import React from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import FormGroup from '@/components/molecules/FormGroup';
import styles from './CashBoxDeliveryModal.module.css';

/**
 * CashBoxDeliveryModal Feature Molecule.
 * Modal for recording physical cash delivery to doctors/owners.
 */
export const CashBoxDeliveryModal = ({ isOpen, onClose, onConfirm, doctorName, balance, amount, setAmount, t }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('close_box')}: ${doctorName}`}
            footer={
                <div className={`${styles.footer}`}>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={onConfirm} icon={<Icon name="FINANCES" size="1.1rem" />}>
                        {t('confirm_delivery')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.root} animate-fade-in`}>
                <div className={`${styles.balanceInfo}`}>
                    <span className={`${styles.label}`}>{t('current_system_balance')}:</span>
                    <span className={`${styles.value}`}>${balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <FormGroup label={t('amount_delivered')}>
                    <CurrencyInput
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder={balance}
                    />
                </FormGroup>

                <div className={`${styles.warning}`}>
                    <Icon name="WARNING" size="1.1rem" />
                    <span>{t('close_box_warning') || 'Esta acción registrará una salida de efectivo en la caja del profesional y ajustará el saldo.'}</span>
                </div>
            </div>
        </Modal>
    );
};

