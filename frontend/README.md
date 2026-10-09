# Tenant frontend

React tenant portal for lease details and payment history, built with Vite.

## Configure and run

From this directory:

```sh
npm install
```

Copy `.env.example` to `.env`. `VITE_API_BASE_URL` is the API base URL used by
the browser; it defaults to `/api`. `BACKEND_PROXY_TARGET` sets the local Vite
development proxy target (default `http://localhost:5000`). Vite exposes
variables prefixed with `VITE_` to the browser, so do not put secrets in this
file. In production, configure the hosting layer to route `/api` to the backend,
or set `VITE_API_BASE_URL` to an absolute backend URL whose CORS policy allows
the frontend origin.

Start the backend with `npm start` from the repository root, then start the
frontend with `npm run dev` from this directory. The Vite proxy keeps local API
requests same-origin in the browser. Build the production bundle with
`npm run build`.

## Authentication

Sign in with an existing customer account using the backend `POST /api/auth/login`
endpoint. The access token and returned user are stored together in browser
`localStorage` under `real-estate-tenant-auth`. The API client reads that entry
and attaches its token as a Bearer authorization header. Logging out or receiving
a 401 response removes the stored session. Lease and payment routes require the
`customer` role.

New customers can register with their first name, last name, email address,
phone number, and a password of at least 8 characters. Registration uses the
existing `POST /api/auth/register` endpoint; the backend assigns the customer
role and hashes the password. After account creation, sign in with those
credentials.

Leases are loaded from `GET /api/leases/me`; the details view selects a lease
from that authorized response because the backend does not expose a single-lease
customer endpoint. Payments are loaded from `GET /api/payments/me`. Payment
status is displayed as returned by the backend; the frontend does not initiate
payments or calculate amounts due.
