# Feature Tracker

## Status Legend

- `Live`: implemented and used in the product flow
- `Partial`: backend exists or UI exists, but the flow is incomplete
- `Prototype`: present as mock UI only
- `Missing`: not implemented

## Authentication

| Feature | Status | Notes |
| --- | --- | --- |
| Email/password sign up | Partial | Backend and UI exist; validation rules are inconsistent between client and server |
| Email/password sign in | Live | Wired through store and API |
| Session bootstrap on app launch | Live | Uses SecureStore and `/users/me` |
| Token refresh | Partial | Implemented, but refresh tokens are not revoked server-side |
| Logout | Partial | Client clears tokens, backend logout does not invalidate custom JWTs |
| Forgot password | Missing | Button exists in UI only |
| Google sign-in | Missing | CTA exists in UI only |

## Loops

| Feature | Status | Notes |
| --- | --- | --- |
| List loops API | Live | `/loops/` exists |
| Create loop API | Live | `/loops/` POST exists |
| Update loop API | Live | `/loops/{id}` PUT exists |
| Delete loop API | Live | Soft delete through `is_active=false` |
| Loop list screen | Prototype | Uses hardcoded `mockLoops` |
| Loop creation UI | Missing | Floating action button has no behavior |
| Loop editing UI | Missing | No edit flow in app |
| Loop detail screen | Prototype | Uses hardcoded loop data and synthetic heatmap |
| Route to loop detail from dashboard | Partial | Navigation currently points to tab query string instead of the detail route |

## Checkins and Streaks

| Feature | Status | Notes |
| --- | --- | --- |
| Create checkin API | Live | `/checkins/` POST exists |
| Get today checkins API | Live | `/checkins/today/all` exists |
| Update/delete checkin API | Live | Endpoints exist |
| Streak recomputation | Live | Backend recalculates from stored checkins |
| Dashboard completion interactions | Prototype | Local state only, no API write |
| Slide-to-complete interaction | Prototype | UI state only, no API write |

## Analytics

| Feature | Status | Notes |
| --- | --- | --- |
| Summary API | Live | `/analytics/summary` exists |
| Streak API | Live | `/analytics/streak/{loop_id}` exists |
| Heatmap API | Live | `/analytics/heatmap/{loop_id}` exists |
| Weekly stats API | Live | `/analytics/weekly/{loop_id}` exists |
| Category breakdown API | Live | `/analytics/category-breakdown` exists |
| Completion rate API | Live | `/analytics/completion-rate` exists |
| Analytics screen | Prototype | Uses static summary, trends, focus areas, and recent loop data |

## User Settings

| Feature | Status | Notes |
| --- | --- | --- |
| Get profile | Live | `/users/me` exists and is used during auth bootstrap |
| Update profile | Partial | Backend exists, no connected settings UI |
| Change password | Partial | Backend exists but auth flow needs verification and tests |
| Delete account | Partial | Backend soft-deletes profile only |
| Settings screen | Partial | Only sign-out is wired |

## Quality and Ops

| Feature | Status | Notes |
| --- | --- | --- |
| ESLint configuration | Live | Works when invoked directly through Node in this workspace |
| Frontend tests | Missing | No test files present |
| Backend tests | Missing | No test files present |
| Docker for backend | Partial | Dockerfile and compose exist, but docs were previously outdated |
| Project docs | Partial | Updated in this pass, but should evolve with implementation |
