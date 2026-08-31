# Tasks: Robust Interval-Based Schedule & Free Slots Engine

## Phase 1: Database Engine Overhaul
- [x] 1.1 Update `sp_get_daily_schedule` in `server/procedures.sql` and `server/01-schema.sql` to inject all booked appointment timestamps and handle interval overlaps.
- [x] 1.2 Update `sp_get_free_slots` in `server/procedures.sql` and `server/01-schema.sql` to implement true interval-based overlap filtering ($S_{start} < A_{end} \land S_{end} > A_{start}$).

## Phase 2: Frontend Client Verification & Timeline Hook
- [x] 2.1 Verify `useDayScheduleController.js` and `DaySchedule.jsx` map arbitrary slot minutes correctly.
- [x] 2.2 Verify `NextSlotCalendarModal.jsx` and `useNextFreeSlot.js` display clean interval results.

## Phase 3: Automated Testing & Validation
- [x] 3.1 Run server test suite (`pnpm --filter server test`).
- [x] 3.2 Run client test suite (`pnpm --filter client test -- --run`).
- [x] 3.3 Run linting and code quality checks (`pnpm lint`).
