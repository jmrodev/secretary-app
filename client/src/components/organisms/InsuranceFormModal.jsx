import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';

const InsuranceFormModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEditing }) => {
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
            <div className="flex flex-col gap-4">
                <div className="input-group">
                    <label className="input-label">Name *</label>
                    <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                </div>
                <div className="input-group">
                    <label className="input-label">CUIT</label>
                    <input className="input-field" value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">Website</label>
                    <input className="input-field" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                </div>
                <div className="mb-4">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData({ ...formData, phoneNumbers: newPhones })}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="input-group">
                    <label className="input-label">Dirección</label>
                    <input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    {formData.address && (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                            Ver en mapa ↗
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
