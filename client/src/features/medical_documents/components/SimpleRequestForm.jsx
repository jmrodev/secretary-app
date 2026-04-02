
import React from 'react';

/**
 * SimpleRequestForm Molecule.
 * Form used for medical licenses and certificates.
 */
const SimpleRequestForm = ({ reqType, reqNote, setReqNote, t, baseClass }) => {
    return (
        <div className={`${baseClass}__simple-form`}>
            <div className="input-group">
                <label className="input-label">
                    {reqType === 'license' ? t('diagnosis') : t('motive')}
                </label>
                <textarea
                    className="input-field"
                    rows="3"
                    value={reqNote}
                    onChange={e => setReqNote(e.target.value)}
                    placeholder={reqType === 'license' ? (t('diagnosis_placeholder') || 'e.g. Gripe fuerte, reposo 48hs') : (t('motive_placeholder') || 'e.g. Certificado de aptitud física')}
                    required
                />
            </div>
        </div>
    );
};

export default SimpleRequestForm;
