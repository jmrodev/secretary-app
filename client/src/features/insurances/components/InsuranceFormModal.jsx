import React from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';
import PhoneNumbersManager from '../../../components/molecules/PhoneNumbersManager';
import { capitalizeWords } from '../../../utils/stringUtils';
import { useLanguage } from '../../../context/LanguageContext';
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
                    <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: capitalizeWords(e.target.value) })} autoFocus />
                </div>
                <div className="input-group">
                    <label className="input-label">CUIT</label>
                    <input className="input-field" value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">Website</label>
                    <input className="input-field" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                </div>
                <div className="insurance-modal__manager-wrapper">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData({ ...formData, phoneNumbers: newPhones })}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    {formData.email && (
                        <a href={`mailto:${formData.email}`} className="insurance-modal__link">
                            {t('send_email')} ↗
                        </a>
                    )}
                </div>
                <div className="insurance-modal__section-title">Dirección</div>
                <div className="insurance-modal__row">
                    <div className="input-group insurance-modal__column--flex-3">
                        <label className="input-label">Nombre de Calle</label>
                        <input className="input-field" value={formData.street_name || ''} onChange={e => setFormData({ ...formData, street_name: capitalizeWords(e.target.value) })} placeholder="Ej: Av. Rivadavia" />
                    </div>
                    <div className="input-group insurance-modal__column--flex-1">
                        <label className="input-label">Nro</label>
                        <input className="input-field" value={formData.street_number || ''} onChange={e => setFormData({ ...formData, street_number: e.target.value })} placeholder="123" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">Piso</label>
                        <input className="input-field" value={formData.floor || ''} onChange={e => setFormData({ ...formData, floor: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Depto</label>
                        <input className="input-field" value={formData.apartment || ''} onChange={e => setFormData({ ...formData, apartment: e.target.value })} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">Ciudad</label>
                        <input className="input-field" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: capitalizeWords(e.target.value) })} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Provincia</label>
                        <input className="input-field" value={formData.province || ''} onChange={e => setFormData({ ...formData, province: capitalizeWords(e.target.value) })} />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Notas de Dirección / Referencias</label>
                    <input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: capitalizeWords(e.target.value) })} />
                    {(formData.street_name || formData.address) && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''} ${formData.address || ''}`.trim()
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="insurance-modal__link"
                        >
                            {t('view_on_map')} ↗
                        </a>
                    )}
                </div>
                <div className="input-group">
                    <label className="input-label">Estado</label>
                    <select
                        className="input-field"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
};

export default InsuranceFormModal;
