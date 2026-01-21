import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CurrencyInput from './CurrencyInput';
import api from '../api/axios';
import PhoneNumbersManager from './PhoneNumbersManager';

const PatientForm = ({ initialValues, onSubmit, onCancel, isEdit = false, isAdmin = false, insurances = [], doctors = [] }) => {
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        first_name: '',
        last_name: '',
        dni: '',
        phoneNumbers: [],
        email: '',
        address: '',
        dob: '',
        insurance_id: '',
        institution_id: '',
        affiliate_number: '',
        medical_history: '',
        assignedDoctors: [],
        tariff_percent: '',
        tariff_override: '',
        visit_interval_days: '',
        prescription_interval_days: '',
        next_suggested_visit_date: '',
        next_suggested_prescription_date: '',
        license_expiry_date: ''
    });

    const [institutions, setInstitutions] = useState([]);
    const [coveredByInstitution, setCoveredByInstitution] = useState(false);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const res = await api.get('/institutions');
                setInstitutions(res.data);
            } catch (err) {
                console.error("Failed to fetch institutions", err);
            }
        };
        fetchInstitutions();
    }, []);

    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                ...initialValues,
                // Ensure arrays are initialized if missing in initialValues
                phoneNumbers: initialValues.phoneNumbers || [],
                assignedDoctors: initialValues.assignedDoctors ?
                    (Array.isArray(initialValues.assignedDoctors) && typeof initialValues.assignedDoctors[0] === 'object'
                        ? initialValues.assignedDoctors.map(d => d.id)
                        : initialValues.assignedDoctors)
                    : []
            }));

            if (initialValues.institution_id) {
                setCoveredByInstitution(true);
            }
        }
    }, [initialValues]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDoctorToggle = (doctorId) => {
        setFormData(prev => {
            const current = prev.assignedDoctors || [];
            if (current.includes(doctorId)) {
                return { ...prev, assignedDoctors: current.filter(id => id !== doctorId) };
            } else {
                return { ...prev, assignedDoctors: [...current, doctorId] };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="patient-form" autoComplete="off">
            {/* Fake fields to stop Chrome Autosave */}
            <div className="visually-hidden">
                <input type="text" name="fake_user_trap" autoComplete="username" tabIndex={-1} />
                <input type="password" name="fake_pass_trap" autoComplete="new-password" tabIndex={-1} />
            </div>

            {!isEdit && (
                <div className="form-row">
                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            autoComplete="off"
                            data-lpignore="true"
                            readOnly={!!formData.id} // heuristic
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            data-lpignore="true"
                        />
                    </div>
                </div>
            )}

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">Nombre</label>
                    <input
                        name="first_name"
                        className="input-field"
                        value={formData.first_name || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                                const newFirstName = val.trim();
                                const newLastName = (prev.last_name || '').trim();
                                const autoValue = `${newFirstName}${newLastName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

                                const oldAuto = `${(prev.first_name || '').trim()}${(prev.last_name || '').trim()}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

                                const shouldUpdateUser = !isEdit && (!prev.username || prev.username === oldAuto);
                                const shouldUpdatePass = !isEdit && (!prev.password || prev.password === oldAuto);

                                return {
                                    ...prev,
                                    first_name: val,
                                    full_name: `${val} ${prev.last_name || ''}`.trim(),
                                    username: shouldUpdateUser ? autoValue : prev.username,
                                    password: shouldUpdatePass ? autoValue : prev.password
                                };
                            });
                        }}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Apellido</label>
                    <input
                        name="last_name"
                        className="input-field"
                        value={formData.last_name || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                                const newFirstName = (prev.first_name || '').trim();
                                const newLastName = val.trim();
                                const autoValue = `${newFirstName}${newLastName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

                                const oldAuto = `${(prev.first_name || '').trim()}${(prev.last_name || '').trim()}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');

                                const shouldUpdateUser = !isEdit && (!prev.username || prev.username === oldAuto);
                                const shouldUpdatePass = !isEdit && (!prev.password || prev.password === oldAuto);

                                return {
                                    ...prev,
                                    last_name: val,
                                    full_name: `${prev.first_name || ''} ${val}`.trim(),
                                    username: shouldUpdateUser ? autoValue : prev.username,
                                    password: shouldUpdatePass ? autoValue : prev.password
                                };
                            });
                        }}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">{t('dni')}</label>
                    <input
                        name="dni"
                        className="input-field"
                        value={formData.dni}
                        onChange={handleChange}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Obra Social</label>
                    <select
                        name="insurance_id"
                        className="input-field"
                        value={formData.insurance_id}
                        onChange={handleChange}
                    >
                        <option value="">Seleccionar...</option>
                        {insurances.map(ins => (
                            <option key={ins.id} value={ins.id}>{ins.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="input-field"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="section-divider">
                <div className="checkbox-row">
                    <input
                        type="checkbox"
                        checked={coveredByInstitution}
                        onChange={(e) => {
                            setCoveredByInstitution(e.target.checked);
                            if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, institution_id: '' }));
                            }
                        }}
                        id="pf_institution"
                    />
                    <label htmlFor="pf_institution" className="checkbox-label">
                        ¿Cubierto por una Institución? (Municipio, Hospital, etc.)
                    </label>
                </div>

                {coveredByInstitution && (
                    <div className="input-group">
                        <label className="input-label">Institución Pagadora</label>
                        <select
                            name="institution_id"
                            className="input-field"
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

            {/* Multiple Phone Numbers Section */}
            <div className="section-divider">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={(newPhones) => setFormData(prev => ({ ...prev, phoneNumbers: newPhones }))}
                />
            </div>

            <div className="form-row">
                <div className="input-group">
                    <label className="input-label">{t('dob')}</label>
                    <input
                        type="date"
                        name="dob"
                        className="input-field"
                        value={formData.dob}
                        onChange={handleChange}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Nro Afiliado</label>
                    <input
                        name="affiliate_number"
                        className="input-field"
                        value={formData.affiliate_number}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="input-group">
                <label className="input-label">{t('address')}</label>
                <input
                    name="address"
                    className="input-field"
                    value={formData.address}
                    onChange={handleChange}
                />
            </div>

            <div className="input-group">
                <label className="input-label">{t('medical_history')}</label>
                <textarea
                    name="medical_history"
                    className="input-field"
                    rows="3"
                    value={formData.medical_history}
                    onChange={handleChange}
                />
            </div>

            {isAdmin && (
                <div className="admin-section">
                    <h4 className="section-title">Administrative Settings</h4>

                    <div className="input-group mb-4">
                        <label className="input-label">Assigned Doctors</label>
                        <div className="doctor-selection-grid">
                            {doctors.map(doc => (
                                <label key={doc.id} className="doctor-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.assignedDoctors?.includes(doc.id)}
                                        onChange={() => handleDoctorToggle(doc.id)}
                                    />
                                    Dr. {doc.full_name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">Tariff Adjustment (%)</label>
                            <input
                                type="number"
                                name="tariff_percent"
                                className="input-field"
                                value={formData.tariff_percent}
                                onChange={handleChange}
                                placeholder="e.g. 10"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tariff Override ($)</label>
                            <CurrencyInput
                                className="input-field"
                                value={formData.tariff_override}
                                onChange={(e) => handleChange({ target: { name: 'tariff_override', value: e.target.value } })}
                                placeholder="e.g. 5000"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">{t('visit_interval_days')}</label>
                            <input type="number" name="visit_interval_days" className="input-field" value={formData.visit_interval_days} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('prescription_interval_days')}</label>
                            <input type="number" name="prescription_interval_days" className="input-field" value={formData.prescription_interval_days} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row-3">
                        <div className="input-group">
                            <label className="input-label">{t('next_suggested_visit')}</label>
                            <input type="date" name="next_suggested_visit_date" className="input-field" value={formData.next_suggested_visit_date} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('next_suggested_prescription')}</label>
                            <input type="date" name="next_suggested_prescription_date" className="input-field" value={formData.next_suggested_prescription_date} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('license_expiry')}</label>
                            <input type="date" name="license_expiry_date" className="input-field" value={formData.license_expiry_date} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            )}

            <div className="form-actions">
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        {t('cancel')}
                    </button>
                )}
                <button type="submit" className="btn btn-primary w-full md:w-auto">
                    {isEdit ? t('save_changes') : t('create_account')}
                </button>
            </div>
        </form >
    );
};

export default PatientForm;
