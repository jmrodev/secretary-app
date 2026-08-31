# Proposal: Fix Custom Schedule Alignment, Free Slots Search, and Timeline Indicator

## Problem
1. **Schedule Generation Misalignment**: In `sp_get_daily_schedule` and `sp_get_free_slots`, slots are generated assuming rigid increments starting from `overturn_start_time` (e.g. 08:00). When a doctor's schedule starts on custom minute intervals (e.g. Mondays at 14:30), the generation produces slots at 14:00, 15:00, missing the configured intervals (14:30, 15:30) and misclassifying them as out of hours or omitting them from the free slot finder.
2. **Timeline Current Time Marker Placement**: `ScheduleTimeline.jsx` references `styles.slotWrapper`, while `ScheduleTimeline.module.css` defines `.ScheduleTimeline__slotWrapper`. Because the wrapper lacks `position: relative`, the "AHORA" red marker floats relative to the entire timeline root instead of the active slot container.
3. **Next Free Slot Search & Categorization**: The Next Free Slot dialog receives the misaligned slots from `sp_get_free_slots`, preventing users from finding valid available slots on days with custom start times.

## Solution
1. **Stored Procedures (`sp_get_daily_schedule` & `sp_get_free_slots`)**:
   - Iterate over each doctor's configured schedule intervals (`doctor_schedules`) for the given day to generate in-hours slots aligned directly to the interval's `start_time` step by step with `v_duration`.
   - When out-of-hours slots are requested or needed, fill remaining time around official blocks up to `overturn_start_time` / `overturn_end_time`.
2. **Frontend `ScheduleTimeline.jsx`**:
   - Fix class name binding to `${styles.ScheduleTimeline__slotWrapper}`.
3. **Automated Verification**:
   - Update tests for appointment generation and timeline indicator.

## Scope & Impact
- Database procedures: `server/procedures.sql` and `server/01-schema.sql`.
- Frontend: `client/src/features/appointments/components/schedule/ScheduleTimeline.jsx`.
- Tests: Server repository/service tests for schedule generation.
