export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'arrived'
    | 'attended'
    | 'completed'
    | 'cancelled'
    | 'suspended'
    | 'absent'
    | 'rescheduled'
    | string;

export type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'debt'
    | 'partial'
    | 'partially_paid'
    | 'bonified'
    | string;

export interface Appointment {
    id: number;
    patient_id?: number | null;
    patientId?: number | null;
    patient_name?: string;
    patientName?: string;
    patient_phone?: string;
    phone?: string;
    slot_time?: string;
    appointment_date?: string;
    appointment_time?: string;
    time?: string;
    status: AppointmentStatus;
    reason?: string;
    notes?: string;
    doctor_id?: number;
    doctor_name?: string;
    type?: string;
    payment_status?: PaymentStatus | null;
    is_paid?: number | boolean;
    cost?: number;
    total_cost?: number;
    paid_amount?: number;
    pending_amount?: number;
    payment_method?: string;
    bonified?: number | boolean;
}

export interface AppointmentStats {
    total: number;
    attended: number;
    pending: number;
}

export interface Doctor {
    id: number;
    full_name: string;
    specialty?: string;
}

