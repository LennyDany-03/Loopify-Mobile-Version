# Roadmap

## Immediate

1. Replace prototype dashboard, loops, analysis, and detail screens with data from [`lib/store/useLoopStore.js`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib/store/useLoopStore.js).
2. Fix route consistency so all authenticated product routes are guarded and dashboard taps open the real loop detail page.
3. Implement create loop, edit loop, and real checkin submission flows.
4. Standardize password rules and auth error handling across frontend and backend.

## Security and Reliability

1. Replace stateless refresh tokens with a revocable session model.
2. Verify password change and logout flows against real Supabase session behavior.
3. Add backend tests for auth, authorization, checkins, and streak recomputation.
4. Add frontend tests for auth redirects, route guards, and API-backed screen states.

## Product Features

1. Reminder scheduling and timezone-aware notifications.
2. Habit templates and onboarding presets.
3. Loop notes and richer checkin journaling.
4. Recurring targets for weekly and custom-day loops.
5. Filtering, sorting, and search backed by real loop data.
6. Historical analytics comparisons and trend annotations.
7. Account recovery and password reset.
8. Optional social sign-in providers after the core auth path is stable.
