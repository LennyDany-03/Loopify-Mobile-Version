# Loopify

Loopify is a habit and routine tracking product with:

- An Expo Router React Native frontend in [`/app`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/app)
- A FastAPI backend in [`/backend`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend)
- Supabase used for auth and data storage

The repository is currently in a transition state. Auth is wired end to end, but most non-auth frontend screens still render prototype data instead of live backend data.

## Current Status

- Frontend auth flow exists and uses secure token storage
- Backend auth, loops, checkins, analytics, and profile endpoints exist
- Dashboard, loops, analysis, and loop detail screens are mostly UI prototypes
- There are currently no automated tests in the repo
- The legacy Expo starter README has been removed and replaced with project-specific docs

## Project Docs

- [Architecture](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/docs/ARCHITECTURE.md)
- [Feature Tracker](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/docs/FEATURE_TRACKER.md)
- [Roadmap](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/docs/ROADMAP.md)

## Tech Stack

- Expo 54
- React 19
- Expo Router
- NativeWind
- Zustand
- FastAPI
- Supabase

## Frontend Setup

1. Install dependencies:

```bash
npm install
```

2. Set the API base URL for the app:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8000
```

`http://localhost:8000` only works for web or simulators running on the same machine. Physical devices need a reachable host/IP.

3. Start Expo:

```bash
npx expo start
```

## Backend Setup

1. Create [`backend/.env`](/C:/Users/lenny/OneDrive/Documents/Code/native/loopify/backend/.env) with:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

2. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Run the API:

```bash
uvicorn main:app --reload
```

API docs are available at `/docs` when the server is running.

## High-Priority Gaps

- Live loop data is not connected to the main product screens
- Loop detail routes are not protected the same way as the tab routes
- Token refresh/logout is stateless and does not provide real revocation
- Password rules are inconsistent between frontend and backend
- Test coverage is missing

## Recommended Next Milestones

1. Replace prototype screen data with store-backed API data.
2. Add create/edit loop flows and real checkin submission from the UI.
3. Harden auth and session handling.
4. Add automated frontend and backend tests.
