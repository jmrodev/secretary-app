import React from 'react';
import { capitalizeFirst } from '@/utils/core/stringUtils';
import { Input } from '@/components/atoms/Input';
import { Checkbox } from '@/components/atoms/Checkbox';
import { FormGroup } from '@/components/molecules/FormGroup';

export const PrescriptionExtraFields = ({ instructions, setInstructions, bonified, setBonified, t }) => {
    return (
        <>
            <FormGroup label={t('instructions')} htmlFor="prescription-instructions">
                <Input
                    type="textarea"
                    id="prescription-instructions"
                    rows={3}
                    value={instructions}
                    onChange={e => setInstructions(capitalizeFirst(e.target.value))}
                    placeholder={t('instructions_placeholder')}
                />
            </FormGroup>

            <Checkbox
                id="bonified-prescription"
                checked={bonified}
                onChange={e => setBonified(e.target.checked)}
                label={t('bonified')}
            />
        </>
    );
};
