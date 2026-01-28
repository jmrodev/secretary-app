import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRequirementsController } from '../../controllers/useRequirementsController';
import api from '../../api/axios';

// Components
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import TabButton from '../atoms/TabButton';
import Badge from '../atoms/Badge';
import Input from '../atoms/Input';
import MedicalRequestForm from './MedicalRequestForm';

/**
 * RequirementsList Organism.
 * Displays and manages medical requests with list, new, and recycle bin views.
 * Uses BEM naming convention.
 */
const RequirementsList = ({ user }) => {
    const { t } = useLanguage();
    const {
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
        actionModal,
        setActionModal,
        actionNote,
        setActionNote,
        activeTab,
        setActiveTab,
        recycleRequests,
        doctors,
        filter,
        setFilter,
        handleRestore,
        openActionModal,
        confirmAction,
        handleDelete,
        fetchRequests,
        canDeleteRequest
    } = useRequirementsController(user);

    // New state for medication validation & editing
    const [patientMeds, setPatientMeds] = useState([]);
    const [fetchingMeds, setFetchingMeds] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editMeds, setEditMeds] = useState([]); // Array of objects {name, dose, frequency, quantity}
    const [editNotes, setEditNotes] = useState('');
    const [newMedInput, setNewMedInput] = useState({ name: '', dose: '', frequency: '', quantity: '' });

    useEffect(() => {
        if (selectedRequest) {
            setIsEditing(false);
            setEditMeds([]);
            setEditNotes('');

            // Extract current values for edit mode init
            const { meds, notes } = extractDetails(selectedRequest);
            setEditMeds(meds);
            setEditNotes(notes);

            if (selectedRequest.patient_id) {
                fetchPatientMeds(selectedRequest.patient_id);
            } else {
                setPatientMeds([]);
            }
        }
    }, [selectedRequest]);

    const fetchPatientMeds = (patientId) => {
        setFetchingMeds(true);
        api.get(`/medical/patients/${patientId}/medications`)
            .then(res => setPatientMeds(res.data || []))
            .catch(err => {
                console.error("Error fetching patient meds:", err);
                setPatientMeds([]);
            })
            .finally(() => setFetchingMeds(false));
    };

    const addToChronic = async (medName) => {
        if (!confirm(`¿Desea agregar "${medName}" a la lista de medicación crónica del paciente?`)) return;

        try {
            await api.post('/medical/patients/medications', {
                patient_id: selectedRequest.patient_id,
                medication_name: medName,
                is_chronic: true,
                status: 'active'
            });
            // Refresh patient meds to update UI (move to blue list)
            fetchPatientMeds(selectedRequest.patient_id);
        } catch (e) {
            console.error(e);
            alert("Error al agregar medicación");
        }
    };

    const extractDetails = (req) => {
        let meds = [];
        let notes = '';

        // Try structured data
        if (req.raw_medication_data) {
            try {
                const parsed = typeof req.raw_medication_data === 'string'
                    ? JSON.parse(req.raw_medication_data)
                    : req.raw_medication_data;

                // Normalize to objects
                if (Array.isArray(parsed)) {
                    meds = parsed.map(item => {
                        if (typeof item === 'string') return { name: item, dose: '', frequency: '', quantity: '' };
                        return item;
                    });
                }
            } catch (e) {
                console.error("Error parsing raw_medication_data", e);
            }
        }

        let noteContent = req.request_note || '';
        const isPublic = noteContent.includes('[Solicitud Paciente]');

        if (isPublic) {
            const content = noteContent.replace('[Solicitud Paciente]', '').trim();
            const parts = content.split(/\n?Notas:\s?/i);
            const medsPart = parts[0].trim();
            if (parts.length > 1) {
                notes = parts.slice(1).join('Notas: ').trim();
            }
            if (!meds || meds.length === 0) {
                if (medsPart) meds = medsPart.split(',').map(m => m.trim()).filter(Boolean);
            }
        } else {
            notes = noteContent;
        }

        // Final normalization to ensure everything is an object
        if (Array.isArray(meds)) {
            meds = meds.map(item => {
                if (!item) return { name: 'Desconocido', dose: '', frequency: '', quantity: '' };
                if (typeof item === 'string') return { name: item, dose: '', frequency: '', quantity: '' };
                return item;
            });
        } else {
            meds = [];
        }

        return { meds: meds || [], notes: notes || '' };
    };

    const handleSaveEdit = async () => {
        try {
            // Reconstruct note for legacy
            const medsString = editMeds.map(m => {
                let s = m.name;
                if (m.dose) s += ` ${m.dose}`;
                if (m.frequency) s += ` (${m.frequency})`;
                if (m.quantity) s += ` [Qty: ${m.quantity}]`;
                return s;
            }).join(', ');

            const newRequestNote = `[Solicitud Paciente] ${medsString}\nNotas: ${editNotes}`;

            const payload = {
                raw_medication_data: JSON.stringify(editMeds),
                request_note: newRequestNote
            };

            await api.put(`/medical/requests/${selectedRequest.id}`, payload);

            // Update UI
            setSelectedRequest(prev => ({
                ...prev,
                ...payload,
                raw_medication_data: JSON.stringify(editMeds)
            }));
            fetchRequests(); // Background refresh
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar cambios"); // Simple alert for now
        }
    };

    const handleAddMed = () => {
        if (newMedInput.name.trim()) {
            setEditMeds([...editMeds, { ...newMedInput, name: newMedInput.name.trim() }]);
            setNewMedInput({ name: '', dose: '', frequency: '', quantity: '' });
        }
    };

    const handleRemoveMed = (index) => {
        setEditMeds(prev => prev.filter((_, i) => i !== index));
    };

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'certificate': 'Certificado 📜',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div className="requirements-list__loading">Cargando requerimientos...</div>;

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user.role);
    const canEdit = user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor';

    // Helper for validation logic
    const checkIsKnown = (medName) => {
        if (!medName) return false;
        return patientMeds.some(pm => {
            const pmName = (pm.medication_name || pm.name || '').toLowerCase();
            const reqName = medName.toLowerCase();
            return pmName.includes(reqName) || reqName.includes(pmName);
        });
    };

    const calculateDuration = (qty, freq) => {
        if (!qty || !freq) return null;
        const q = parseInt(qty, 10);
        if (isNaN(q)) return null;

        // Try to parse frequency
        // Case: "1 cada 8 hs" or "1/8h"
        const hourlyMatch = freq.match(/(\d+)?\s*(?:cada|\/)\s*(\d+)\s*(?:hs|h|horas)/i);
        if (hourlyMatch) {
            const amount = hourlyMatch[1] ? parseInt(hourlyMatch[1], 10) : 1;
            const hours = parseInt(hourlyMatch[2], 10);
            if (hours > 0) {
                const daily = (24 / hours) * amount;
                return Math.round(q / daily);
            }
        }
        // Case: "3 al día" or "3 daily"
        const dailyMatch = freq.match(/(\d+)\s*(?:al día|por día|daily|xdia)/i);
        if (dailyMatch) {
            const daily = parseInt(dailyMatch[1], 10);
            return daily > 0 ? Math.round(q / daily) : null;
        }

        return null;
    };

    return (
        <div className="requirements-list">
            {/* Top Level Navigation */}
            <nav className="requirements-list__nav tabs-container">
                <TabButton
                    isActive={activeTab === 'list'}
                    onClick={() => setActiveTab('list')}
                >
                    📋 {t('request_status')}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'new'}
                    onClick={() => setActiveTab('new')}
                >
                    ➕ {t('new_request')}
                </TabButton>
                {isAdminOrSecretary && canDeleteRequest && (
                    <TabButton
                        isActive={activeTab === 'recycle'}
                        onClick={() => setActiveTab('recycle')}
                    >
                        🗑️ Papelera {recycleRequests.length > 0 && (
                            <span className="requirements-list__count-badge">
                                {recycleRequests.length}
                            </span>
                        )}
                    </TabButton>
                )}
            </nav>

            {activeTab === 'new' ? (
                <div className="requirements-list__form-view">
                    <MedicalRequestForm
                        doctors={doctors}
                        onRequestCreated={() => {
                            fetchRequests();
                            setActiveTab('list');
                        }}
                    />
                </div>
            ) : activeTab === 'list' ? (
                <div className="requirements-list__list-view">
                    {/* Status Filters */}
                    <div className="requirements-list__filters">
                        <TabButton
                            variant="pill"
                            isActive={filter === 'active'}
                            onClick={() => setFilter('active')}
                        >
                            {t('pending') || 'Pendientes'}
                        </TabButton>
                        <TabButton
                            variant="pill"
                            isActive={filter === 'history'}
                            onClick={() => setFilter('history')}
                        >
                            {t('history') || 'Historial'}
                        </TabButton>
                    </div>

                    {requests.length === 0 ? (
                        <div className="requirements-list__empty no-requirements-msg">
                            {t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-base requirements-list__table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Fecha</th>
                                        <th>Paciente</th>
                                        <th>Doctor</th>
                                        <th>Solicitado Por</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <Badge
                                                    variant={r.type === 'prescription' ? 'chip-blue' : 'chip-green'}
                                                    className="type-chip-link cursor-pointer"
                                                    onClick={() => setSelectedRequest(r)}
                                                    title="Ver detalle"
                                                >
                                                    {typeLabels[r.type] || r.type}
                                                </Badge>
                                            </td>
                                            <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td><strong>{r.patient_name}</strong></td>
                                            <td><span className="text-muted">Dr. {r.doctor_name}</span></td>
                                            <td>
                                                <span className="requirements-list__author">
                                                    {r.secretary_name || 'Secretaría'}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge variant={r.status}>
                                                    {t(r.status) || r.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="requirements-list__actions">
                                                    {canDeleteRequest && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="btn-icon-base btn-icon-red"
                                                            onClick={() => handleDelete(r.id)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </Button>
                                                    )}
                                                    {isAdminOrSecretary && r.status === 'consult' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="btn-icon-base btn-icon-blue"
                                                            onClick={() => openActionModal('reply', r.id)}
                                                            title={t('reply')}
                                                        >
                                                            💬
                                                        </Button>
                                                    )}
                                                    {(r.status === 'pending' || r.status === 'consult') && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-green"
                                                                onClick={() => openActionModal('completed', r.id)}
                                                                title={t('mark_as_done')}
                                                            >
                                                                ✅
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-yellow"
                                                                onClick={() => openActionModal('consult', r.id)}
                                                                title={t('consult_secretary')}
                                                            >
                                                                ❓
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-red"
                                                                onClick={() => openActionModal('rejected', r.id)}
                                                                title={t('reject')}
                                                            >
                                                                ❌
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="requirements-list__recycle-view">
                    {recycleRequests.length === 0 ? (
                        <div className="requirements-list__recycle-empty">
                            <span className="requirements-list__recycle-empty-icon">🗑️</span>
                            No hay elementos en la papelera.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-base requirements-list__table">
                                <thead>
                                    <tr>
                                        <th>Elemento</th>
                                        <th>Eliminado Por</th>
                                        <th>Fecha Eliminación</th>
                                        <th>Expira</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recycleRequests.map(item => (
                                        <tr key={item.id} className="requirements-list__recycle-row">
                                            <td><strong>{item.entity_name}</strong></td>
                                            <td>{item.deleted_by_name}</td>
                                            <td>{new Date(item.deleted_at).toLocaleString()}</td>
                                            <td className="requirements-list__recycle-expires">
                                                {new Date(item.expires_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    className="requirements-list__restore-btn"
                                                    onClick={() => handleRestore(item)}
                                                >
                                                    ♻️ Restaurar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Detalle de Solicitud"
            >
                {selectedRequest && (
                    <div className="requirements-list__detail">
                        <div className="requirements-list__detail-section">
                            <strong>Paciente:</strong> {selectedRequest.patient_name} <br />
                            <small className="text-muted">DNI: {selectedRequest.patient_dni}</small>
                        </div>
                        <div className="requirements-list__detail-section">
                            <strong>Doctor:</strong> {selectedRequest.doctor_name}
                        </div>
                        <div className="requirements-list__detail-header">
                            <div>
                                <strong>Tipo:</strong> {typeLabels[selectedRequest.type] || selectedRequest.type}
                            </div>
                            {canEdit && !isEditing && (
                                <Button size="sm-compact" variant="secondary" onClick={() => setIsEditing(true)}>
                                    ✏️ Editar Lista
                                </Button>
                            )}
                        </div>

                        {/* Note Box / Edit Box */}
                        <div className={`requirements-list__note-box ${isEditing ? 'requirements-list__note-box--editing' : 'requirements-list__note-box--readonly'}`}>
                            {isEditing ? (
                                <div className="requirements-list__edit-container">
                                    <h4 className="requirements-list__edit-title">📝 Editando Medicación</h4>

                                    {/* MEdication List Editor */}
                                    <div className="requirements-list__med-editor">
                                        {editMeds.map((med, idx) => (
                                            <div key={idx} className="requirements-list__med-item">
                                                <div className="requirements-list__med-grid">
                                                    <div>
                                                        <Input
                                                            type="text"
                                                            placeholder="Nombre"
                                                            value={med.name}
                                                            onChange={(e) => {
                                                                const newMeds = [...editMeds];
                                                                newMeds[idx] = { ...med, name: e.target.value };
                                                                setEditMeds(newMeds);
                                                            }}
                                                            className="requirements-list__med-input requirements-list__med-input--name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type="text"
                                                            placeholder="Dosis"
                                                            value={med.dose}
                                                            onChange={(e) => {
                                                                const newMeds = [...editMeds];
                                                                newMeds[idx] = { ...med, dose: e.target.value };
                                                                setEditMeds(newMeds);
                                                            }}
                                                            className="requirements-list__med-input"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type="text"
                                                            placeholder="Frec (Ej: 1/8h)"
                                                            value={med.frequency}
                                                            onChange={(e) => {
                                                                const newMeds = [...editMeds];
                                                                newMeds[idx] = { ...med, frequency: e.target.value };
                                                                setEditMeds(newMeds);
                                                            }}
                                                            className="requirements-list__med-input"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Cant"
                                                            value={med.quantity}
                                                            onChange={(e) => {
                                                                const newMeds = [...editMeds];
                                                                newMeds[idx] = { ...med, quantity: e.target.value };
                                                                setEditMeds(newMeds);
                                                            }}
                                                            className="requirements-list__med-input"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm-compact"
                                                    variant="ghost"
                                                    className="text-red-500"
                                                    onClick={() => handleRemoveMed(idx)}
                                                >
                                                    ❌
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Med */}
                                    <div className="requirements-list__med-add-section">
                                        <div className="requirements-list__med-add-grid">
                                            <div>
                                                <Input
                                                    type="text"
                                                    placeholder="Nuevo medicamento..."
                                                    value={newMedInput.name}
                                                    onChange={(e) => setNewMedInput({ ...newMedInput, name: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
                                                    className="requirements-list__med-input--add requirements-list__med-input--add-name"
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    type="text"
                                                    placeholder="Dosis"
                                                    value={newMedInput.dose}
                                                    onChange={(e) => setNewMedInput({ ...newMedInput, dose: e.target.value })}
                                                    className="requirements-list__med-input--add requirements-list__med-input--add-small"
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    type="text"
                                                    placeholder="Frecuencia"
                                                    value={newMedInput.frequency}
                                                    onChange={(e) => setNewMedInput({ ...newMedInput, frequency: e.target.value })}
                                                    className="requirements-list__med-input--add requirements-list__med-input--add-small"
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    type="number"
                                                    placeholder="Cant"
                                                    value={newMedInput.quantity}
                                                    onChange={(e) => setNewMedInput({ ...newMedInput, quantity: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
                                                    className="requirements-list__med-input--add requirements-list__med-input--add-small"
                                                />
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={handleAddMed} disabled={!newMedInput.name.trim()}>
                                            ➕
                                        </Button>
                                    </div>

                                    {/* Notes Editor */}
                                    <div className="requirements-list__notes-editor">
                                        <label className="requirements-list__notes-label">Notas Adicionales</label>
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            className="requirements-list__notes-textarea"
                                            rows="2"
                                        ></textarea>
                                    </div>

                                    {/* Actions */}
                                    <div className="requirements-list__edit-actions">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                            Cancelar
                                        </Button>
                                        <Button size="sm" onClick={handleSaveEdit}>
                                            💾 Guardar Cambios
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // READ ONLY VIEW (Validated Split)
                                (() => {
                                    const { meds, notes } = extractDetails(selectedRequest);

                                    // Separate into Known and Unknown
                                    const knownMeds = [];
                                    const unknownMeds = [];

                                    meds.forEach(m => {
                                        if (checkIsKnown(m.name)) knownMeds.push(m);
                                        else unknownMeds.push(m);
                                    });

                                    return (
                                        <div>
                                            {meds && meds.length > 0 ? (
                                                <div className="requirements-list__med-section">
                                                    <div className="requirements-list__med-header">
                                                        <strong className="requirements-list__med-title">💊 Medicación Solicitada:</strong>
                                                        {fetchingMeds && <span className="requirements-list__med-loading">Verificando historial...</span>}
                                                    </div>

                                                    {/* NEW / UNKNOWN SECTION */}
                                                    {unknownMeds.length > 0 && (
                                                        <div className="requirements-list__med-unknown">
                                                            <h4 className="requirements-list__med-unknown-title">
                                                                ⚠️ Nuevos / No Habituales
                                                            </h4>
                                                            <div className="requirements-list__med-list">
                                                                {unknownMeds.map((m, i) => (
                                                                    <div key={i} className="requirements-list__med-card">
                                                                        <div className="requirements-list__med-card-header">
                                                                            <span className="requirements-list__med-name">{m.name}</span>
                                                                            {canEdit && (
                                                                                <Button
                                                                                    size="sm-compact"
                                                                                    className="requirements-list__med-save-btn"
                                                                                    onClick={() => addToChronic(m.name)}
                                                                                    title="Agregar a ficha del paciente"
                                                                                >
                                                                                    📥 Guardar
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                        <div className="requirements-list__med-details">
                                                                            {m.dose && <span className="requirements-list__med-badge">D: {m.dose}</span>}
                                                                            {m.frequency && <span className="requirements-list__med-badge">F: {m.frequency}</span>}
                                                                            {m.quantity && <span className="requirements-list__med-badge requirements-list__med-badge--quantity">Cant: {m.quantity}</span>}

                                                                            {m.quantity && m.frequency && (
                                                                                (() => {
                                                                                    const days = calculateDuration(m.quantity, m.frequency);
                                                                                    if (days) return <span className="requirements-list__med-duration">⏱️ ~{days} días</span>
                                                                                    return null;
                                                                                })()
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="requirements-list__med-warning">
                                                                Estos medicamentos no figuran en el historial crónico. Verifique con la doctora o agreguelos a la ficha si corresponde.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* KNOWN SECTION */}
                                                    {knownMeds.length > 0 && (
                                                        <div className="requirements-list__med-known">
                                                            {unknownMeds.length > 0 && <h4 className="requirements-list__med-known-title">Habituales (Validado)</h4>}
                                                            <div className="requirements-list__med-known-list">
                                                                {knownMeds.map((m, i) => (
                                                                    <div key={i} className="requirements-list__med-known-card">
                                                                        <div className="requirements-list__med-known-header">
                                                                            <span className="requirements-list__med-known-name">{m.name}</span>
                                                                            <span className="requirements-list__med-known-check" title="En lista crónica">✓</span>
                                                                        </div>
                                                                        {(m.dose || m.frequency || m.quantity) && (
                                                                            <div className="requirements-list__med-known-details">
                                                                                {m.dose && <span>{m.dose}</span>}
                                                                                {m.frequency && <span>• {m.frequency}</span>}
                                                                                {m.quantity && <span>• x{m.quantity}</span>}
                                                                                {m.quantity && m.frequency && (
                                                                                    (() => {
                                                                                        const days = calculateDuration(m.quantity, m.frequency);
                                                                                        if (days) return <span className="requirements-list__med-known-duration">({days}d)</span>
                                                                                        return null;
                                                                                    })()
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!fetchingMeds && patientMeds.length === 0 && meds.length > 0 && (
                                                        <p className="requirements-list__med-empty-note">El paciente no tiene medicación crónica registrada. Todos aparecen como nuevos.</p>
                                                    )}
                                                </div>
                                            ) : null}

                                            {notes && (
                                                <div className={meds && meds.length > 0 ? 'requirements-list__notes-section' : ''}>
                                                    <strong className="requirements-list__notes-title">
                                                        {meds && meds.length > 0 ? '📝 Notas Adicionales:' : 'Detalle / Motivo:'}
                                                    </strong>
                                                    <div className="requirements-list__notes-content">
                                                        {notes}
                                                    </div>
                                                </div>
                                            )}

                                            {!meds?.length && !notes && <span className="text-muted italic">Sin detalles adicionales.</span>}
                                        </div>
                                    );
                                })()
                            )}
                        </div>

                        {selectedRequest.doctor_note && (
                            <div className="requirements-list__doctor-note">
                                <strong>{t('doctor_note')}:</strong>
                                <pre className="requirements-list__note-pre whitespace-pre-wrap mt-2 font-sans">
                                    {selectedRequest.doctor_note}
                                </pre>
                            </div>
                        )}
                        {selectedRequest.secretary_note && (
                            <div className="requirements-list__secretary-note">
                                <strong>{t('secretary_reply')}:</strong>
                                <pre className="requirements-list__note-pre whitespace-pre-wrap mt-2 font-sans">
                                    {selectedRequest.secretary_note}
                                </pre>
                            </div>
                        )}

                        <div className="requirements-list__modal-footer">
                            <Button onClick={() => setSelectedRequest(null)} variant="secondary">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modal (Doctor/Secretary) */}
            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={
                    actionModal.type === 'completed' ? t('mark_as_done') :
                        (actionModal.type === 'rejected' ? t('reject_request') :
                            (actionModal.type === 'consult' ? t('consult_secretary') :
                                (actionModal.type === 'reply' ? t('reply_to_doctor') : 'Acción')))
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={confirmAction}>
                            {actionModal.type === 'consult' ? t('send_message') : t('confirm')}
                        </Button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">
                        {actionModal.type === 'consult' ? t('your_question') :
                            (actionModal.type === 'reply' ? t('your_answer') : t('doctor_note'))}
                        {['rejected', 'consult', 'reply'].includes(actionModal.type) && <span className="text-red-500"> *</span>}
                    </label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                        placeholder={
                            actionModal.type === 'consult' ? t('consult_placeholder') || "Escriba su consulta..." :
                                (actionModal.type === 'rejected' ? t('reject_reason') || "Motivo del rechazo..." :
                                    (actionModal.type === 'reply' ? t('reply_placeholder') || "Escriba su respuesta..." :
                                        t('optional_note') || "Nota opcional..."))
                        }
                    ></textarea>
                </div>
            </Modal>
        </div>
    );
};

export default RequirementsList;
