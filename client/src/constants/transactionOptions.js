
export const getTransactionTypes = (t) => [
    { value: 'income_patient', label: t('income_patient') },
    { value: 'income_rental', label: t('income_rental') },
    { value: 'expense_general', label: t('expense_general') }
];

export const getPaymentMethods = (t) => [
    { value: 'cash', label: t('cash') },
    { value: 'debit', label: t('debit') },
    { value: 'credit', label: t('credit') },
    { value: 'transfer', label: t('transfer') },
    { value: 'mercadopago', label: t('mercadopago') }
];

export const getStatusOptions = (t) => [
    { value: 'paid', label: t('paid') },
    { value: 'partial', label: t('partial') },
    { value: 'pending', label: t('pending_payment') }
];

export const getServiceTypes = (t) => [
    { value: 'consultation', label: t('consultation_standard') },
    { value: 'virtual_consultation', label: t('virtual_consultation') },
    { value: 'prescription', label: t('prescription_rate') },
    { value: 'medical_license', label: t('medical_license') },
    { value: 'certificate', label: t('certificate') },
    { value: 'custom', label: t('custom') }
];
