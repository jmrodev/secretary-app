import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import TabButton from '../atoms/TabButton';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

const PatientHistoryModal = ({ isOpen, onClose, patientId, patientName }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('appointments');
    const [loading, setLoading] = useState(true);

    const [history, setHistory] = useState({
        appointments: [],
        prescriptions: [],
        licenses: [],
        requests: []
    });

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [apptRes, prescRes, licRes, reqRes] = await Promise.all([
                api.get(`/appointments?patientId=${patientId}`),
                api.get(`/medical/prescriptions?patientId=${patientId}`),
                api.get(`/medical/licenses?patientId=${patientId}`),
                api.get(`/medical/requests?patientId=${patientId}`)
            ]);

            setHistory({
                appointments: apptRes.data,
                prescriptions: prescRes.data,
                licenses: licRes.data,
                requests: reqRes.data
            });
        } catch (err) {
            console.error("Failed to fetch patient history", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('medical_history') || 'Medical History'}: ${patientName}`}
            size="lg"
        >
            <div className="tabs-container" style={{ margin: 0, padding: 0, borderBottom: '1px solid #e2e8f0' }}>
                <TabButton
                    isActive={activeTab === 'appointments'}
                    onClick={() => setActiveTab('appointments')}
                >
                    📅 {t('appointments') || 'Appointments'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'medical'}
                    onClick={() => setActiveTab('medical')}
                >
                    💊 {t('medical_records') || 'Medical Records'} (Rx, Requests, Lic)
                </TabButton>
            </div>

            <div className="modal-body-scrollable" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem 0' }}>
                {loading ? (
                    <div className="text-center p-4 text-muted">{t('loading') || 'Loading...'}</div>
                ) : (
                    <>
                        {activeTab === 'appointments' && (
                            <div className="flex-col gap-4">
                                {history.appointments.length === 0 ? <p className="text-muted italic">{t('no_history') || 'No records found.'}</p> : (
                                    history.appointments.map(appt => (
                                        <div key={appt.id} className={`p-3 border rounded ${appt.status === 'cancelled' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                            <div className="flex justify-between mb-1">
                                                <strong>{formatDate(appt.appointment_date)}</strong>
                                                <span className={`status-chip status-${appt.status}`}>{t(appt.status) || appt.status}</span>
                                            </div>
                                            <div className="text-sm text-main-600">
                                                Dr. {appt.doctor_name}
                                            </div>
                                            {appt.reason && (
                                                <div className="text-sm mt-1 italic text-main-700">
                                                    "{appt.reason}"
                                                </div>
                                            )}
                                            {appt.cancellation_reason && (
                                                <div className="text-xs mt-1 text-red-600 bg-red-100 p-1 rounded inline-block">
                                                    🚫 Reason: {appt.cancellation_reason}
                                                </div>
                                            )}
                                            {/* Behavior Rating Display if useful */}
                                            {appt.behavior_rating && (
                                                <div className="text-xs mt-1 text-blue-600">
                                                    ⭐ Patient Rating: {appt.behavior_rating}/5
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'medical' && (
                            <div className="flex-col gap-6">
                                {/* Prescriptions */}
                                <div>
                                    <h4 className="text-main-700 font-bold border-b mb-2 pb-1">{t('prescriptions') || 'Prescriptions'}</h4>
                                    {history.prescriptions.length === 0 ? <p className="text-sm text-muted">None</p> : (
                                        <ul className="list-none flex-col gap-2">
                                            {history.prescriptions.map(p => (
                                                <li key={p.id} className="bg-green-50 p-2 rounded border border-green-100 text-sm">
                                                    <div className="flex justify-between font-medium text-green-800">
                                                        <span>{formatDate(p.created_at || p.appointment_date)}</span>
                                                        <span>Dr. {p.doctor_name}</span>
                                                    </div>
                                                    <div className="mt-1 whitespace-pre-wrap">{p.medications}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Requests */}
                                <div>
                                    <h4 className="text-main-700 font-bold border-b mb-2 pb-1">{t('requests') || 'Requests'}</h4>
                                    {history.requests.length === 0 ? <p className="text-sm text-muted">None</p> : (
                                        <ul className="list-none flex-col gap-2">
                                            {history.requests.map(r => (
                                                <li key={r.id} className="bg-purple-50 p-2 rounded border border-purple-100 text-sm">
                                                    <div className="flex justify-between font-medium text-purple-800">
                                                        <span>{formatDate(r.created_at)}</span>
                                                        <span className="uppercase text-xs border border-purple-200 px-1 rounded">{r.type}</span>
                                                    </div>
                                                    <div className="mt-1">"{r.request_note}"</div>
                                                    <div className="text-xs text-muted text-right mt-1">{t(r.status)}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Licenses */}
                                <div>
                                    <h4 className="text-main-700 font-bold border-b mb-2 pb-1">{t('licenses') || 'Medical Licenses'}</h4>
                                    {history.licenses.length === 0 ? <p className="text-sm text-muted">None</p> : (
                                        <ul className="list-none flex-col gap-2">
                                            {history.licenses.map(l => (
                                                <li key={l.id} className="bg-orange-50 p-2 rounded border border-orange-100 text-sm">
                                                    <div className="flex justify-between font-medium text-orange-800">
                                                        <span>Start: {new Date(l.start_date).toLocaleDateString()}</span>
                                                        <span>{l.days_duration} Days</span>
                                                    </div>
                                                    <div className="mt-1 italic">{l.diagnosis}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PatientHistoryModal;
