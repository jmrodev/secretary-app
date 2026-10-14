import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePatientDetail } from './hooks/usePatientDetail';
import { PatientHeader } from './components/PatientHeader';
import { MedicationsTab } from './components/MedicationsTab';
import { VisitsTab } from './components/VisitsTab';
import { FilesTab } from './components/FilesTab';
import { AddMedicationModal } from './components/AddMedicationModal';
import { PrescriptionDetailModal } from './components/PrescriptionDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PatientBioTab } from './components/PatientBioTab';
import { CreateRequestModal } from './components/CreateRequestModal';
import { AppointmentActionModal } from '@/features/appointments/components/AppointmentActionModal';
import { AppointmentPaymentModal } from '@/features/appointments/components/AppointmentPaymentModal';
import { Prescription } from '@/types/patients';
import { Appointment } from '@/types/appointments';
import { Colors } from '@/shared/theme/colors';

interface PatientDetailViewProps {
    patientId: string | number;
    appointmentId?: string | number | null;
}

type TabType = 'bio' | 'medications' | 'visits' | 'files';

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
    patientId,
    appointmentId,
}) => {
    const {
        patientData,
        loading,
        savingMed,
        actionLoading,
        searchQuery,
        setSearchQuery,
        searchResults,
        searchingVademecum,
        addPrescription,
        repeatPrescription,
        updatePrescription,
        deletePrescription,
        updateAppointmentStatus,
        registerPayment,
        updatePaymentStatus,
        fetchDetails,
    } = usePatientDetail(patientId);

    const [activeTab, setActiveTab] = useState<TabType>('bio');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestModalType, setRequestModalType] = useState<
        'prescription' | 'license' | 'certificate'
    >('license');

    // Appointment management state
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Cargando historial del paciente...</Text>
            </SafeAreaView>
        );
    }

    if (!patientData) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>No se encontraron datos para este paciente.</Text>
            </SafeAreaView>
        );
    }

    const prescriptions = patientData.prescriptions || [];
    const appointments = patientData.appointments || [];
    const files = patientData.files || [];

    const handleOpenPrescriptionDetail = (presc: Prescription) => {
        setSelectedPrescription(presc);
        setShowDetailModal(true);
    };

    const handleRepeatPrescription = (presc: Prescription) => {
        repeatPrescription(presc, appointmentId);
    };

    const handleUpdatePrescription = async (data: {
        medName: string;
        dosage: string;
        notes: string;
    }) => {
        if (!selectedPrescription) return;
        await updatePrescription(selectedPrescription.id, selectedPrescription.type, data);
        setShowDetailModal(false);
    };

    const handleDeleteConfirm = async (password: string) => {
        if (!selectedPrescription) return false;
        const success = await deletePrescription(
            selectedPrescription.id,
            selectedPrescription.type,
            password
        );
        if (success) {
            setShowPasswordModal(false);
            setShowDetailModal(false);
            setSelectedPrescription(null);
            return true;
        }
        return false;
    };

    return (
        <SafeAreaView style={styles.container}>
            <PatientHeader patient={patientData} />

            {/* Selector de Solapas */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'bio' && styles.tabItemActive]}
                    onPress={() => setActiveTab('bio')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'bio' && styles.tabTextActive,
                        ]}
                    >
                        Bio
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'medications' && styles.tabItemActive]}
                    onPress={() => setActiveTab('medications')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'medications' && styles.tabTextActive,
                        ]}
                    >
                        Medicación ({prescriptions.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'visits' && styles.tabItemActive]}
                    onPress={() => setActiveTab('visits')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'visits' && styles.tabTextActive,
                        ]}
                    >
                        Consultas ({appointments.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'files' && styles.tabItemActive]}
                    onPress={() => setActiveTab('files')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'files' && styles.tabTextActive,
                        ]}
                    >
                        Archivos ({files.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Contenido de la solapa activa */}
            <View style={styles.tabContent}>
                {activeTab === 'bio' ? (
                    <PatientBioTab
                        patient={patientData}
                        onGoToMedication={() => {
                            setActiveTab('medications');
                            setShowAddModal(true);
                        }}
                        onOpenCreateLicense={() => {
                            setRequestModalType('license');
                            setShowRequestModal(true);
                        }}
                        onOpenCreateCertificate={() => {
                            setRequestModalType('certificate');
                            setShowRequestModal(true);
                        }}
                    />
                ) : activeTab === 'medications' ? (
                    <MedicationsTab
                        prescriptions={prescriptions}
                        onOpenAdd={() => setShowAddModal(true)}
                        onSelectPrescription={handleOpenPrescriptionDetail}
                        onRepeatPrescription={handleRepeatPrescription}
                    />
                ) : activeTab === 'visits' ? (
                    <VisitsTab
                        appointments={appointments}
                        onSelectAppointment={(appt) => {
                            setSelectedAppointment(appt);
                            setShowAppointmentModal(true);
                        }}
                    />
                ) : (
                    <FilesTab files={files} />
                )}
            </View>

            {/* Modales */}
            <CreateRequestModal
                visible={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                type={requestModalType}
                patientId={patientId}
                patientName={patientData.name || patientData.full_name || 'Paciente'}
                onSuccess={fetchDetails}
            />

            <AddMedicationModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={async (data) => {
                    return await addPrescription({
                        ...data,
                        appointmentId,
                    });
                }}
                saving={savingMed}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchResults={searchResults}
                searchingVademecum={searchingVademecum}
            />

            <PrescriptionDetailModal
                visible={showDetailModal}
                prescription={selectedPrescription}
                onClose={() => setShowDetailModal(false)}
                onRepeat={() => {
                    if (selectedPrescription) {
                        handleRepeatPrescription(selectedPrescription);
                        setShowDetailModal(false);
                    }
                }}
                onUpdate={handleUpdatePrescription}
                onRequestDelete={() => setShowPasswordModal(true)}
                actionLoading={actionLoading}
            />

            <DeleteConfirmModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={handleDeleteConfirm}
                actionLoading={actionLoading}
            />

            <AppointmentActionModal
                visible={showAppointmentModal}
                appointment={selectedAppointment}
                onClose={() => setShowAppointmentModal(false)}
                onUpdateStatus={async (id, status, reason) => {
                    const ok = await updateAppointmentStatus(id, status, reason);
                    if (ok) {
                        setSelectedAppointment((prev) =>
                            prev && prev.id === id ? { ...prev, status } : prev
                        );
                    }
                    return ok;
                }}
                onViewPatientProfile={() => {
                    setShowAppointmentModal(false);
                }}
                onOpenPayment={() => {
                    setShowPaymentModal(true);
                }}
            />

            <AppointmentPaymentModal
                visible={showPaymentModal}
                appointment={selectedAppointment}
                onClose={() => setShowPaymentModal(false)}
                onRegisterPayment={async (apptId, data) => {
                    return await registerPayment(apptId, data);
                }}
                onUpdatePaymentStatus={async (apptId, status) => {
                    return await updatePaymentStatus(apptId, status);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    errorText: {
        fontSize: 15,
        color: Colors.danger,
        textAlign: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    tabContent: {
        flex: 1,
    },
});
