# Architecture

## Overview

Loopify is split into two applications:

- Frontend: Expo Router app under [`/app`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app), shared UI under [`/components`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/components), client helpers under [`/lib`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib)
- Backend: FastAPI app under [`/backend`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend), using Supabase for persistence and auth-related operations

## Frontend Structure

- Routing
  - [`app/_layout.tsx`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app/_layout.tsx) initializes auth state and renders the root stack
  - [`app/index.tsx`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app/index.tsx) redirects to auth or the main tabs
  - [`app/(auth)`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app/(auth)) contains sign-in and sign-up routes
  - [`app/(tabs)`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app/(tabs)) contains the main app shell
  - [`app/loops/[id].jsx`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app/loops/[id].jsx) is a detail route outside the tab group

- State
  - [`lib/store/useAuthStore.js`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib/store/useAuthStore.js) manages auth, user profile bootstrap, and token-backed session state
  - [`lib/store/useLoopStore.js`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib/store/useLoopStore.js) manages loops, summary data, and checkins

- API layer
  - [`lib/api.js`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib/api.js) configures Axios and token refresh behavior
  - [`lib/auth.js`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/lib/auth.js) stores access token, refresh token, and cached user profile in SecureStore

## Backend Structure

- App entry
  - [`backend/main.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/main.py) configures FastAPI, CORS, router registration, and health endpoints

- Routers
  - [`backend/app/routers/auth.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/routers/auth.py)
  - [`backend/app/routers/loops.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/routers/loops.py)
  - [`backend/app/routers/checkins.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/routers/checkins.py)
  - [`backend/app/routers/analytics.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/routers/analytics.py)
  - [`backend/app/routers/users.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/routers/users.py)

- Auth and services
  - [`backend/app/middleware/auth_guard.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/middleware/auth_guard.py) validates bearer access tokens
  - [`backend/app/utils/jwt.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/utils/jwt.py) issues and validates custom JWTs
  - [`backend/app/services/supabase_client.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/services/supabase_client.py) initializes the Supabase service-role client
  - [`backend/app/services/streak_service.py`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/app/services/streak_service.py) recalculates streak data from checkins

## Request Flow

1. Frontend signs in or registers through the backend auth endpoints.
2. Backend talks to Supabase Auth, then returns custom JWT access and refresh tokens.
3. Frontend stores tokens in SecureStore.
4. Axios attaches the access token to protected requests.
5. Protected backend routes validate the custom JWT and use the embedded `sub` claim as `user_id`.
6. Backend performs data reads and writes against Supabase tables with the service-role client.

## Important Constraints

- The backend uses a service-role key, so authorization depends entirely on application code rather than Supabase Row Level Security.
- Refresh tokens are self-issued JWTs and are not currently persisted or revoked server-side.
- Most analytics and loop data flows exist in the backend, but the frontend has not fully adopted them yet.
- There is no automated test suite to protect these contracts.
