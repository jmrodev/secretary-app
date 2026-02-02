
import React from 'react';
import { useMedicalDocumentsController } from '../controllers/useMedicalDocumentsController';

// Components
import Sidebar from '../components/organisms/Sidebar';
import Modal from '../components/molecules/Modal';
import TransactionModal from '../components/molecules/TransactionModal';
import PatientSearchSelect from '../components/molecules/PatientSearchSelect';
import MedicalRequestForm from '../components/organisms/MedicalRequestForm';
import MedicalRequestList from '../components/organisms/MedicalRequestList';
import MedicalHistoryTable from '../components/organisms/MedicalHistoryTable';
import MedicationAutocomplete from '../components/molecules/MedicationAutocomplete';
import CurrencyInput from '../components/atoms/CurrencyInput';
import Button from '../components/atoms/Button';

// Utils
import { timeAgo } from '../utils/time';

const MedicalDocuments = () => {
    const controller = useMedicalDocumentsController();
    const {
        user, t, activeTab, requestsSubTab,
        searchTerm, isEditing,
        requests, files, prescriptions, licenses, doctors,
        selectedFile, selectedPrescription,
        selectedLicense, selectedRequest,
        filePatient, fileDesc,
        fileToDelete, actionModal, actionNote,
        paymentModal, editData, licenseEditData,
        requestEditData,
        reqType, reqNote, bonified,
        sendToDoctor,

        // Permissions
        canDeletePrescription, canDeleteLicense, canDeleteFile, canDeleteRequest,
        printData,
        handlers
    } = controller;

    const {
        handleSearchChange, handleTabChange, handleSubTabChange,
        handleFileDescChange, handleFilePatientChange, handleFileUploadChange,
        handleActionNoteChange, handleEditDataChange, handleLicenseEditDataChange,
        handleRequestEditDataChange, handleSelectMedication, toggleEditing,
        closeActionModal, openActionModal, closePaymentModal, openPaymentModal,
        closeDeleteFileModal, openDeleteFileModal,
        handleCreateRequest, handleUpdateStatus, handleFileUpload, confirmFileDelete,
        handleUpdatePrescription, handleUpdateLicense, handleUpdateRequest, handleDeleteRequest,
        handleDeletePrescription, handleEditItem, handleDeleteLicense, fetchRequests,
        handleExportJSON, handlePrintPrescriptions, filterItem
    } = handlers;

    // --- Derived Data for Combined Views ---
    const combinedPrescriptions = [
        ...prescriptions.map(p => ({ ...p, _origin: 'prescription' })),
        ...requests.filter(r => r.type === 'prescription' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            medications: r.request_note,
            instructions: r.doctor_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const combinedLicenses = [
        ...licenses.map(l => ({ ...l, _origin: 'license' })),
        ...requests.filter(r => r.type === 'license' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            start_date: r.created_at,
            days_duration: '-',
            diagnosis: r.request_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const combinedCertificates = [
        ...requests.filter(r => r.type === 'certificate' && r.status === 'completed').map(r => ({
            ...r,
            _origin: 'request',
            description: r.request_note
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));



    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content no-print">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('medical_documents')}</h1>
                        <p className="page-header__subtitle">{t('medical_docs_subtitle') || 'Gestione requerimientos, archivos e historial de pacientes en un solo lugar.'}</p>
                    </div>
                </header>

                <nav className="tab-nav mb-8">
                    {[
                        { id: 'requests', label: t('requests_workflow'), icon: '⚡' },
                        { id: 'files', label: t('file_repository'), icon: '📂' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: '💊' },
                        { id: 'licenses', label: t('medical_licenses'), icon: '📄' },
                        { id: 'certificates', label: t('certificates') || 'Certificados', icon: '📜' }
                    ].map(tab => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => handleTabChange(tab.id)}
                            className={`tab-nav__item ${activeTab === tab.id ? 'tab-nav__item--active' : ''}`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </Button>
                    ))}
                </nav>

                <section className="action-bar mb-8">
                    <div className="action-bar__search">
                        <div className="search-box__wrapper">
                            <span className="search-box__icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('search_docs_placeholder')}
                                className="search-box__input"
                                value={searchTerm}
                                onChange={e => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <div className="tab-content animate-fadeIn">
                    {activeTab === 'requests' && (
                        <div className="flex flex-col gap-6">
                            <nav className="tab-nav tab-nav--sub mb-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSubTabChange('list')}
                                    className={`tab-nav__item ${requestsSubTab === 'list' ? 'tab-nav__item--active' : ''}`}
                                >
                                    📋 {t('request_status')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSubTabChange('new')}
                                    className={`tab-nav__item ${requestsSubTab === 'new' ? 'tab-nav__item--active' : ''}`}
                                >
                                    ➕ {t('new_request')}
                                </Button>
                            </nav>

                            {requestsSubTab === 'new' ? (
                                <MedicalRequestForm
                                    doctors={doctors}
                                    initialType={reqType}
                                    initialSendToDoctor={sendToDoctor}
                                    onRequestCreated={() => {
                                        handlers.fetchRequests();
                                        handleSubTabChange('list');
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-0">
                                        <h3 className="section-title mb-0">{user.role === 'doctor' ? t('pending_requests') : t('request_status')}</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={controller.handleExportJSON}
                                                className="border-slate-300 text-slate-600 hover:bg-slate-50"
                                            >
                                                💾 {t('export_json')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={controller.handlePrintPrescriptions}
                                                className="border-slate-300 text-slate-600 hover:bg-slate-50"
                                            >
                                                🖨️ {t('print_backup')}
                                            </Button>
                                        </div>
                                    </div>
                                    <MedicalRequestList
                                        requests={requests}
                                        filterItem={filterItem}
                                        handleDeleteRequest={handleDeleteRequest}
                                        openActionModal={openActionModal}
                                        setPaymentModal={openPaymentModal}
                                        canDelete={user.role === 'admin' || canDeleteRequest}
                                        handleEditRequest={handleEditItem}
                                    />
                                </>

                            )}
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <section className="lg:col-span-1">
                                <div className="card">
                                    <header className="card-header border-b-0 mb-4">
                                        <h3 className="card-header__title">{t('upload_document')}</h3>
                                    </header>
                                    <form className="flex flex-col gap-4" onSubmit={handleFileUpload}>
                                        <div className="input-group">
                                            <label className="input-label">{t('patient_label')}</label>
                                            <PatientSearchSelect value={filePatient} onChange={handleFilePatientChange} placeholder={t('select_patient')} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('description')}</label>
                                            <input className="input-field" value={fileDesc} onChange={e => handleFileDescChange(e.target.value)} placeholder="e.g. Lab Results PDF" required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{t('file')}</label>
                                            <input type="file" className="input-field" onChange={e => handleFileUploadChange(e.target.files[0])} required />
                                        </div>
                                        <Button type="submit" className="w-full">{t('upload_file')}</Button>
                                    </form>
                                </div>
                            </section>

                            <section className="lg:col-span-2">
                                <div className="card p-0 overflow-hidden">
                                    <header className="card-header border-b mb-0 p-6 bg-slate-50/50">
                                        <h3 className="card-header__title">{t('file_repository')}</h3>
                                    </header>
                                    <div className="p-0">
                                        {files.filter(filterItem).length === 0 ? (
                                            <div className="p-12 text-center text-muted border-dashed">
                                                <span className="text-4xl block mb-2">📂</span>
                                                {t('no_files')}
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table-base w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="pl-6">{t('file')}</th>
                                                            <th>{t('patient')}</th>
                                                            <th className="pr-6 text-right">{t('actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {files.filter(filterItem).map(f => (
                                                            <tr key={f.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => window.open(f.file_url, '_blank')}>
                                                                <td className="pl-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xl">📄</span>
                                                                        <span className="font-bold text-main-800">{f.description || f.file_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="font-medium text-main-600">{f.patient_name}</span>
                                                                </td>
                                                                <td className="pr-6 text-right">
                                                                    {(user.role === 'admin' || canDeleteFile) && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm-compact"
                                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                            onClick={(e) => { e.stopPropagation(); openDeleteFileModal(f); }}
                                                                        >
                                                                            🗑️
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                        <div className="animate-fadeIn flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h2 className="section-title mb-0">
                                    {activeTab === 'prescriptions' ? '💊 ' + t('prescriptions') :
                                        activeTab === 'licenses' ? '📄 ' + t('medical_licenses') :
                                            '📜 ' + (t('certificates') || 'Certificados')}
                                </h2>
                                {((activeTab === 'prescriptions' && canDeletePrescription) ||
                                    (['licenses', 'certificates'].includes(activeTab) && canDeleteLicense) ||
                                    user.role === 'admin') && (
                                        <div className="flex gap-2">
                                            {activeTab === 'prescriptions' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={controller.handleExportJSON}
                                                    className="border-slate-300 text-slate-600 hover:bg-slate-50"
                                                >
                                                    💾 {t('export_json')}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={controller.handlePrintPrescriptions}
                                                className="border-slate-300 text-slate-600 hover:bg-slate-50"
                                            >
                                                🖨️ {t('print_backup')}
                                            </Button>
                                        </div>
                                    )}
                            </div>
                            <MedicalHistoryTable
                                items={
                                    activeTab === 'prescriptions' ? combinedPrescriptions :
                                        activeTab === 'licenses' ? combinedLicenses :
                                            combinedCertificates
                                }
                                filterItem={filterItem}
                                onView={handleEditItem}
                                onDelete={
                                    activeTab === 'prescriptions' ? handleDeletePrescription :
                                        activeTab === 'licenses' ? handleDeleteLicense :
                                            (id, item) => handleDeleteRequest(id, item)
                                }
                                canDelete={
                                    user.role === 'admin' ||
                                    (activeTab === 'prescriptions' && canDeletePrescription) ||
                                    (['licenses', 'certificates'].includes(activeTab) && canDeleteLicense)
                                }
                                icon={activeTab === 'prescriptions' ? '💊' : activeTab === 'licenses' ? '📄' : '📜'}
                                title={
                                    activeTab === 'prescriptions' ? t('recent_prescriptions') :
                                        activeTab === 'licenses' ? t('recent_licenses') :
                                            t('recent_certificates')
                                }
                                originLabel={activeTab === 'certificates' ? t('certificate') : undefined}
                            />
                        </div>
                    )}
                </div>
            </main>



            {/* Print Section - Visible only on Print */}
            <div className="print-section hidden print:block bg-white p-8 w-full absolute top-0 left-0 z-50">
                <div className="text-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Reporte de Recetas y Solicitudes</h1>
                    <p className="text-sm text-gray-500">Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
                </div>

                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="py-2 px-2 border">Fecha</th>
                            <th className="py-2 px-2 border">Paciente</th>
                            <th className="py-2 px-2 border">Médico</th>
                            <th className="py-2 px-2 border">Origen</th>
                            <th className="py-2 px-2 border">Pago</th>
                            <th className="py-2 px-2 border">Detalle / Medicamentos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {printData && printData.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-2 px-2 border w-24">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="py-2 px-2 border font-medium">{item.patient_name}</td>
                                <td className="py-2 px-2 border">{item.doctor_name}</td>
                                <td className="py-2 px-2 border text-xs uppercase text-gray-500">
                                    {item.source_type === 'direct' ? 'Consulta' : 'Solicitud'}
                                </td>
                                <td className="py-2 px-2 border w-24">
                                    {item.source_type === 'request' ? (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                            item.payment_status === 'debt' ? 'bg-red-100 text-red-800' :
                                                item.payment_status === 'bonified' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100'
                                            }`}>
                                            {item.payment_status === 'paid' ? 'PAGADO' :
                                                item.payment_status === 'debt' ? 'DEUDA' :
                                                    item.payment_status === 'bonified' ? 'BONIF.' : item.payment_status}
                                            {item.amount > 0 && ` $${item.amount}`}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="py-2 px-2 border text-xs">
                                    <div className="font-mono whitespace-pre-wrap">{item.medications}</div>
                                    {item.instructions && <div className="italic text-gray-500 mt-1">{item.instructions}</div>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Modals --- */}

            <Modal
                isOpen={actionModal.open}
                onClose={closeActionModal}
                title={actionModal.type === 'completed' ? t('approve_request') : t('reject_request')}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeActionModal}>{t('cancel')}</Button>
                        <Button onClick={() => handleUpdateStatus(actionModal.id, actionModal.type, actionNote)}>{actionModal.type === 'completed' ? t('approve') : t('reject')}</Button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">{actionModal.type === 'completed' ? t('message_optional') : t('reason_rejection')}</label>
                    <textarea className="input-field" rows="3" value={actionNote} onChange={e => handleActionNoteChange(e.target.value)} autoFocus />
                </div>
            </Modal>

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={closePaymentModal}
                initialData={paymentModal.initialData}
                requestId={paymentModal.reqId}
                onSuccess={fetchRequests}
            />

            <Modal
                isOpen={!!fileToDelete}
                onClose={closeDeleteFileModal}
                title={t('confirm_delete')}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeDeleteFileModal}>{t('cancel')}</Button>
                        <Button variant="danger" onClick={confirmFileDelete}>{t('delete')}</Button>
                    </>
                }
            >
                <p>¿Seguro que desea eliminar el archivo <strong>{fileToDelete?.file_name}</strong>?</p>
            </Modal>

            {/* --- Edit Modals --- */}
            {isEditing && selectedPrescription && (
                <Modal
                    isOpen={isEditing && !!selectedPrescription}
                    onClose={() => toggleEditing(false)}
                    title={`${t('prescription_for')} ${selectedPrescription.patient_name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                            <Button onClick={handleUpdatePrescription}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('medications')}</label>
                            <MedicationAutocomplete
                                value=""
                                onChange={() => { }}
                                onSelectMedication={handleSelectMedication}
                            />
                            <textarea className="input-field mt-2" rows="4" value={editData.medications} onChange={e => handleEditDataChange('medications', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('instructions')}</label>
                            <textarea className="input-field" rows="3" value={editData.instructions} onChange={e => handleEditDataChange('instructions', e.target.value)} />
                        </div>
                    </div>
                </Modal>
            )}

            {isEditing && selectedLicense && (
                <Modal
                    isOpen={isEditing && !!selectedLicense}
                    onClose={() => toggleEditing(false)}
                    title={`${t('license_for')} ${selectedLicense.patient_name}`}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                            <Button onClick={handleUpdateLicense}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">{t('start_date')}</label>
                                <input type="date" className="input-field" value={licenseEditData.start_date} onChange={e => handleLicenseEditDataChange('start_date', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('days_duration')}</label>
                                <input type="number" className="input-field" value={licenseEditData.days_duration} onChange={e => handleLicenseEditDataChange('days_duration', e.target.value)} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('diagnosis')}</label>
                            <textarea className="input-field" rows="3" value={licenseEditData.diagnosis} onChange={e => handleLicenseEditDataChange('diagnosis', e.target.value)} />
                        </div>
                    </div>
                </Modal>
            )}

            {isEditing && selectedRequest && (
                <Modal
                    isOpen={isEditing && !!selectedRequest}
                    onClose={() => toggleEditing(false)}
                    title={t('edit_request')}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => toggleEditing(false)}>{t('cancel')}</Button>
                            <Button onClick={handleUpdateRequest}>{t('save')}</Button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('request_note')}</label>
                            <textarea className="input-field" rows="3" value={requestEditData.request_note} onChange={e => handleRequestEditDataChange('request_note', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('doctor_reply')}</label>
                            <textarea className="input-field" rows="3" value={requestEditData.doctor_note} onChange={e => handleRequestEditDataChange('doctor_note', e.target.value)} />
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                            <input
                                type="checkbox"
                                id="edit-req-bonified"
                                checked={requestEditData.bonified}
                                onChange={e => handleRequestEditDataChange('bonified', e.target.checked)}
                                className="w-5 h-5 cursor-pointer accent-blue-600"
                            />
                            <label htmlFor="edit-req-bonified" className="text-sm font-bold text-main-800 cursor-pointer select-none">
                                {t('bonificado') || 'Bonificado (Costo $0)'}
                            </label>
                        </div>

                        {!requestEditData.bonified && (
                            <>
                                <div className="input-group form-field--amount">
                                    <label className="input-label font-bold text-main-700">{t('debt_amount')} ($)</label>
                                    <CurrencyInput
                                        className="input-field border-slate-200"
                                        value={requestEditData.debt_amount}
                                        onChange={e => handleRequestEditDataChange('debt_amount', e.target.value)}
                                    />
                                </div>

                                <div className="input-group form-field--payment">
                                    <label className="input-label font-bold text-main-700">{t('payment_method') || 'Tipo de Pago'}</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {['cash', 'transfer', 'debit', 'credit', 'mercadopago'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => handleRequestEditDataChange('payment_method', m)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${requestEditData.payment_method === m ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                                            >
                                                {t(m) || m.charAt(0).toUpperCase() + m.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MedicalDocuments;
