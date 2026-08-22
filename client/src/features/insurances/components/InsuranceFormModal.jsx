import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Icon } from '@/components/atoms/Icon';
import { PhoneNumbersManager } from '@/components/molecules/PhoneNumbersManager';
import { capitalizeWords } from '@/utils/core/stringUtils';
import { useLanguage } from '@/hooks/useLanguage';
import { FormGroup } from '@/components/molecules/FormGroup';
import styles from './InsuranceFormModal.module.css';

export const InsuranceFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
    const { t } = useLanguage();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title={isEditing ? t('edit_insurance') : t('new_insurance')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onSubmit}>{t('save') || 'Guardar'}</Button>
                </>
            }
        >
            <div className={`${styles.InsuranceFormModal__form}`}>
                <div className={`${styles.InsuranceFormModal__sectionTitle}`}>{t('general_information') || 'Información General'}</div>
                
                {/* Row 1: Nombre, CUIT y Estado */}
                <div className={`${styles.InsuranceFormModal__row}`}>
                    <FormGroup label={`${t('name')} *`} className={`${styles.InsuranceFormModal__flex2}`}>
                        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: capitalizeWords(e.target.value) }))} />
                    </FormGroup>

                    <FormGroup label={`${t('cuit') || 'CUIT'}`} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.cuit} onChange={e => setFormData(prev => ({ ...prev, cuit: e.target.value }))} />
                    </FormGroup>

                    <FormGroup label={t('status') || 'Estado'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Select
                            value={formData.status}
                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            options={[
                                { value: 'active', label: t('active') || 'Activo' },
                                { value: 'inactive', label: t('inactive') || 'Inactivo' }
                            ]}
                        />
                    </FormGroup>
                </div>

                {/* Row 2: Website y Email */}
                <div className={`${styles.InsuranceFormModal__row}`}>
                    <FormGroup label={t('website') || 'Website'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.website} onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))} placeholder={t('insurance_website_placeholder') || "e.g. www.osde.com.ar"} />
                    </FormGroup>

                    <FormGroup label={t('email') || "Email"} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                        {formData.email && (
                            <a href={`mailto:${formData.email}`} className={`${styles.InsuranceFormModal__link}`}>
                                {t('send_email')} <Icon name="OPEN_IN_NEW" size="sm" />
                            </a>
                        )}
                    </FormGroup>
                </div>

                {/* Seccion Teléfonos */}
                <div className={`${styles.InsuranceFormModal__managerWrapper}`}>
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData(prev => ({ ...prev, phoneNumbers: newPhones }))}
                    />
                </div>

                {/* Sección Dirección */}
                <div className={`${styles.InsuranceFormModal__sectionTitle}`}>{t('address_details') || 'Dirección'}</div>
                
                {/* Row 3: Calle, Número, Piso y Depto en una sola fila horizontal */}
                <div className={`${styles.InsuranceFormModal__row}`}>
                    <FormGroup label={t('street_name') || 'Calle'} className={`${styles.InsuranceFormModal__flex3}`}>
                        <Input value={formData.street_name || ''} onChange={e => setFormData(prev => ({ ...prev, street_name: capitalizeWords(e.target.value) }))} placeholder={t('street_name_placeholder') || "Ej: Av. Rivadavia"} />
                    </FormGroup>
                    <FormGroup label={t('number_short') || 'Nro'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.street_number || ''} onChange={e => setFormData(prev => ({ ...prev, street_number: e.target.value }))} placeholder="123" />
                    </FormGroup>
                    <FormGroup label={t('floor') || 'Piso'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.floor || ''} onChange={e => setFormData(prev => ({ ...prev, floor: e.target.value }))} />
                    </FormGroup>
                    <FormGroup label={t('apartment_short') || 'Depto'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.apartment || ''} onChange={e => setFormData(prev => ({ ...prev, apartment: e.target.value }))} />
                    </FormGroup>
                </div>

                {/* Row 4: Ciudad y Provincia */}
                <div className={`${styles.InsuranceFormModal__row}`}>
                    <FormGroup label={t('city') || 'Ciudad'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.city || ''} onChange={e => setFormData(prev => ({ ...prev, city: capitalizeWords(e.target.value) }))} />
                    </FormGroup>
                    <FormGroup label={t('province') || 'Provincia'} className={`${styles.InsuranceFormModal__flex1}`}>
                        <Input value={formData.province || ''} onChange={e => setFormData(prev => ({ ...prev, province: capitalizeWords(e.target.value) }))} />
                    </FormGroup>
                </div>

                {/* Row 5: Notas de Dirección */}
                <FormGroup label={t('address_notes') || 'Notas de Dirección'}>
                    <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: capitalizeWords(e.target.value) }))} />
                    {(formData.street_name || formData.address) && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''} ${formData.address || ''}`.trim()
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.InsuranceFormModal__link}`}
                        >
                            {t('view_on_map')} <Icon name="OPEN_IN_NEW" size="sm" />
                        </a>
                    )}
                </FormGroup>
            </div>
        </Modal>
    );
};
