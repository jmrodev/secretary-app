
export const getPaymentMethods = (t) => [
    { value: 'cash', label: t('cash') || 'Efectivo' },
    { value: 'debit', label: t('debit') || 'Débito' },
    { value: 'credit', label: t('credit') || 'Crédito' },
    { value: 'transfer', label: t('transfer') || 'Transferencia' },
    { value: 'mercadopago', label: 'MercadoPago' }
];

export const getServiceTypes = (t) => [
    { value: 'consultation', label: t('consultation_standard') || 'Consulta Presencial' },
    { value: 'virtual_consultation', label: t('virtual_consultation') || 'Consulta Virtual' },
    { value: 'prescription', label: t('prescription_rate') || 'Receta' },
    { value: 'medical_license', label: t('medical_license') || 'Licencia Médica' },
    { value: 'certificate', label: t('certificate') || 'Certificado' },
    { value: 'custom', label: t('custom') || 'Personalizado' }
];
