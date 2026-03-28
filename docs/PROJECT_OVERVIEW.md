# Project Overview

## Purpose
`support-smiles-app` is an internal customer support/operations console. It lets administrative, accounting, HR, and customer success teams triage tickets, manage payroll/expenses/assets, handle HR workflows, and keep tabs on KPIs/gamification all from a single Vite + React frontend.

## Stack and Tooling
- **UI / Runtime:** Vite + React 18 + TypeScript, shadcn UI primitives, Tailwind, Radix UI, Lucide icons, Sonner/Toaster for notifications.
- **State & Data:** React Query for data fetching, a hand-rolled `AuthContext`, and `mockApiAdapter` that simulates the actual API when `VITE_USE_MOCK_API=true`.
- **Testing:** Vitest for unit/integration checks, ESLint+@eslint/js for linting, Playwright config present for future e2e.
- **Dev aids:** `DevTools` component renders hot reload utilities, `seedDatabase()` seeds deterministic mock data in localStorage on startup.

## Entry Points & Routing
1. `src/main.tsx` loads i18n support, logs the two key env vars in dev, and renders `<App />` into the root.
2. `src/App.tsx` wires React Query + BrowserRouter + AuthProvider. `ProtectedRoute` wraps most routes, checking auth and RBAC. The layout (`AppLayout`) renders the navbar/sidebar and slots for:
   - Dashboard, Tickets, Ticket Details
   - User management (Admin-only)
   - Accounting suite (vendors, purchases, payroll, deposits, transfers, advances, review deductions)
   - HR suite (employees, attendance, leaves, adjustments)
   - Operations (shipping)
   - Admin tools (ticket reasons, KPI types)
   - KPI/Gamification dashboards
3. `/login` is the public entry. The login screen now renders a simple sign-in card without the previous environment banner or demo credential shortcuts, so users only see the email/password fields.

## Services & Helpers
- `src/services/auth.service.ts` handles login/logout/impersonation, stores tokens/current user in `localStorage`, and normalizes API responses.
- `src/lib/api.ts` creates an Axios instance, attaches the bearer token, implements refresh token queuing, and swaps in `mockApiAdapter` when `VITE_USE_MOCK_API=true`.
- `src/services/seed.ts` calls `mockDb.initialize()` to populate `users`, `tickets`, `notifications`, etc., with stable UUID seeds; used by both the mock server and runtime seeding.
- `src/services/mockApiAdapter.ts` (plus related services under `src/services`) expose REST-style handlers for auth, users, tickets, notifications, reasoning, sync, etc., so the frontend can operate without a real backend when mocks are enabled.

## Contexts & Hooks
- `AuthContext` tracks `user`, `isAuthenticated`, `isLoading` and exposes RBAC helpers (`canEditTicket`, `canAssignTicket`, `canManageUsers`).
- `useAuth` provides safe access to the context.
- `hooks/use-toast` centralizes toast handling for consistent UX feedback.

## Environment Variables
| Variable | Purpose | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend base URL when hitting the real server | Logged in `main.tsx` during dev for quick verification. |
| `VITE_USE_MOCK_API` | Toggles `mockApiAdapter` so you can work offline | Mocks replace every API route with `mockApiAdapter`, but the login UI no longer shows the flag/URL proof banner. |

## Available Scripts
- `npm run dev` – start Vite dev server on port 5173
- `npm run build` – production build (currently emits a ~1.3 MB JS chunk; consider manual chunking for future performance)
- `npm run preview` – serve the built assets locally
- `npm run lint` / `npm run lint:strict` – ESLint
- `npm run test*` – Vitest variants (`run`, `watch`, `serial`, `ci` with coverage)
- `npm run check` – lint strict + test:ci
- `npm run dev:all` / `verify:all` – composites that call scripts under `scripts/`

## Testing & Manual Verification
- `npm run test` ✅ all 81 Vitest tests pass under the mocked API.
- `npm run build` ✅ succeeds but warns that `dist/assets/index-DThCYIap.js` is 1.3 MB (chunk size > 500 kB).
- `npm run lint` ✅ ESLint passes.
-- Manual QA steps performed locally: ran the dev server (`npm run dev`), submitted the login form, and exercised protected dashboards/routes; no runtime errors or navigation issues were observed.

## Security Notes & TODOs
1. **Token storage** – `access_token`, `refresh_token`, `current_user` live in `localStorage`, so the app inherits any XSS surface. Plan to store tokens in httpOnly cookies or decrypt them server-side if you go live.
2. **Demo seed data** – the mock DB seeds plaintext `admin123`, `cs123`, etc. Ensure these aren’t accidentally committed to a real backend (there’s a `seedDatabase()` guard in place, but real auth must hash and salt passwords).
3. **Chunk size warning** – large minified bundle is worth splitting, especially once the router/page components grow.

## Next Steps for New Contributors
1. Update `mockDb` seeds if you later add custom login shortcuts or banners so the overview stays accurate.
2. Add Playwright scripts under `e2e/` and hook them into CI via `verify_*` scripts.
3. When wiring a real backend, swap out `mockApiAdapter` by setting `VITE_USE_MOCK_API=false` and confirm RBAC logic still works by hitting real endpoints.
