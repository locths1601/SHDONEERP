# SA-04: Student Workspace & Admission Dossier Frontend Contract

## 1. Architectural Concept
- **NO duplicate `STUDENT` core module:** Personal identity data strictly belongs to `Party360`.
- **Học viên & Hồ sơ 360 (`/students`):** Serves as an aggregator workspace in the frontend that integrates:
  - Personal identity and Party roles (`/api/v1/parties/students`)
  - Identity documents (`/api/v1/parties/{id}/identifications`)
  - Family & guardian relationships (`/api/v1/parties/{id}/relationships`)
  - Multi-application admission dossiers (`/api/v1/admissions/applications/by-student/{id}`)
  - Document checklist and verification (`/api/v1/admissions/applications/{id}/checklist`)

## 2. Directory & Component Structure
```
frontend/src/features/studentWorkspace/
├── types/
│   └── index.ts                 # Full TypeScript definitions for Student, Dossier, Checklist, DocumentLink
├── services/
│   └── studentWorkspaceService.ts # Real API client integrations
├── hooks/
│   └── useStudents.ts           # TanStack Query hooks & mutations with toast notifications
└── components/
    ├── StudentList.tsx           # Paged student table with search, status, and legal entity filters
    ├── StudentCreateDrawer.tsx   # Drawer form to onboard a new student profile
    ├── StudentOverviewTab.tsx    # Overview card, ecosystem roles, contact methods, and relationship modal
    ├── StudentIdentificationsTab.tsx # CCCD/Passport cards with add modal
    ├── StudentApplicationsTab.tsx    # List of du học applications with checklist progress bars
    ├── ApplicationCreateDrawer.tsx   # Form to open a new application (auto-initializes 9 checklist items)
    └── ApplicationDetailModal.tsx    # Full application management modal with workflow status stepper & category-grouped checklist
```

## 3. UI/UX Rule Compliance (Rule 25)
- **5 States Handled:**
  - **Loading:** Tailored skeleton loaders with pulses.
  - **Empty:** Clean empty states with prompt to create or adjust filters.
  - **Error:** Clear error message display with retry action.
  - **403 Forbidden:** Specialized forbidden card explaining Data Scope restrictions.
  - **409 Concurrency Conflict:** Automatically catches optimistic concurrency exceptions and alerts user to reload fresh data.
- **Real Backend APIs:** 100% of network interactions communicate with `/api/v1/parties/*` and `/api/v1/admissions/*`.

