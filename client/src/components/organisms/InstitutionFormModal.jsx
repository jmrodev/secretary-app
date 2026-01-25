import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';

const InstitutionFormModal = ({ isOpen, onClose, onSubmit, formData, onChange, isEditing }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Institución' : 'Nueva Institución'}
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="input-group">
                    <label className="input-label">Nombre *</label>
                    <input
                        type="text"
                        className="input-field"
                        value={formData.name}
                        onChange={e => onChange('name', e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Monto que paga esta Institución (Monto Base)</label>
                    <input
                        type="number"
                        className="input-field"
                        value={formData.base_price}
                        onChange={e => onChange('base_price', e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div className="mb-4">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newContext) => onChange('phoneNumbers', newContext)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Descripción</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={formData.description}
                        onChange={e => onChange('description', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Estado</label>
                    <select
                        className="input-field"
                        value={formData.status}
                        onChange={e => onChange('status', e.target.value)}
                    >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default InstitutionFormModal;
