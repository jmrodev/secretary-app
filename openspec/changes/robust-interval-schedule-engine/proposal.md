# Proposal: Robust Interval-Based Schedule & Free Slots Engine

## Problem Statement
The appointment scheduling engine suffered from two fundamental architectural flaws:
1. **Point-in-Time Equality instead of Interval Overlap**:
   - `sp_get_free_slots` and `sp_get_daily_schedule` previously matched appointments using strict timestamp equality (`TIME(a.appointment_date) = ts.slot_time`).
   - If an appointment is scheduled at an arbitrary minute mark (e.g. `14:15` with 60m duration), it occupies `14:15 - 15:15`. A slot generated at `15:00` would falsely be reported as completely free even though the doctor is busy until `15:15`.
2. **Missing Ad-Hoc / Custom Appointments in Daily Timeline**:
   - If an appointment was booked at `14:15`, but the day's grid was generated at `14:00` and `15:00`, the `LEFT JOIN` failed to match the `14:15` appointment to any slot.
3. **Doctor Day Schedule Start Time Alignment**:
   - When a doctor's schedule on a specific day (like Monday) begins at `14:30`, the grid must generate slots aligned to `14:30`, `15:30`, etc., while still accommodating ad-hoc appointments.

## Proposed Architecture
1. **True Interval-Based Collision Detection in Database Engine**:
   - An appointment starting at $A_{start}$ with duration $D$ occupies $[A_{start}, A_{start} + D)$.
   - A prospective slot $[S_{start}, S_{start} + D_{slot})$ is considered occupied/conflicted if and only if:
     $$S_{start} < A_{end} \quad \text{AND} \quad S_{end} > A_{start}$$
   - This prevents double-booking and ensures Next Free Slot search never proposes slots that collide with irregular appointments (e.g. 14:15, 15:00, 15:45).
2. **Dynamic Slot Injection for Daily Schedule View (`sp_get_daily_schedule`)**:
   - After generating the doctor's official slots for the day (anchored to `doctor_schedules.start_time`), inject all distinct `TIME(appointment_date)` of existing appointments on that day into `temp_slots`.
   - Ensures every booked appointment has a concrete slot row in chronological order.
3. **Accurate Next Free Slot Search (`sp_get_free_slots`)**:
   - Filter `temp_all_slots` against existing appointments using interval overlap collision rather than exact time equality.
