const PERMISSION_KEYS = [
  'can_manage_users',
  'can_crud_appointments',
  'can_edit_past_appointments',
  'can_crud_requests',
  'can_crud_prescriptions',
  'can_crud_licenses',
  'can_crud_files',
  'can_crud_finances'
];

const PERMISSION_CAMEL_MAP = {
  canManageUsers: 'can_manage_users',
  canCrudAppointments: 'can_crud_appointments',
  canEditPastAppointments: 'can_edit_past_appointments',
  canCrudRequests: 'can_crud_requests',
  canCrudPrescriptions: 'can_crud_prescriptions',
  canCrudLicenses: 'can_crud_licenses',
  canCrudFiles: 'can_crud_files',
  canCrudFinances: 'can_crud_finances'
};

module.exports = { PERMISSION_KEYS, PERMISSION_CAMEL_MAP };
