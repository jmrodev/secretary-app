# Specification: Custom Schedule Alignment & Timeline Indicator

## Requirements

### Requirement 1: Database Slot Generation Aligned to Working Intervals
- The stored procedures `sp_get_daily_schedule` and `sp_get_free_slots` MUST generate in-hours slots by starting at the `start_time` of each defined `doctor_schedules` record for the day, incrementing by the doctor's `appointment_duration` until `end_time`.
- If an official schedule interval starts at `14:30` and ends at `18:30` with duration 60 min, generated slots must be `14:30`, `15:30`, `16:30`, `17:30`.
- Breaks must be respected as break status without generating free patient slots during break hours.
- Out-of-hours slots must correctly fill available time gaps without conflicting with the start times of official schedule intervals.

### Requirement 2: Schedule Timeline Positioning
- `ScheduleTimeline.jsx` MUST attach the CSS class `styles.ScheduleTimeline__slotWrapper` to each slot container so that `position: relative` is active and the "AHORA" indicator is positioned accurately relative to the active slot.

### Requirement 3: Next Free Slot Search Integrity
- `sp_get_free_slots` MUST return available slots matching the configured schedule intervals for doctors whose schedules start at half-hour or arbitrary minute marks.
