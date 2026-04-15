# Reporte de Violaciones Arquitectónicas - Frontend
Fecha: mar 14 abr 2026 21:55:19 -03

## 1. Uso de <button> nativos (Debe usar <Button />)

## 2. Posible uso de iconos nativos/emojis (Debe usar <Icon />)

## 3. Uso de Tailwind CSS (Prohibido)
/home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorsManager.jsx:29:                <div className="flex items-center gap-2 text-sm font-medium text-muted">
/home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorsManager.jsx:57:                            <div className="flex flex-col gap-3">
/home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorsManager.jsx:60:                                    className="justify-start w-full"
/home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorMessagesForm.jsx:64:                <div className="config-flex config-flex--between config-flex--center w-100">
/home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorGoogleSettings.jsx:46:                        className="w-full text-danger"
/home/cima/Documentos/secretary-app/client/src/features/insurances/InsurancesPage.jsx:46:                <div className="flex items-center gap-2 text-sm font-medium text-muted">
/home/cima/Documentos/secretary-app/client/src/features/insurances/InsurancesPage.jsx:74:                            <div className="flex flex-col gap-3">
/home/cima/Documentos/secretary-app/client/src/features/insurances/InsurancesPage.jsx:77:                                    className="justify-start w-full"
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:22:                <div className="max-w-md mx-auto mt-20 p-8 bg-red-50 border border-red-100 rounded-xl text-center">
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:23:                    <Icon name="block" size="3rem" className="text-red-500 mb-4 mx-auto" />
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:24:                    <h2 className="text-red-800 font-bold text-xl mb-2">Access Denied</h2>
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:25:                    <p className="text-red-600">No tiene permisos para gestionar usuarios.</p>
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:40:                    <div className="flex-1"></div>
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:41:                    <div className="flex items-center gap-4">
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:52:                            <div className="flex flex-col gap-3">
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:55:                                    className="justify-start w-full"
/home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.jsx:63:                                    className="justify-start w-full"
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserTable.jsx:40:                                            {u.phoneNumbers.length > 1 && <Badge variant="blue" className="text-[10px] px-1">+{u.phoneNumbers.length - 1}</Badge>}
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:8:        <div className="user-manager h-full flex flex-col">
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:9:            <header className="mb-6 border-b pb-4">
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:10:                <h2 className="text-2xl font-bold text-slate-800">{t('user_management') || 'Gestión de Usuarios'}</h2>
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:11:                <p className="text-slate-500">{t('manage_users_subtitle') || 'Administra cuentas de médicos, secretarias y administradores.'}</p>
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:14:            <div className="flex gap-4 mb-6">
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.jsx:31:            <div className="flex-1 dashboard-card dashboard-card--highlighted overflow-hidden">
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManagement.jsx:101:            <Card className="p-0 overflow-hidden">
/home/cima/Documentos/secretary-app/client/src/features/users/components/UserManagement.jsx:103:                    <div className="py-12 text-center text-muted animate-pulse">{t('loading_users')}</div>
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:92:                <span className="calendar-slot-controls__label flex items-center gap-1"><Icon name="lock_open" size="1rem" />{t('include_overtime')}</span>
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:155:        <Modal isOpen={isOpen} onClose={onClose} title={<div className="flex items-center gap-2"><Icon name="search" size="1.2rem" />{t('search_free_slots')}</div>} size="lg">
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:219:                                {renderSection(<div className="flex items-center gap-2"><Icon name="lock_open" size="1.1rem" /> {t('before_hours_extra')}</div>, selectedSlots.filter(s => s.is_out_of_hours && s.iso < (selectedSlots.find(n => !n.is_out_of_hours && !n.is_break)?.iso || '99:99')), 'before')}
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:220:                                {renderSection(<div className="flex items-center gap-2"><Icon name="check_circle" size="1.1rem" /> {t('attention_hours')}</div>, selectedSlots.filter(s => !s.is_out_of_hours && !s.is_break), 'normal')}
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:221:                                {renderSection(<div className="flex items-center gap-2"><Icon name="coffee" size="1.1rem" /> {t('breaks_special_slots')}</div>, selectedSlots.filter(s => s.is_break), 'break')}
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/NextSlotCalendarModal.jsx:222:                                {renderSection(<div className="flex items-center gap-2"><Icon name="lock_open" size="1.1rem" /> {t('after_hours_extra')}</div>, selectedSlots.filter(s => s.is_out_of_hours && s.iso > (selectedSlots.filter(n => !n.is_out_of_hours && !n.is_break).pop()?.iso || '00:00')), 'after')}
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/CalendarSection.jsx:32:                        <div className="flex flex-col gap-5 mt-5">
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/CalendarSection.jsx:51:                                <div className="flex gap-2">
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/CalendarSection.jsx:53:                                        variant="outline" className="flex-1 justify-center"
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/CalendarSection.jsx:74:                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/RequestsPage.jsx:26:                    <div className="flex-1"></div>
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/RequestsPage.jsx:27:                    <div className="dashboard-nav-bar__actions flex items-center gap-4">
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/MedicalDocumentsPage.jsx:300:                                        {item.instructions && <span className="text-muted italic">{item.instructions}</span>}
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/RequirementDetailHeader.jsx:15:                    <small className="requirements-detail__patient-dni text-gray-500 font-medium">DNI: {selectedRequest.patient_dni}</small>
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalFileRepository.jsx:78:                                        <th className="pr-6 text-right">{t('actions')}</th>
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalFileRepository.jsx:97:                                            <td className="pr-6 text-right">
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalFileRepository.jsx:102:                                                        className="text-danger"
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalRequirementActionModal.jsx:39:                    {['rejected', 'consult', 'reply'].includes(actionModal.type) && <span className="text-danger">*</span>}
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/PrescriptionItemsList.jsx:50:                            className="text-danger"
/home/cima/Documentos/secretary-app/client/src/features/patients/PatientsPage.jsx:164:                                            className="w-full justify-start"
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientHistoryTable.jsx:51:                                        <td className="patient-details__history-cell text-success patient-details__table-cell-bold">
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientRecycleBin.jsx:46:                            <th className="w-1/3">{t('patient') || 'Paciente'}</th>
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientRecycleBin.jsx:47:                            <th className="w-1/4">{t('contact_info') || 'Contacto'}</th>
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientRecycleBin.jsx:48:                            <th className="w-1/4">{t('deleted_date') || 'Fecha Eliminación'}</th>
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientRecycleBin.jsx:49:                            <th className="w-1/6 text-right">{t('actions') || 'Acciones'}</th>
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientRecycleBin.jsx:95:                                <td className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/patients/components/ActiveMedicationsList.jsx:32:                        <th className="text-right">{t('actions')}</th>
/home/cima/Documentos/secretary-app/client/src/features/patients/components/ActiveMedicationsList.jsx:64:                            <td className="patient-medications__table-cell text-right">
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.jsx:86:        return <p className="printable-text text-preline">{cleanStr}</p>;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.jsx:230:                                        <div className="flex-1">
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.jsx:231:                                            <div className="printable-item-header mb-1 text-sm-compact">
/home/cima/Documentos/secretary-app/client/src/features/institutions/components/InstitutionList.jsx:27:                        <th className="institution-list__th text-right">{t('actions') || 'Acciones'}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:20:        <div className="card table-responsive p-0 overflow-hidden shadow-sm">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:22:                <thead className="bg-slate-50">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:23:                    <tr className="border-b text-left text-xs uppercase tracking-wider text-main-500">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:27:                        <th className="py-3 px-4 w-1/3">{t('details_header')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:34:                            <td className="py-3 px-4 text-sm text-main-500 whitespace-nowrap">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:37:                            <td className="py-3 px-4 text-sm font-medium text-main-700">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:43:                            <td className="py-3 px-4 text-sm max-w-xs truncate" title={log.details}>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:46:                                        <div className="flex items-center gap-2">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:47:                                            <span className="text-main-500 truncate block max-w-[200px]">{log.details}</span>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:56:                                    ) : <span className="text-main-500">{log.details}</span>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:57:                                ) : <span className="text-main-300">-</span>}
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:59:                            <td className="py-3 px-4 text-xs text-muted font-mono">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.jsx:66:                            <td colSpan="5" className="p-8 text-center text-muted">{t('no_logs_found')}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:69:                            <th className="text-right">{t('cash_cash_only')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:70:                            <th className="text-right">{t('other_methods')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:71:                            <th className="text-right">{t('daily_total')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:83:                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:84:                                <td className="text-right">$ {day.others.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:85:                                <td className="text-right appointment-report__cell--bold">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:94:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:100:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AppointmentReportTable.jsx:106:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:47:                            <th className="text-right">{t('cash_cash_only')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:48:                            <th className="text-right">{t('other_methods')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:49:                            <th className="text-right">{t('daily_total')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:56:                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:57:                                <td className="text-right">$ {day.others.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:58:                                <td className="text-right font-bold">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:67:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:73:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:79:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:102:                                    <th className="text-right">{t('amount')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.jsx:131:                                        <td className="medical-report__cell-amount text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:64:                            <th className="text-right">{t('cash_cash_only')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:65:                            <th className="text-right">{t('other_methods')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:66:                            <th className="text-right">{t('daily_total')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:76:                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:77:                                <td className="text-right">$ {day.others.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:78:                                <td className="text-right font-bold">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:87:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:93:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:99:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:122:                                    <th className="text-right">{t('amount')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/PrescriptionReportTable.jsx:155:                                        <td className="prescription-report__cell-amount text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:47:                            <th className="text-right">{t('cash_cash_only')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:48:                            <th className="text-right">{t('other_methods')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:49:                            <th className="text-right">{t('daily_total')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:56:                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:57:                                <td className="text-right">$ {day.others.toLocaleString()}</td>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:58:                                <td className="text-right font-bold">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:67:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:73:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:79:                            <td colSpan="3" className="text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:102:                                    <th className="text-right">{t('amount')}</th>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.jsx:131:                                        <td className="medical-report__cell-amount text-right">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:16:        if (!detailsRaw) return <span className="text-muted">-</span>;
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:30:                <div className="text-xs">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:33:                            <span className="font-semibold text-slate-700">{key}:</span>{' '}
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:34:                            <span className="text-slate-600 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:40:        return <span className="text-sm text-slate-600 break-all">{String(detailsRaw)}</span>;
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:44:        <div className="audit-log-manager h-full flex flex-col">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:45:            <header className="mb-6 border-b pb-4">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:46:                <div className="flex justify-between items-center">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:48:                        <h2 className="text-2xl font-bold text-slate-800">{t('audit_logs') || 'Registros de Auditoría'}</h2>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:49:                        <p className="text-slate-500">Historial de acciones y seguridad del sistema.</p>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:51:                    <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:57:            <div className="flex-1 dashboard-card dashboard-card--highlighted overflow-hidden">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:79:                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:81:                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('action')}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:82:                                <div className="font-bold text-slate-800">{selectedLog.action}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:85:                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('user')}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:86:                                <div className="font-medium text-slate-800">{selectedLog.username}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:89:                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('date')}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:90:                                <div className="text-sm text-slate-600">{formatDate(selectedLog.created_at, { time: true })}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:93:                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('ip_header')}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:94:                                <div className="text-sm font-mono text-slate-600">{selectedLog.ip_address}</div>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:98:                        <div className="border-t pt-4">
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:99:                            <h4 className="text-sm font-bold text-slate-700 mb-3">{t('details_header')}</h4>
/home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.jsx:100:                            <div className="bg-white p-4 rounded border border-slate-200 max-h-60 overflow-y-auto shadow-inner custom-scrollbar">
/home/cima/Documentos/secretary-app/client/src/components/molecules/IntegrationRemoteAccess.jsx:86:                                <li>Registre un subdominio gratuito en <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">duckdns.org</a>.</li>
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:42:        <div className="phone-manager animate-fadeIn p-4 bg-slate-50 border border-slate-100 rounded-sm">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:43:            <label className="phone-manager__label flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:48:                <div key={index} className="phone-manager__item flex flex-wrap md:flex-nowrap items-center gap-4 bg-white p-3 rounded-sm border border-gray-100 mb-4 shadow-sm">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:50:                        className="phone-manager__input phone-manager__input--label !bg-slate-50 !border-slate-100 text-xs font-bold uppercase tracking-tighter w-full md:w-32 py-1.5 px-3 rounded-sm"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:55:                    <div className="phone-manager__number-box flex-1 flex items-center bg-slate-50 rounded-sm border border-slate-100 overflow-hidden min-w-[200px]">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:57:                            className="phone-manager__input phone-manager__input--number flex-1 bg-transparent border-none py-1.5 px-3 text-sm font-bold text-slate-700 tracking-wider"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:64:                            <div className="phone-manager__quick-actions flex gap-1 px-2 border-l border-slate-200">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:70:                                    className="text-accent hover:bg-slate-100 p-1"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:79:                                    className="text-green-500 hover:bg-slate-100 p-1"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:86:                        <label className="phone-manager__primary-label flex items-center gap-2 cursor-pointer group">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:89:                                className="phone-manager__radio text-accent focus:ring-accent"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:94:                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-accent transition-colors">{t('primary') || 'Principal'}</span>
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:100:                        className="phone-manager__delete-btn text-slate-300 hover:text-red-500 hover:bg-red-50 p-2"
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:107:            <div className="flex justify-end mt-6 border-t border-slate-200 pt-6">
/home/cima/Documentos/secretary-app/client/src/components/molecules/PhoneNumbersManager.jsx:111:                    className="phone-manager__add-btn text-[10px] uppercase font-bold tracking-widest"
/home/cima/Documentos/secretary-app/client/src/components/molecules/IntegrationMetaWhatsApp.jsx:28:                    className="font-mono text-sm"
/home/cima/Documentos/secretary-app/client/src/components/molecules/IntegrationMetaWhatsApp.jsx:39:                    className="font-mono text-sm"
/home/cima/Documentos/secretary-app/client/src/components/molecules/IntegrationGoogleCalendar.jsx:98:                                    className="font-mono text-sm"

## 4. Paths Relativos Profundos (Debe usar @/)

## 5. Uso de !important en CSS (Prohibido)
/home/cima/Documentos/secretary-app/client/src/styles/layout-dashboard.css:327:        position: fixed !important; 
/home/cima/Documentos/secretary-app/client/src/styles/layout.css:35:    overflow: visible !important;
/home/cima/Documentos/secretary-app/client/src/styles/base.css:24:    background-color: #0d0d0d !important;
/home/cima/Documentos/secretary-app/client/src/styles/base.css:25:    background-image: none !important;
/home/cima/Documentos/secretary-app/client/src/styles/base.css:174:    background-color: rgba(99, 102, 241, 0.02) !important;
/home/cima/Documentos/secretary-app/client/src/styles/utilities.css:48:    overflow: visible !important;
/home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionFinances.css:208:    background-color: var(--red-50) !important;
/home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionFinances.css:212:    background-color: var(--blue-50) !important;
/home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionFinances.css:277:    text-align: right !important;
/home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionFinances.css:281:    text-align: center !important;
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/ScheduleTimeBlock.css:24:    width: 90px !important;
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/ScheduleBulkActions.css:34:    width: auto !important;
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/ScheduleBulkActions.css:35:    padding: 0.25rem 0.75rem !important;
/home/cima/Documentos/secretary-app/client/src/features/appointments/components/ScheduleBulkActions.css:36:    font-size: 0.875rem !important;
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/PrescriptionModal.css:2:/* PrescriptionModal Styles – BEM compliant, no !important */
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicationInputSection.css:47:    padding: 0.25rem 0.6rem !important;
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicationInputSection.css:48:    font-size: 0.75rem !important;
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/MedicalDocumentsPage.css:6:        display: none !important;
/home/cima/Documentos/secretary-app/client/src/features/medical_documents/MedicalDocumentsPage.css:10:        display: block !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:333:    color: rgba(255, 255, 255, 0.6) !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:558:        display: none !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:562:        padding: 0 !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:563:        background: white !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:567:        display: flex !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:568:        flex-direction: column !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:569:        gap: 1.5rem !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:573:        width: 100% !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:577:        width: 100% !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:578:        display: none !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:582:        max-height: none !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:583:        overflow: visible !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:587:        box-shadow: none !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:588:        border: 1px solid #e2e8f0 !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:597:        font-size: 1.75rem !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientDetailsView.css:598:        margin-bottom: 1rem !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:215:        display: none !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:219:         position: static !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:220:         width: auto !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:221:         height: auto !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:222:         padding: 0 !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:223:         overflow: visible !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:224:         color: black !important;
/home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientPrintableView.css:228:         display: none !important;
/home/cima/Documentos/secretary-app/client/src/features/layout/components/Sidebar.css:212:/* Increasing specificity (0, 2, 0) by combining classes to avoid !important */

## 6. Componentes sin archivo CSS correspondiente
Falta: /home/cima/Documentos/secretary-app/client/src/context/LanguageContext.css
Falta: /home/cima/Documentos/secretary-app/client/src/context/ConfigContext.css
Falta: /home/cima/Documentos/secretary-app/client/src/context/MessageContext.css
Falta: /home/cima/Documentos/secretary-app/client/src/context/ModalContext.css
Falta: /home/cima/Documentos/secretary-app/client/src/App.css
Falta: /home/cima/Documentos/secretary-app/client/src/routes/AppRouter.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/doctors/DoctorsPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/doctors/components/DoctorsManager.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/BalanceDebtsTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/TransactionRow.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/BalanceFinancialSummary.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/BalanceCashFlowTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionPatientsTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionSummary.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionPaymentModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/finances/components/InstitutionTransactionsTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/auth/LoginPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/auth/AuthContext.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/auth/ProfilePage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/auth/RegisterPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/users/AdminUsersPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/users/components/UserManager.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/users/components/UserManagement.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/CommunicationSettings.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/IntegrationRemoteAccess.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/GeneralSettings.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/IntegrationSettings.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/IntegrationMetaWhatsApp.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/BillingSettings.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/ConfigToggle.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/IntegrationGoogleCalendar.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/config/components/ConfigField.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/AppointmentMedicalPanel.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/AppointmentTypeSelector.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/RescheduleBanner.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/AppointmentSyncAlert.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/AppointmentPatientSection.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/DayScheduleHeader.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/HolidayForm.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/appointments/components/ScheduleTimeline.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/RequestsPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/RequirementMedicationList.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/StatusActionModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/PrescriptionForm.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/RequirementDetailHeader.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalRequirementDetailModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalActionModals.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/EditLicenseModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalRequirementActionModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/SimpleRequestForm.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/RequirementFeedback.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalRequirementTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/PrescriptionHabitualMeds.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/DeleteFileModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/medical_documents/components/MedicalRequirementRecycleBin.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/chat/components/ChatList.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/chat/components/ChatMessageBubble.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/chat/components/ChatThread.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/chat/components/ChatConversationItem.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientFinancialSidebar.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientInfoBlock.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientHistoryTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/patients/components/PatientSearchSelect.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/patients/components/ActiveMedicationsList.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/institutions/components/InstitutionFormModal.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/AuditLogsPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/ReportsPage.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/ReportsDashboard.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/LicenseReportTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/CertificateReportTable.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/ReportTabs.css
Falta: /home/cima/Documentos/secretary-app/client/src/features/reports/components/AuditLogManager.css
Falta: /home/cima/Documentos/secretary-app/client/src/main.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/auth/RoleGuard.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/molecules/FormGroup.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/molecules/NavTabs.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/molecules/IntegrationMetaWhatsApp.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/molecules/ConfigToggle.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/atoms/CurrencyInput.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/atoms/ProtectedRoute.css
Falta: /home/cima/Documentos/secretary-app/client/src/components/atoms/Select.css

## 7. Estilos Inline style={{...}} (Prohibido)

