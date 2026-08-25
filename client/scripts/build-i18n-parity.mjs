import fs from 'node:fs';
import path from 'node:path';

// 1. Create en/communication_settings_extra.js
fs.writeFileSync('./client/src/constants/languages/en/communication_settings_extra.js', `export const communication_settings_extra = {
    // Communication Settings Extra
    google_review_link_label: "Google Review Link",
    google_review_hint: "Enter the direct link for patients to leave a Google Review on your Business Profile.",
    medication_refill_reminder_label: "Medication Refill Reminder",
    medication_refill_hint: "Message sent to remind about chronic medication refill.",
};
`);

// 2. Create en/configuration_tabs.js
fs.writeFileSync('./client/src/constants/languages/en/configuration_tabs.js', `export const configuration_tabs = {
    // Configuration Tabs
    communications: "Communications",
    integrations: "Integrations",
    billing: "Billing",
    ai: "AI",
    logs: "Logs",
    data_management_title: "Data and Security",
    coming_soon: "Coming soon...",
};
`);

// 3. Create en/patient_form_stepper.js
fs.writeFileSync('./client/src/constants/languages/en/patient_form_stepper.js', `export const patient_form_stepper = {
    // Patient Form Stepper
    step_personal: "Personal",
    step_insurance: "Insurance",
    step_address: "Address",
    step_contact: "Contact",
    step_medical: "Medical File",
    step_admin: "Management",
    next: "Next",
    back: "Back",
    medical_history_notes: "Medical History / Notes",
    medical_history_placeholder: "History, allergies, important notes...",
};
`);

// 4. Create en/errors_messages.js
fs.writeFileSync('./client/src/constants/languages/en/errors_messages.js', `export const errors_messages = {
    // Errors & Messages
    server_error: "Internal server error",
    patient_not_found: "Patient not found",
    request_not_found: "Request not found",
    note_required: "A note is required for this status",
    secretary_restricted: "Editing requests is restricted for secretaries",
    unauthorized_doctor: "You can only manage your own requests",
    unauthorized: "Unauthorized",
    request_created: "Request created successfully",
    request_updated: "Request updated",
    request_deleted: "Request deleted successfully",
    payment_status_updated: "Payment status updated",
};
`);

// 5. Create en/dashboard_requirements_missing_keys.js
fs.writeFileSync('./client/src/constants/languages/en/dashboard_requirements_missing_keys.js', `export const dashboard_requirements_missing_keys = {
    // Dashboard & Requirements Missing Keys
    request_detail: "Request Detail",
    edit_list: "Edit List",
    editing_medication: "Editing Medication",
    doctor_reply: "Doctor Reply",
    doctor_note_placeholder: "Add an instruction or reply...",
    requested_medication: "Requested Medication",
    new_meds_warning: "New / Non-habitual",
    additional_notes: "Additional Notes",
    detail_reason: "Reason for Request",
    save_to_patient_file: "Save to medical record",
    qty_short: "Qty.",
    visit_overdue: "Overdue check-up",
    prescription_overdue: "Suggested refill",
    license_expiring: "License expiring soon",
    meds_expiring: "Running out of medication",
    no_pending_reminders: "No pending reminders.",
    no_notified_reminders: "No notified reminders.",
    notify_via_whatsapp: "Notify via WhatsApp",
    whatsapp_label: "WhatsApp",
    mark_as_notified: "Mark as Notified",
    unmark_notified: "Unmark Notified",
    done: "Done",
    notified: "Notified",
    undo: "Undo",
    reminder_completed: "Reminder completed",
    error_completing_reminder: "Error completing reminder",
    error_updating_status: "Error updating status",
    whatsapp_medication_reminder_template: "Hello {patient_name}, this is a reminder that your medication ({medication_name}) is almost out. Do you need a new prescription? Regards: {secretary_name}.",
    whatsapp_visit_reminder_template: "Hello {patient_name}, it is time for your scheduled check-up. Would you like to book an appointment?",
    whatsapp_prescription_reminder_template: "Hello {patient_name}, it is time to renew your prescription.",
    whatsapp_license_reminder_template: "Hello {patient_name}, your medical license is expiring soon.",
    no_phone_available_sync_first: "No phone available. Adjust or sync appointment first.",
    whatsapp_appointment_reminder_template: "Hello {patient_name}, confirming your appointment on {date} at {time} with Dr. {doctor_name}. Please confirm attendance. Thank you.",
    whatsapp_appointment_confirmed_template: "Hello {patient_name}, your appointment is confirmed for {date} at {time}. Thank you!",
    whatsapp_text_copied_opening: "Text copied! Opening WhatsApp...",
    error_copying_text: "Error copying text",
    referral: "Referral",
    create_first_request: "Create first request",
    patient_has_valid_until: "Coverage suggested until",
    send_to_doctor: "Send for medical review",
    send_request: "Send Request",
    free_slots_label: "Available",
    booked_slots_label: "Booked",
    regular_schedule: "Schedule",
    extra_schedule: "Extra",
    new_transaction: "New Transaction",
    deliver_box: "Deliver Cash Box",
};
`);

// 6. Create en/medical_documents_extra.js
fs.writeFileSync('./client/src/constants/languages/en/medical_documents_extra.js', `export const medical_documents_extra = {
    // Medical Documents Extra
    edit_request: "Edit Request",
    file_description_label: "File Description",
    file_description_placeholder: "E.g., Blood test results...",
    file_label: "File",
    patient_label: "Patient",
    select_patient: "-- Select Patient --",
    upload_file: "Upload File",
    no_files_uploaded: "No files uploaded",
    file_column: "File",
    patient_column: "Patient",
    admin_only_delete_past_requests: "Only administrators can delete completed requests from past dates.",
    new_prescription: "New Prescription",
    new_license: "New Medical Leave",
    new_certificate: "New Certificate",
};
`);

// 7. Create en/printable_report_ficha_del_paciente.js
fs.writeFileSync('./client/src/constants/languages/en/printable_report_ficha_del_paciente.js', `export const printable_report_ficha_del_paciente = {
    back_simple: "Back",
};
`);

console.log('Created missing module files in en/');
