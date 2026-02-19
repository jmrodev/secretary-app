import React from 'react';
import Input from '../atoms/Input';

const SimpleRequestForm = ({ reqType, reqNote, setReqNote, t, baseClass }) => {
    return (
        <Input
            type="textarea"
            className={`${baseClass}__textarea`}
            value={reqNote}
            onChange={e => setReqNote(e.target.value)}
            placeholder={reqType === 'license' ? t('diagnosis_placeholder') : t('certificate_placeholder')}
            required
        />
    );
};

export default SimpleRequestForm;
