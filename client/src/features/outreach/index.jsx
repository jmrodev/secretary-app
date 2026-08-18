/* eslint-disable react-refresh/only-export-components -- barrel re-export of components, hooks, and utils */
// Public API for the Outreach Feature
// WhatsApp message broadcast to patient segments

export { OutreachPage } from '@/features/outreach/pages/OutreachPage';
export { useOutreach } from '@/features/outreach/hooks/useOutreach';
export { generateVariants } from '@/features/outreach/utils/variantGenerator';
