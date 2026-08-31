# Specification: Robust Interval-Based Schedule & Free Slots Engine

## Requirements

### 1. Interval-Based Collision Detection
- A slot $[S_{start}, S_{start} + D_{slot})$ MUST be marked as taken in `sp_get_free_slots` if there is any active appointment $[A_{start}, A_{start} + D_{appt})$ where:
  `S_{start} < A_{start} + D_{appt}` AND `S_{start} + D_{slot} > A_{start}`
- Active appointments are those whose status is NOT in `('cancelled', 'suspended')`.

### 2. Guaranteed Representation of Irregular / Ad-Hoc Appointments
- In `sp_get_daily_schedule`, any appointment scheduled on the day MUST appear in the returned result set with its exact `slot_time = TIME(appointment_date)`.
- If an appointment exists at `14:15`, a slot for `14:15` MUST be present in `temp_slots` and returned with `slot_status = 'taken'`.

### 3. Grid Generation Anchored to Configured Schedules
- For each day of the week, the primary grid slots MUST be generated starting from each interval's `start_time` up to `end_time` using `v_duration` steps.
- Break intervals from `doctor_schedules` (`is_break = 1`) MUST generate slots with `slot_status = 'break'`.
- Out-of-hours slots MUST be populated from `overturn_start_time` to `overturn_end_time` where no official in-hours or appointment slot exists.
