# Specifications: Independent Audit Module

## Capability: audit-module

### Scenario 1: Logging system actions with request context
- **Given** an Express request object `req` with `req.user = { user_id: 10, username: 'secretary1' }` and `req.ip = '192.168.1.100'`
- **When** `logAction` is called with action `'PATIENT_DISCHARGE'` and details object `{ reason: 'Cured' }`
- **Then** the service must call `auditRepository.create` with an object containing:
  - `user_id: 10`
  - `username: 'secretary1'`
  - `action: 'PATIENT_DISCHARGE'`
  - `details: '{"reason":"Cured"}'`
  - `ip_address: '192.168.1.100'`

### Scenario 2: Logging CRUD state changes (Before vs After)
- **Given** a request `req` and a patient record with ID 42
- **And** the patient's old address was `'Calle 123'` and new address is `'Av. de Mayo 500'`
- **When** `logCRUD` is called with action `'UPDATE'`, entityType `'patient'`, entityId `42`, oldData `{ address: 'Calle 123' }`, and newData `{ address: 'Av. de Mayo 500' }`
- **Then** the service must format the details object to contain:
  - `entityType: 'patient'`
  - `entityId: 42`
  - `changes: { from: { address: 'Calle 123' }, to: { address: 'Av. de Mayo 500' } }`
- **And** it must invoke `logAction` with this formatted details object

### Scenario 3: Audit actor identity is non-spoofable (from change server-audit-username-fix)
- **Given** a request with `req.user = { user_id: 12, username: 'doctor1' }`
- **When** `logAction(req, 'GENERATE_REPORT', details)` is called
- **Then** `auditRepository.create` is called with `username: 'doctor1'` and `user_id: 12`

- **Given** a request with no `req.user` and `body = { username: 'attacker' }`
- **When** `logAction(req, 'CONTACT_FORM_SUBMIT', 'form details')` is called
- **Then** `auditRepository.create` is called with `username: 'Anonymous'` and `user_id: null`
- **And** the value `'attacker'` from the request body is NOT used as the audit username

- **Given** a request with no `req.user` and no `body.username`
- **When** `logAction(req, 'CONTACT_FORM_SUBMIT', 'form details')` is called
- **Then** `auditRepository.create` is called with `username: 'Anonymous'`
