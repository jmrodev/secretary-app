import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import { capitalizeWords } from '@/utils/core/stringUtils';
import { useLanguage } from '@/hooks/useLanguage';
import FormGroup from '@/components/molecules/FormGroup';
import './InsuranceFormModal.css';

const InsuranceFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
    const { t } = useLanguage();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('edit_insurance') : t('new_insurance')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onSubmit}>{t('save') || 'Guardar'}</Button>
                </>
            }
        >
            <div className="insurance-modal__form">
                <FormGroup label={`${t('name')} *`}>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: capitalizeWords(e.target.value) })} autoFocus />
                </FormGroup>

                <FormGroup label="CUIT">
                    <Input value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                </FormGroup>

                <FormGroup label={t('website') || 'Website'}>
                    <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                </FormGroup>

                <div className="insurance-modal__manager-wrapper">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData({ ...formData, phoneNumbers: newPhones })}
                    />
                </div>

                <FormGroup label="Email">
                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    {formData.email && (
                        <a href={`mailto:${formData.email}`} className="insurance-modal__link">
                            {t('send_email')} <Icon name="OPEN_IN_NEW" size="sm" />
                        </a>
                    )}
                </FormGroup>

                <div className="insurance-modal__section-title">{t('address_details') || 'Dirección'}</div>
                
                <div className="insurance-modal__row">
                    <FormGroup label={t('street_name') || 'Calle'} className="insurance-modal__column--flex-3">
                        <Input value={formData.street_name || ''} onChange={e => setFormData({ ...formData, street_name: capitalizeWords(e.target.value) })} placeholder="Ej: Av. Rivadavia" />
                    </FormGroup>
                    <FormGroup label={t('number_short') || 'Nro'} className="insurance-modal__column--flex-1">
                        <Input value={formData.street_number || ''} onChange={e => setFormData({ ...formData, street_number: e.target.value })} placeholder="123" />
                    </FormGroup>
                </div>

                <div className="insurance-modal__row">
                    <FormGroup label={t('floor') || 'Piso'}>
                        <Input value={formData.floor || ''} onChange={e => setFormData({ ...formData, floor: e.target.value })} />
                    </FormGroup>
                    <FormGroup label={t('apartment_short') || 'Depto'}>
                        <Input value={formData.apartment || ''} onChange={e => setFormData({ ...formData, apartment: e.target.value })} />
                    </FormGroup>
                </div>

                <div className="insurance-modal__row">
                    <FormGroup label={t('city') || 'Ciudad'}>
                        <Input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: capitalizeWords(e.target.value) })} />
                    </FormGroup>
                    <FormGroup label={t('province') || 'Provincia'}>
                        <Input value={formData.province || ''} onChange={e => setFormData({ ...formData, province: capitalizeWords(e.target.value) })} />
                    </FormGroup>
                </div>

                <FormGroup label={t('address_notes') || 'Notas de Dirección'}>
                    <Input value={formData.address} onChange={e => setFormData({ ...formData, address: capitalizeWords(e.target.value) })} />
                    {(formData.street_name || formData.address) && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''} ${formData.address || ''}`.trim()
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="insurance-modal__link"
                        >
                            {t('view_on_map')} <Icon name="OPEN_IN_NEW" size="sm" />
                        </a>
                    )}
                </FormGroup>

                <FormGroup label={t('status') || 'Estado'}>
                    <Select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        options={[
                            { value: 'active', label: t('active') || 'Activo' },
                            { value: 'inactive', label: t('inactive') || 'Inactivo' }
                        ]}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default InsuranceFormModal;
