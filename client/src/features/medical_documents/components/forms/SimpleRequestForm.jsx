
import React from 'react';
import { Input } from '@/components/atoms/Input';
import { FormGroup } from '@/components/molecules/FormGroup';

/**
 * SimpleRequestForm Molecule.
 * Form used for medical licenses and certificates.
 */
export const SimpleRequestForm = ({ reqType, reqNote, setReqNote, t, baseClass }) => {
    return (
        <div className={`${baseClass}__simple-form`}>
            <FormGroup label={reqType === 'license' ? t('diagnosis') : t('motive')}>
                <Input
                    type="textarea"
                    id="simple-request-note"
                    rows={3}
                    value={reqNote}
                    onChange={e => setReqNote(e.target.value)}
                    placeholder={reqType === 'license' ? (t('diagnosis_placeholder')) : (t('motive_placeholder'))}
                    required
                />
            </FormGroup>
        </div>
    );
};
