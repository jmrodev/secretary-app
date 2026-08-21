import fs from 'node:fs';

const remainingKeys = {
    balance: { es: "Balance", en: "Balance" },
    config: { es: "Configuración", en: "Settings" },
    day: { es: "Día", en: "Day" },
    days_array: { es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
    description: { es: "Descripción", en: "Description" },
    go: { es: "Ir", en: "Go" },
    medication_placeholder: { es: "Nombre de la medicación...", en: "Medication name..." },
    name: { es: "Nombre", en: "Name" },
    notes: { es: "Notas", en: "Notes" },
    pending_debt: { es: "Deuda pendiente", en: "Pending debt" },
    presencial_institution_share: { es: "Porcentaje institución presencial", en: "In-person institution percentage" },
    presencial_share: { es: "Porcentaje presencial", en: "In-person percentage" },
    previous: { es: "Anterior", en: "Previous" },
    print_error: { es: "Error al imprimir comprobante", en: "Error printing receipt" },
    qty: { es: "Cantidad", en: "Quantity" },
    quantity: { es: "Cantidad", en: "Quantity" },
    reason_placeholder: { es: "Motivo de la consulta...", en: "Reason for visit..." },
    recent_history: { es: "Historial reciente", en: "Recent history" },
    recycle_empty: { es: "Papelera vacía", en: "Trash is empty" },
    remind: { es: "Recordar", en: "Remind" },
    rental_configuration: { es: "Configuración de alquiler", en: "Rental configuration" },
    reply: { es: "Responder", en: "Reply" },
    reply_to_doctor: { es: "Responder al médico", en: "Reply to doctor" },
    restore_failed: { es: "Error al restaurar elemento", en: "Error restoring item" },
    results: { es: "Resultados", en: "Results" },
    save_withdrawal: { es: "Guardar retiro de caja", en: "Save cash withdrawal" },
    schedule: { es: "Horario", en: "Schedule" },
    secretary_reply: { es: "Respuesta de secretaría", en: "Front desk reply" },
    select_date: { es: "Seleccionar fecha", en: "Select date" },
    select_institution_desc: { es: "Seleccione una institución para ver los detalles", en: "Select an institution to view details" },
    select_option: { es: "Seleccione una opción", en: "Select an option" },
    select_short: { es: "Elegir", en: "Choose" },
    selected: { es: "Seleccionado", en: "Selected" },
    send_whatsapp: { es: "Enviar WhatsApp", en: "Send WhatsApp" },
    send_whatsapp_confirmation: { es: "Enviar confirmación por WhatsApp", en: "Send WhatsApp confirmation" },
    sending_automated: { es: "Enviando mensaje automático...", en: "Sending automated message..." },
    tariffs: { es: "Aranceles", en: "Tariffs" },
    test_connection: { es: "Probar conexión", en: "Test connection" },
    today: { es: "Hoy", en: "Today" },
    total: { es: "Total", en: "Total" },
    upload_certificate: { es: "Subir certificado digital", en: "Upload digital certificate" },
    user: { es: "Usuario", en: "User" },
    variable_order: { es: "Orden de variables", en: "Variable order" },
    view: { es: "Ver", en: "View" },
    view_detail: { es: "Ver detalle", en: "View detail" },
    virtual_institution_share: { es: "Porcentaje institución virtual", en: "Virtual institution percentage" },
    virtual_share: { es: "Porcentaje virtual", en: "Virtual percentage" },
    whatsapp_chat: { es: "Chat de WhatsApp", en: "WhatsApp Chat" },
    whatsapp_connected_desc: { es: "Conectado al servicio de WhatsApp Cloud API.", en: "Connected to WhatsApp Cloud API service." },
    whatsapp_disconnect: { es: "Desconectar WhatsApp", en: "Disconnect WhatsApp" },
    year: { es: "Año", en: "Year" },
    your_answer: { es: "Tu respuesta", en: "Your answer" },
    your_question: { es: "Tu consulta", en: "Your inquiry" }
};

// Add to es/general.js
const esPath = './client/src/constants/languages/es/general.js';
let esContent = fs.readFileSync(esPath, 'utf8');
const esMissing = Object.entries(remainingKeys).filter(([k]) => !esContent.includes(`${k}:`));
if (esMissing.length > 0) {
    const block = '\n    // Additional synced entries\n' + esMissing.map(([k, v]) => `    ${k}: ${JSON.stringify(v.es)},`).join('\n') + '\n';
    esContent = esContent.replace(/};\s*$/, `${block}};\n`);
    fs.writeFileSync(esPath, esContent, 'utf8');
    console.log(`Added ${esMissing.length} keys to es/general.js`);
}

// Add to en/general.js
const enPath = './client/src/constants/languages/en/general.js';
let enContent = fs.readFileSync(enPath, 'utf8');
const enMissing = Object.entries(remainingKeys).filter(([k]) => !enContent.includes(`${k}:`));
if (enMissing.length > 0) {
    const block = '\n    // Additional synced entries\n' + enMissing.map(([k, v]) => `    ${k}: ${JSON.stringify(v.en)},`).join('\n') + '\n';
    enContent = enContent.replace(/};\s*$/, `${block}};\n`);
    fs.writeFileSync(enPath, enContent, 'utf8');
    console.log(`Added ${enMissing.length} keys to en/general.js`);
}

console.log('Remaining sync completed.');
