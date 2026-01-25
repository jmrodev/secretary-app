import { useLanguage } from '../../context/LanguageContext';

const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { phone_number: '+549', label: 'Celular', is_primary: (phoneNumbers || []).length === 0 }]);
    };

    const handleRemove = (index) => {
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        const next = [...phoneNumbers];
        next[index][field] = value;
        if (field === 'is_primary' && value === true) {
            next.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(next);
    };

    return (
        <div className="flex-col-gap-4">
            <label className="form-label">
                📱 {t('phone_numbers')}
            </label>
            {(phoneNumbers || []).map((pn, index) => (
                <div key={index} style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    backgroundColor: 'var(--gray-50)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--gray-200)'
                }}>
                    <input
                        className="form-input"
                        style={{ flex: '1', minWidth: '100px', fontSize: '0.875rem' }}
                        value={pn.label}
                        onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                        placeholder={t('label')}
                    />
                    <input
                        className="form-input"
                        style={{ flex: '2', minWidth: '160px', fontSize: '0.875rem' }}
                        value={pn.phone_number}
                        onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                        placeholder="+549..."
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem', whiteSpace: 'nowrap' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '-0.05em',
                            cursor: 'pointer',
                            userSelect: 'none',
                            color: 'var(--gray-600)'
                        }}>
                            <input
                                type="radio"
                                name="primary-phone-manager"
                                checked={pn.is_primary}
                                onChange={() => handleUpdate(index, 'is_primary', true)}
                                style={{ accentColor: 'var(--blue-600)' }}
                            />
                            {t('primary')}
                        </label>
                    </div>
                    <button
                        type="button"
                        className="btn-icon-delete"
                        onClick={() => handleRemove(index)}
                    >
                        🗑️
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAdd}
            >
                ➕ {t('add_phone')}
            </button>
        </div>
    );
};

export default PhoneNumbersManager;
