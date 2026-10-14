import { Appointment } from './appointments';

export interface PhoneNumber {
    phone_number: string;
    type?: string;
}

export interface Prescription {
    id: number;
    type?: 'patient_medication' | 'prescription' | string;
    name?: string;
    medication_name?: string;
    drug_name?: string;
    presentation?: string;
    dosage?: string;
    instructions?: string;
    units_per_box?: number | string;
    daily_units?: number | string;
    duration_days?: number | string;
    notes?: string;
    created_at?: string;
    date?: string;
}

export interface MedicalFile {
    id: number;
    file_name: string;
    file_url?: string;
    file_type?: string;
    category?: string;
    upload_date?: string;
    created_at?: string;
}

export interface Patient {
    id: number;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    dni?: string;
    email?: string;
    phone?: string;
    phoneNumbers?: PhoneNumber[];
    address?: string;
    birth_date?: string;
    dob?: string;
    gender?: string;
    street_name?: string;
    street_number?: string | number;
    floor?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    insurance_name?: string;
    institution_name?: string;
    insurance_plan?: string;
    affiliate_number?: string;
    medical_history?: string;
    doctor_name?: string;
    prescriptions?: Prescription[];
    appointments?: Appointment[];
    files?: MedicalFile[];
    requests?: any[];
}

export interface VademecumItem {
    id: number;
    name?: string;
    full_label?: string;
    presentation?: string;
    drug?: string;
    lab?: string;
    units_per_box?: number;
}
