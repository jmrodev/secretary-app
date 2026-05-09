import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import { capitalizeWords } from '@/utils/stringUtils';
import { useLanguage } from '@/hooks/useLanguage';
import './InsuranceFormModal.css';

const InsuranceFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
    const { t } = useLanguage();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Obra Social" : "Nueva Obra Social"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSubmit}>Guardar</Button>
                </>
            }
        >
            <div className="insurance-modal__form">
                <div className="input-group">
                    <label className="input-label">Name *</label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: capitalizeWords(e.target.value) })} autoFocus />
                </div>
                <div className="input-group">
                    <label className="input-label">CUIT</label>
                    <Input value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">Website</label>
                    <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                </div>
                <div className="insurance-modal__manager-wrapper">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData({ ...formData, phoneNumbers: newPhones })}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    {formData.email && (
                        <a href={`mailto:${formData.email}`} className="insurance-modal__link">
                            {t('send_email')} <Icon name="OPEN_IN_NEW" size="sm" />
                        </a>
                    )}
                </div>
                <div className="insurance-modal__section-title">Dirección</div>
                <div className="insurance-modal__row">
                    <div className="input-group insurance-modal__column--flex-3">
                        <label className="input-label">Nombre de Calle</label>
                        <Input value={formData.street_name || ''} onChange={e => setFormData({ ...formData, street_name: capitalizeWords(e.target.value) })} placeholder="Ej: Av. Rivadavia" />
                    </div>
                    <div className="input-group insurance-modal__column--flex-1">
                        <label className="input-label">Nro</label>
                        <Input value={formData.street_number || ''} onChange={e => setFormData({ ...formData, street_number: e.target.value })} placeholder="123" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">Piso</label>
                        <Input value={formData.floor || ''} onChange={e => setFormData({ ...formData, floor: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Depto</label>
                        <Input value={formData.apartment || ''} onChange={e => setFormData({ ...formData, apartment: e.target.value })} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">Ciudad</label>
                        <Input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: capitalizeWords(e.target.value) })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Provincia</label>
                        <Input value={formData.province || ''} onChange={e => setFormData({ ...formData, province: capitalizeWords(e.target.value) })} />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Notas de Dirección / Referencias</label>
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
                </div>
                <div className="input-group">
                    <label className="input-label">Estado</label>
                    <Select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        options={[
                            { value: 'active', label: 'Activo' },
                            { value: 'inactive', label: 'Inactivo' }
                        ]}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default InsuranceFormModal;
