export type ProcedureType = 'prescription' | 'license' | 'certificate';

export type ProcedureStatus = 'pending' | 'completed' | 'rejected' | 'consult';

export interface MedicalProcedure {
    id: number | string;
    type: ProcedureType;
    patient_id: number | string;
    patient_name?: string;
    doctor_id?: number | string;
    doctor_name?: string;
    status: ProcedureStatus;
    request_note?: string;
    doctor_note?: string;
    secretary_note?: string;
    payment_status?: 'pending' | 'completed' | 'bonified' | 'waived';
    debt_amount?: number;
    created_at?: string;
    completed_at?: string;
    raw_medication_data?: any;
}
