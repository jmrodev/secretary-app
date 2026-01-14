
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';

const PatientEditModal = ({ isOpen, onClose, patient, onUpdate }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const [insurances, setInsurances] = useState([]);
    const [institutions, setInstitutions] = useState([]); // [NEW]
    const [coveredByInstitution, setCoveredByInstitution] = useState(false); // [NEW]

    const [formData, setFormData] = useState({
        full_name: '',
        dni: '',
        phone: '',
        email: '',
        insurance_id: '',
        institution_id: '', // [NEW]
        affiliate_number: '',
        dob: ''
    });

    useEffect(() => {
        const fetchInsurances = async () => {
            try {
                const res = await api.get('/insurances');
                setInsurances(res.data);
            } catch (err) {
                console.error("Failed to fetch insurances", err);
            }
        };
        const fetchInstitutions = async () => {
            try {
                const res = await api.get('/institutions');
                setInstitutions(res.data);
            } catch (err) {
                console.error("Failed to fetch institutions", err);
            }
        };
        fetchInsurances();
        fetchInstitutions();
    }, []);

    useEffect(() => {
        if (patient) {
            setFormData({
                full_name: patient.full_name || '',
                dni: patient.dni || '',
                phone: patient.phone || '',
                email: patient.email || '',
                address: patient.address || '',
                insurance_id: patient.insurance_id || '',
                institution_id: patient.institution_id || '', // [NEW]
                affiliate_number: patient.affiliate_number || '',
                dob: patient.dob ? patient.dob.split('T')[0] : ''
            });
            setCoveredByInstitution(!!patient.institution_id); // [NEW]
        } else {
            // Reset form for new patient creation
            setFormData({
                full_name: '',
                dni: '',
                phone: '',
                email: '',
                address: '',
                insurance_id: '',
                institution_id: '', // [NEW]
                affiliate_number: '',
                dob: ''
            });
            setCoveredByInstitution(false);
        }
    }, [patient]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (patient && patient.id) {
                // UPDATE
                await api.put(`/users/patients/${patient.id}`, formData);
                showMessage(t('patient_updated') || 'Patient updated successfully', 'success');

                const updatedPatient = {
                    ...patient,
                    ...formData,
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                };
                onUpdate(updatedPatient);
            } else {
                // CREATE (Register)
                if (!formData.dni) {
                    showMessage(t('dni_required') || 'DNI is required for new patient', 'error');
                    return;
                }

                // Prepare Payload for Register
                const payload = {
                    username: formData.dni, // Auto-generate username from DNI
                    password: formData.dni, // Auto-generate password from DNI
                    role: 'patient',
                    fullName: formData.full_name,
                    dni: formData.dni,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    dob: formData.dob,
                    insurance_id: formData.insurance_id,
                    institution_id: formData.institution_id, // [NEW]
                    affiliate_number: formData.affiliate_number
                };

                const res = await api.post('/auth/register', payload);
                showMessage(t('patient_created') || 'Patient created successfully', 'success');

                // Construct New Patient Object with ID from response
                const newPatient = {
                    id: res.data.patient_id, // Crucial: Backend updated to return this
                    user_id: res.data.user_id,
                    ...formData,
                    insurance_name: insurances.find(i => i.id == formData.insurance_id)?.name
                };
                onUpdate(newPatient);
            }
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data || t('failed_update') || 'Failed operation';
            showMessage(msg, 'error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_patient') || 'Edit Patient'}
        >
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="input-label">{t('full_name')}</label>
                    <input
                        className="input-field"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid-2-cols">
                    <div className="input-group">
                        <label className="input-label">{t('dni')}</label>
                        <input
                            className="input-field"
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('phone')}</label>
                        <input
                            className="input-field"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="grid-2-cols">
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input
                            className="input-field"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('address') || 'Dirección'}</label>
                        <input
                            className="input-field"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">{t('dob')}</label>
                    <input
                        type="date"
                        className="input-field"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid-2-cols">
                    <div className="input-group">
                        <label className="input-label">Obra Social</label>
                        <select
                            className="input-field"
                            name="insurance_id"
                            value={formData.insurance_id}
                            onChange={handleChange}
                        >
                            <option value="">Seleccionar...</option>
                            {insurances.map(ins => (
                                <option key={ins.id} value={ins.id}>{ins.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Nro Afiliado</label>
                        <input
                            className="input-field"
                            name="affiliate_number"
                            value={formData.affiliate_number}
                            onChange={handleChange}
                        />
                    </div>
                </div>



                <div className="mt-4 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            checked={coveredByInstitution}
                            onChange={(e) => {
                                setCoveredByInstitution(e.target.checked);
                                if (!e.target.checked) {
                                    setFormData(prev => ({ ...prev, institution_id: '' }));
                                }
                            }}
                            id="cb_institution"
                        />
                        <label htmlFor="cb_institution" className="input-label mb-0 cursor-pointer text-amber-700 font-medium">
                            ¿Cubierto por una Institución? (Municipio, Hospital, etc.)
                        </label>
                    </div>

                    {coveredByInstitution && (
                        <div className="input-group">
                            <label className="input-label">Institución Pagadora</label>
                            <select
                                className="input-field border-amber-300 bg-amber-50"
                                name="institution_id"
                                value={formData.institution_id}
                                onChange={handleChange}
                            >
                                <option value="">Seleccionar Institución...</option>
                                {institutions.filter(i => i.status === 'active').map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-right">
                    <button type="button" className="btn btn-secondary mr-2" onClick={onClose}>{t('cancel')}</button>
                    <button type="submit" className="btn btn-primary">{t('save_changes')}</button>
                </div>
            </form>
        </Modal >
    );
};

export default PatientEditModal;
