# Request Debt Lifecycle Specification

## Purpose

Defines how pending debt transactions are handled when a medical request is deleted, so a patient is debited only when the request was actually performed (R7). Debt mutations are atomic with the request deletion.

## Requirements

### Requirement: Performed request delete retains debt

When a completed (performed) medical request is deleted, its pending debt transactions MUST be retained as standalone patient debt labeled "Deuda (Turno Eliminado)" (R7).

#### Scenario: Completed request deleted

- GIVEN a completed medical request with a pending debt transaction
- WHEN the request is deleted
- THEN the pending transaction MUST remain, detached from the request, labeled, and still payable by the patient

### Requirement: Unperformed request delete removes debt

When a medical request that was not performed (pending or rejected) is deleted, its pending debt transactions MUST be removed (R7).

#### Scenario: Pending request deleted

- GIVEN a pending medical request with a pending debt transaction
- WHEN the request is deleted
- THEN the pending transaction MUST be removed

#### Scenario: Rejected request deleted

- GIVEN a rejected medical request with a pending debt transaction
- WHEN the request is deleted
- THEN the pending transaction MUST be removed

### Requirement: Atomic request debt mutations

Debt retention and removal MUST be applied within the same database transaction as the request deletion.

#### Scenario: Failed request delete leaves debt untouched

- GIVEN a request deletion that fails after debt processing starts
- WHEN the operation is rolled back
- THEN no transaction MUST be modified

### Requirement: Dead request finance listeners removed

The MEDICAL_REQUEST_CREATED and MEDICAL_REQUEST_UPDATED listeners MUST be removed (they are never emitted), and the MEDICAL_REQUEST_DELETED listener MUST be removed or fixed (it currently calls a non-existent repository method and swallows a TypeError) (D2). Debt handling MUST be performed by the request service, and no swallowed error MAY remain.

#### Scenario: No listener error on request deletion

- GIVEN a medical request being deleted
- WHEN the deletion completes successfully
- THEN no TypeError MUST be swallowed by a finance listener

#### Scenario: Request debt handled by service

- GIVEN a medical request being created, updated, or deleted
- WHEN the operation completes
- THEN debt handling MUST be performed within the service operation

### Requirement: Orphaned request debt cleanup

A one-off maintenance cleanup MUST remove pending transactions orphaned from requests before this change that are unlabeled test data, and MUST NOT remove debt retained by this change's policy (D1).

#### Scenario: Pre-change request orphan removed

- GIVEN a pending transaction orphaned from a request before this change without a retention label
- WHEN the one-off cleanup runs
- THEN the transaction MUST be removed

#### Scenario: Retained request debt preserved

- GIVEN a pending transaction labeled "Deuda (Turno Eliminado)" retained from a deleted request
- WHEN the one-off cleanup runs
- THEN the transaction MUST NOT be removed