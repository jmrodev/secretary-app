# Tasks: Fix Custom Schedule Alignment & Timeline Indicator

## Phase 1: Database Stored Procedures
- [x] 1.1 Update `sp_get_daily_schedule` in `server/procedures.sql` and `server/01-schema.sql` to generate official slots anchored to `doctor_schedules.start_time`.
- [x] 1.2 Update `sp_get_free_slots` in `server/procedures.sql` and `server/01-schema.sql` to anchor slots to `doctor_schedules.start_time`.

## Phase 2: Frontend Timeline Indicator Fix
- [x] 2.1 Fix class name in `client/src/features/appointments/components/schedule/ScheduleTimeline.jsx` from `styles.slotWrapper` to `styles.ScheduleTimeline__slotWrapper`.

## Phase 3: Testing & Verification
- [x] 3.1 Run server and client tests to verify slot generation and layout stability.
- [x] 3.2 Verify linter and stylelint compliance.
