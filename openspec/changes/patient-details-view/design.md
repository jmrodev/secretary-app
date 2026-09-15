# Technical Design: Patient Details Screen Refactoring & Ratings Integration

## Technical Approach
Refactor monolithic `PatientDetailsView` into clean Atomic Design components with rating visibility:
1. **Atomic Decomposition**: Extract `RatingStars` to `atoms/RatingStars/`. Extract tab logic into organisms (`PatientMedicationsTab`, `PatientDocumentsTab`) and extract `PrescriptionDetailModal`.
2. **Context-Rich Header**: Build `PatientDetailsHeader` with identity (name, DNI, insurance, age), debt pill, ratings (Financial, Attendance, Behavior with auto/manual badge & note tooltip), and actions (Back, Print, New, Edit, Delete).
3. **Layout & Tokens**: Replace broken desktop 2-column grid (`grid-template-columns: 2fr 1fr`) with responsive layout using tokens (`--spacing-*`, `--radius-*`).
4. **State & Modal Reuse**: Pass `onEditRating` and `canEditRating` from `PatientsPage` to `PatientDetailsView` to reuse `BehaviorRatingModal`, synchronizing with `patientDetails`.

## Architecture Decisions
| Option | Tradeoff | Decision & Rationale |
| :--- | :--- | :--- |
| **RatingStars**: Atom vs Helper | Extra file overhead. | **Atom (`atoms/RatingStars`)**: Eliminates duplication across list and details. |
| **Header**: Inline vs Organism | Inline avoids prop drilling. | **Organism (`PatientDetailsHeader`)**: Isolates chips, ratings, actions; keeps coordinator < 150 lines. |
| **Tab Architecture**: Inline vs Organisms | Organisms add multiple files. | **Tab Organisms (`PatientMedicationsTab`, `PatientDocumentsTab`)**: Co-locates local state and enforces Single Responsibility. |
| **Rating Modal**: Dedicated vs Hoisted | Hoisted requires callback. | **Reuse Hoisted `BehaviorRatingModal`**: Handles mutations and keeps `patientDetails` in sync. |

## Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant List as PatientList
    participant Page as PatientsPage
    participant Handlers as usePatientsHandlers
    participant Details as PatientDetailsView
    participant Header as PatientDetailsHeader
    participant Modal as BehaviorRatingModal

    User->>List: Click eye button
    List->>Handlers: handleViewDetails(id)
    Handlers->>Handlers: GET /users/patients/:id
    Handlers->>Page: setPatientDetails(data)
    Page->>Details: Render PatientDetailsView
    Details->>Header: Render PatientDetailsHeader
    opt Edit Behavior Rating (Staff)
        User->>Header: Click behavior rating badge
        Header->>Page: onEditRating(details)
        Page->>Modal: Open BehaviorRatingModal
        User->>Modal: Save rating + note
        Modal->>Handlers: handleSaveBehaviorRating
        Handlers->>Handlers: PUT /users/patients/:id
        Handlers->>Page: setPatientDetails(updated)
        Page->>Details: Re-render with updated rating
    end
```

## Data Flow
```
[PatientList: Eye Click] -> [handleViewDetailsAction] -> [GET /users/patients/:id]
                                                                   |
[PatientDetailsView] <-- [setPatientDetails] <---------------------+
       |
       +---> [PatientDetailsHeader] (Identity, Ratings, Debt, Actions)
       +---> [PatientInfoBlock] | [PatientHistoryTable] | [PatientFinancialSidebar]
       +---> [PatientMedicationsTab] | [PatientDocumentsTab] | [WhatsappChatHistory]
```

## File Changes
| Path | Action | Description |
| :--- | :--- | :--- |
| `client/src/components/atoms/RatingStars/RatingStars.jsx` | Create | Reusable 5-star rating atom with color variants. |
| `client/src/components/atoms/RatingStars/RatingStars.module.css` | Create | Styles for star badges. |
| `client/src/components/atoms/RatingStars/index.js` | Create | Named export for `RatingStars`. |
| `client/src/features/patients/components/views/PatientDetailsHeader.jsx` | Create | Organism displaying identity, ratings, debt, actions. |
| `client/src/features/patients/components/views/PatientDetailsHeader.module.css` | Create | Styles for header and rating badges. |
| `client/src/features/patients/components/views/tabs/PatientMedicationsTab.jsx` | Create | Organism for chronic meds grid and rx table. |
| `client/src/features/patients/components/views/tabs/PatientMedicationsTab.module.css` | Create | Styles for medications and prescriptions. |
| `client/src/features/patients/components/views/tabs/PatientDocumentsTab.jsx` | Create | Organism for file upload and files list. |
| `client/src/features/patients/components/views/tabs/PatientDocumentsTab.module.css` | Create | Styles for upload form and file table. |
| `client/src/features/patients/components/modals/PrescriptionDetailModal.jsx` | Create | Modal displaying single prescription details. |
| `client/src/features/patients/components/views/PatientDetailsView.jsx` | Modify | Coordinator (< 150 lines) rendering header and tabs. |
| `client/src/features/patients/components/views/PatientDetailsView.module.css` | Modify | Fix desktop 2-column grid; use design tokens. |
| `client/src/features/patients/components/views/PatientList.jsx` | Modify | Import extracted `RatingStars` atom. |
| `client/src/features/patients/PatientsPage.jsx` | Modify | Pass `onEditRating` and `canEditRating` props. |
| `client/src/features/patients/components/views/__tests__/PatientDetailsHeader.test.jsx` | Create | Tests for ratings, tooltip, edit callback. |
| `client/src/features/patients/components/views/__tests__/PatientDetailsView.test.jsx` | Create | Tests for tab switching and printable toggle. |

## Interfaces / Contracts
```typescript
interface PatientDetailsHeaderProps {
    details: PatientDetails;
    t: (k: string, p?: Record<string, unknown>) => string;
    user: { role: string };
    canEditRating: boolean;
    onBack: () => void;
    onEdit: () => void;
    onDelete: (d: PatientDetails) => void;
    onToggleNew: (id: number) => void;
    onPrint: () => void;
    onPayDebt: (e: React.MouseEvent, id: number, amt: number) => void;
    onEditRating?: (e: React.MouseEvent, p: PatientDetails) => void;
}
```

## Testing Strategy
| Level | Tool | Target | Coverage Plan |
| :--- | :--- | :--- | :--- |
| **Unit** | Vitest | `RatingStars.jsx` | 0-5 stars, color variants, a11y. |
| **Unit** | Vitest | `PatientDetailsHeader.jsx` | Chips, debt, tooltips, edit callback. |
| **Integration** | Vitest | `PatientDetailsView.jsx` | Tabs, back button, print view. |
| **Component** | Vitest | `PatientMedicationsTab.jsx` | Cards, empty state, rx actions. |
| **Component** | Vitest | `PatientDocumentsTab.jsx` | Files table, upload, preview. |

## Threat Matrix
| Threat | Applicability | Mitigation |
| :--- | :--- | :--- |
| **Unauthorized Rating Edit** | Medium | Header binds edit handler only when `canEditRating` is true; backend enforces RBAC. |
| **Unsanitized Rx Links** | Low | URL encoded tokens and sanitization before share. |
| **File Upload Abuse** | Low | Standard backend type/size checks. |

## Migration / Rollout
- **Database**: No schema changes.
- **Rollout**: Frontend bundle deployment.
- **Rollback**: Clean git revert of client changes.

## Open Questions
None. Scope, components, and layout fixes are fully determined.
