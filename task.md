# Tasks

- [x] Investigate "Invalid Credentials" error from network PC <!-- id: 0 -->
    - [x] Check frontend API configuration <!-- id: 1 -->
    - [x] Check backend CORS configuration <!-- id: 2 -->
    - [x] Check backend login logic <!-- id: 3 -->
- [x] Allow port 5000 on firewall <!-- id: 5 -->
- [x] Fix network login issue <!-- id: 4 -->
- [x] Fix scrolling issue in Appointments view <!-- id: 6 -->
- [x] Scaffold native Kotlin Android app <!-- id: 7 -->
- [x] Implement Android Dashboard <!-- id: 8 -->
- [x] Implement Android Appointments List <!-- id: 9 -->
- [x] Implement Doctor Workflow (Notes/History) in Android <!-- id: 10 -->
- [x] Implement Secretary Workflow (Status/Booking) in Android <!-- id: 11 -->
- [x] Translate Android App to Spanish <!-- id: 12 -->
- [x] Review and fix Spanish translation in Desktop App (Appointments/Modals) <!-- id: 13 -->
- [x] Implement Patients List and Details in Android <!-- id: 14 -->
- [x] Fix Appointment Month Navigation in Desktop <!-- id: 15 -->
- [x] Implement Doctor Filter for Secretaries in Android <!-- id: 16 -->
- [x] Reset Environment to Cleaner Docker-Only State <!-- id: 17 -->
    - [x] Create `split_dump.py` to separate config data from transactional data <!-- id: 18 -->
    - [x] Generate clean `01-schema.sql` and minimal `02-seed.sql` (Admin only) <!-- id: 19 -->
    - [x] Configure `docker-compose.yml` with new init files <!-- id: 20 -->
    - [x] Wipe `mysql_data` and restart Docker <!-- id: 21 -->
- [ ] Remove local MariaDB from host system <!-- id: 22 -->
- [x] Restore 'ceci' user and doctor profile <!-- id: 23 -->
- [x] Improve Google Calendar Connect UI/UX (Add instructions) <!-- id: 24 -->
- [x] Fix stalled Google Sync queue (Added Retry & Logging) <!-- id: 43 -->
- [x] Implement CSV Contact Import (Google Contacts format) <!-- id: 25 -->
    - [x] Create Backend Endpoint for CSV Upload <!-- id: 26 -->
    - [x] Implement CSV Parsing Logic (Google Contacts headers - Added Spanish support) <!-- id: 27 -->
    - [x] Add Frontend Import UI <!-- id: 28 -->
    - [x] **ACTION REQUIRED**: User needs to rebuild docker container (`sudo docker compose up -d --build`) <!-- id: 29 -->

- [x] Investigate duplicate prescription requests <!-- id: 30 -->
- [x] Fix duplicate prescription requests <!-- id: 31 -->
    - [x] Disable submit button in MedicalDocuments.jsx <!-- id: 32 -->
    - [x] Clean up duplicate records in DB <!-- id: 33 -->


- [ ] Implement Overmedication Warning and Fix UI <!-- id: 34 -->
    - [x] Clean up temporary scripts <!-- id: 35 -->
    - [x] Implement warning logic in MedicalDocuments.jsx <!-- id: 36 -->
    - [x] Fix checkbox UI issue <!-- id: 37 -->

- [ ] Meta Business Integration (WhatsApp Cloud API) <!-- id: 38 -->
    - [ ] Plan integration architecture <!-- id: 39 -->
    - [ ] Create backend service for WhatsApp API <!-- id: 40 -->
    - [ ] Implement message templates syncing <!-- id: 41 -->
    - [ ] Update frontend to use server-side sending <!-- id: 42 -->
