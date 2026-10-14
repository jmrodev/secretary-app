import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/shared/services/api';
import { showAlert } from '@/shared/utils/alert';
import { Patient, Prescription, VademecumItem } from '@/types/patients';

export const usePatientDetail = (patientId: string | number) => {
    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [savingMed, setSavingMed] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // Vademécum search state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<VademecumItem[]>([]);
    const [searchingVademecum, setSearchingVademecum] = useState<boolean>(false);

    const fetchDetails = useCallback(async () => {
        if (!patientId) return;
        try {
            setLoading(true);
            const data = await apiFetch<any>(`/users/patients/${patientId}`);
            setPatientData(data?.data || data);
        } catch (err: any) {
            console.error('Error al obtener ficha del paciente:', err);
            showAlert('Error', 'No se pudieron cargar los datos del paciente.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    // Búsqueda con debounce en vademécum
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                setSearchingVademecum(true);
                const res = await apiFetch<VademecumItem[]>(
                    `/medical/vademecum/search?q=${encodeURIComponent(searchQuery)}`
                );
                setSearchResults(Array.isArray(res) ? res : []);
            } catch (err) {
                console.warn('Error al buscar en Vademécum:', err);
                setSearchResults([]);
            } finally {
                setSearchingVademecum(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addPrescription = async (prescriptionData: {
        medName: string;
        dosage: string;
        boxesCount?: string;
        unitsPerBox: string;
        dailyUnits: string;
        durationDays: string;
        notes: string;
        selectedVademecum?: VademecumItem | null;
        appointmentId?: string | number | null;
    }) => {
        if (!prescriptionData.medName.trim()) {
            showAlert('Atención', 'Por favor ingresá o seleccioná un medicamento.');
            return false;
        }

        try {
            setSavingMed(true);
            const boxes = parseInt(prescriptionData.boxesCount || '1', 10) || 1;
            const units = parseInt(prescriptionData.unitsPerBox, 10) || 30;
            const daily = parseFloat(prescriptionData.dailyUnits) || 1;

            if (prescriptionData.appointmentId) {
                await apiFetch('/medical/prescriptions', {
                    method: 'POST',
                    body: JSON.stringify({
                        patient_id: patientId,
                        appointment_id: prescriptionData.appointmentId,
                        medications: prescriptionData.medName,
                        instructions: prescriptionData.notes,
                        items: [
                            {
                                medication_name: prescriptionData.medName,
                                presentation: prescriptionData.dosage,
                                dose: prescriptionData.dosage,
                                quantity: boxes,
                                units_per_box: units,
                                daily_intake: daily,
                                frequency: `${daily} toma/día`,
                                duration: `${prescriptionData.durationDays} días`,
                                vademecum_id: prescriptionData.selectedVademecum?.id || null,
                            },
                        ],
                    }),
                });
            } else {
                await apiFetch('/medical/patients/medications', {
                    method: 'POST',
                    body: JSON.stringify({
                        patient_id: patientId,
                        medication_name: prescriptionData.medName,
                        presentation: prescriptionData.dosage,
                        dose: prescriptionData.dosage,
                        frequency: `${daily} toma/día`,
                        boxes_count: boxes,
                        units_per_box: units,
                        daily_intake: daily,
                        notes: prescriptionData.notes,
                        vademecum_id: prescriptionData.selectedVademecum?.id || null,
                    }),
                });
            }

            showAlert('¡Éxito!', 'Prescripción agregada correctamente.');
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al guardar prescripción:', err);
            showAlert('Error', err.message || 'No se pudo guardar la prescripción.');
            return false;
        } finally {
            setSavingMed(false);
        }
    };

    const repeatPrescription = async (
        prescription: Prescription,
        appointmentId?: string | number | null
    ) => {
        try {
            setActionLoading(true);
            const medName = prescription.medication_name || prescription.name || '';
            const dosage = prescription.dosage || prescription.presentation || '';
            const units = prescription.units_per_box || 30;
            const daily = prescription.daily_units || 1;
            const duration = prescription.duration_days || 30;
            const notes = prescription.notes || '';

            await apiFetch('/medical/prescriptions', {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: patientId,
                    appointment_id: appointmentId || null,
                    medication_name: medName,
                    dosage,
                    units_per_box: Number(units),
                    daily_units: Number(daily),
                    duration_days: Number(duration),
                    notes,
                }),
            });

            showAlert('¡Éxito!', `Se renovó la receta de ${medName}.`);
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al repetir receta:', err);
            showAlert('Error', err.message || 'No se pudo repetir la receta.');
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updatePrescription = async (
        prescriptionId: number,
        prescriptionType: string | undefined,
        data: { medName: string; dosage: string; notes: string }
    ) => {
        try {
            setActionLoading(true);
            const endpoint =
                prescriptionType === 'patient_medication'
                    ? `/medical/patients/medications/${prescriptionId}`
                    : `/medical/prescriptions/${prescriptionId}`;

            await apiFetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify({
                    medication_name: data.medName,
                    name: data.medName,
                    dosage: data.dosage,
                    presentation: data.dosage,
                    notes: data.notes,
                }),
            });

            showAlert('¡Actualizado!', 'La receta se actualizó con éxito.');
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al editar receta:', err);
            showAlert('Error', 'No se pudo actualizar la receta.');
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const deletePrescription = async (
        prescriptionId: number,
        prescriptionType: string | undefined,
        password: string
    ) => {
        if (!password.trim()) {
            showAlert('Atención', 'Debés ingresar tu contraseña para confirmar.');
            return false;
        }

        try {
            setActionLoading(true);
            const endpoint =
                prescriptionType === 'patient_medication'
                    ? `/medical/patients/medications/${prescriptionId}`
                    : `/medical/prescriptions/${prescriptionId}`;

            await apiFetch(endpoint, {
                method: 'DELETE',
                body: JSON.stringify({ password }),
            });

            showAlert('¡Eliminado!', 'La receta fue eliminada con éxito del historial.');
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al eliminar receta con contraseña:', err);
            const errStr = JSON.stringify(err || '');
            if (
                errStr.includes('invalid_password') ||
                errStr.includes('Password') ||
                err?.status === 401
            ) {
                showAlert('Contraseña Incorrecta', 'La contraseña ingresada no es válida.');
            } else {
                showAlert('Error', 'No se pudo eliminar la receta.');
            }
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const updateAppointmentStatus = async (
        id: number,
        status: string,
        reason?: string
    ): Promise<boolean> => {
        try {
            setActionLoading(true);
            await apiFetch(`/appointments/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, reason }),
            });
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al actualizar estado del turno:', err);
            showAlert('Error', err.message || 'No se pudo actualizar el estado de la consulta.');
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const registerPayment = async (
        appointmentId: number,
        data: {
            amount: number;
            method: string;
            doctorId: number;
            patientId?: number | null;
            notes?: string;
        }
    ): Promise<boolean> => {
        try {
            setActionLoading(true);
            await apiFetch('/finances/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    appointment_id: appointmentId,
                    doctor_id: data.doctorId,
                    patient_id: data.patientId || null,
                    amount: data.amount,
                    method: data.method,
                    type: 'income_patient',
                    description: data.notes || 'Cobro de consulta (app móvil)',
                }),
            });
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al registrar transacción:', err);
            try {
                await apiFetch(`/appointments/${appointmentId}/payment`, {
                    method: 'PATCH',
                    body: JSON.stringify({ payment_status: 'paid' }),
                });
                await fetchDetails();
                return true;
            } catch (fallbackErr: any) {
                showAlert('Error', fallbackErr.message || 'No se pudo registrar el pago.');
                return false;
            }
        } finally {
            setActionLoading(false);
        }
    };

    const updatePaymentStatus = async (
        appointmentId: number,
        paymentStatus: string
    ): Promise<boolean> => {
        try {
            setActionLoading(true);
            await apiFetch(`/appointments/${appointmentId}/payment`, {
                method: 'PATCH',
                body: JSON.stringify({ payment_status: paymentStatus }),
            });
            await fetchDetails();
            return true;
        } catch (err: any) {
            console.error('Error al actualizar estado de pago:', err);
            showAlert('Error', err.message || 'No se pudo actualizar el estado de pago.');
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return {
        patientData,
        loading,
        savingMed,
        actionLoading,
        searchQuery,
        setSearchQuery,
        searchResults,
        searchingVademecum,
        fetchDetails,
        addPrescription,
        repeatPrescription,
        updatePrescription,
        deletePrescription,
        updateAppointmentStatus,
        registerPayment,
        updatePaymentStatus,
    };
};
