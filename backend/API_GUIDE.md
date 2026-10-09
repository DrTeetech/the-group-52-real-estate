# Real Estate Rental API — Frontend Integration Guide

This API models a company-owned/managed rental inventory. It is rental-only; public registration always creates a `customer` account. Staff roles are assigned only by trusted administrative workflows.

## Setup

1. Use Node.js 18.18 or newer.
2. Copy `.env.example` to `.env` and set real local values. Never commit `.env`.
3. Install dependencies with `npm install`.
4. Start development mode with `npm run dev`.
5. Check `GET http://localhost:5000/api/health`.

MongoDB Atlas is required. Lease and application transitions use MongoDB transactions, so use an Atlas deployment that supports transactions. Replace the example JWT secret with a randomly generated secret.

## Authentication

Send protected requests with `Authorization: Bearer <token>` and `Content-Type: application/json`.

- `POST /api/auth/register` — body: `{ "firstName": "Ada", "lastName": "Okafor", "email": "ada@example.com", "phone": "+2348000000000", "password": "a-strong-password" }`. Returns a customer token.
- `POST /api/auth/login` — body: `{ "email": "ada@example.com", "password": "a-strong-password" }`.
- `GET /api/auth/me` — current account.

Never send a `role` field to public registration. It is ignored; public registration creates customers only.

## Public property browsing

- `GET /api/properties?page=1&limit=12`
- Optional filters: `city`, `state`, `propertyType`, `minPrice`, `maxPrice`, `bedrooms`, `furnished=true|false`.
- `GET /api/properties/:slug` — one public property.

Only properties with both `visibility: "public"` and `status: "available"` are returned. Public responses omit internal staff assignment and application-reservation fields.

## Customer endpoints

All customer endpoints require a customer token.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me/favorites` | List favorites |
| POST | `/api/properties/:id/favorite` | Add favorite |
| DELETE | `/api/properties/:id/favorite` | Remove favorite |
| POST | `/api/inquiries/properties/:id` | Submit `{ "message": "I would like more information." }` |
| GET | `/api/inquiries/me` | List own inquiries |
| POST | `/api/viewings/properties/:id` | Submit `{ "scheduledFor": "2030-04-20T10:00:00.000Z", "type": "physical", "notes": "Optional" }` |
| GET | `/api/viewings/me` | List own viewing requests |
| POST | `/api/viewings/:id/cancel` | Cancel own requested/confirmed viewing |
| POST | `/api/rental-applications/properties/:id` | Submit an application; fields may include `employmentStatus`, `employer`, `monthlyIncome`, `intendedMoveInDate`, `occupants`, `notes` |
| GET | `/api/rental-applications/me` | List own applications |
| POST | `/api/rental-applications/:id/withdraw` | Withdraw own submitted/under-review application |
| GET | `/api/leases/me` | List own leases |
| GET | `/api/payments/me` | List own payment records |
| POST | `/api/payments` | Initialize Paystack checkout; body: `{ "lease": "<leaseId>", "type": "rent" }` (types: `rent`, `security_deposit`, `service_charge`) |
| GET | `/api/payments/verify/:reference` | Verify own pending Paystack payment with the provider |

The backend calculates payment amounts from the lease; the frontend must not decide or submit the amount. A successful browser callback alone is not proof of payment. Use the returned `authorizationUrl` to send the customer to checkout, then call the verification endpoint and rely on the verified API result/webhook.

## Staff endpoints

Staff endpoints require the indicated staff token.

| Method | Path | Allowed roles | Purpose |
|---|---|---|---|
| POST | `/api/properties` | agent, property_manager, admin, super_admin | Create a private draft; `propertyCode` is generated if omitted |
| PATCH | `/api/properties/:id` | agent, property_manager, admin, super_admin | Update allowlisted property fields; agents only manage assigned properties |
| PATCH | `/api/properties/:id/status` | agent, property_manager, admin, super_admin | Change status where allowed by rental workflow |
| POST | `/api/properties/:id/publish` | property_manager, admin, super_admin | Publish an available, unreserved property |
| DELETE | `/api/properties/:id` | admin, super_admin | Delete if no history; otherwise archive |
| GET | `/api/inquiries` | agent, property_manager, admin, super_admin | List inquiries (agents are scoped to assigned records/properties) |
| PATCH | `/api/inquiries/:id` | agent, property_manager, admin, super_admin | Update status; managers/admins can assign staff |
| GET | `/api/viewings` | agent, property_manager, admin, super_admin | List viewings (agents are scoped to assigned records/properties) |
| PATCH | `/api/viewings/:id` | agent, property_manager, admin, super_admin | Update viewing; managers/admins can assign staff |
| GET | `/api/rental-applications` | agent, property_manager, admin, super_admin | List applications; agents are scoped to their properties |
| PATCH | `/api/rental-applications/:id` | property_manager, admin, super_admin | Set `under_review`, `approved`, or `rejected`; rejection requires `rejectionReason` |
| GET | `/api/leases` | property_manager, admin, super_admin | List leases |
| POST | `/api/leases` | property_manager, admin, super_admin | Create lease from an approved application: `{ "rentalApplication": "<applicationId>", "startDate": "2030-05-01T00:00:00.000Z", "endDate": "2031-05-01T00:00:00.000Z" }`. Prices are copied from company property terms. |
| PATCH | `/api/leases/:id/status` | property_manager, admin, super_admin | Set `active`, `terminated`, or `cancelled` when business rules permit |
| GET | `/api/payments` | property_manager, admin, super_admin | List payment records, optionally filter by status and paginate |
| GET | `/api/staff` | admin, super_admin | List staff accounts |
| POST | `/api/staff` | admin, super_admin | Create staff account; non-super-admins may create agents/property managers only |
| PATCH | `/api/staff/:id` | admin, super_admin | Update staff role/status subject to privilege rules |

## Initial super administrator

Public registration intentionally cannot create privileged accounts. Register the intended admin account, then on a trusted development machine set `BOOTSTRAP_ADMIN_EMAIL` in `.env` and run `node scripts/setInitialSuperAdmin.js`. Log in again afterward to receive a token with the new role. Remove `BOOTSTRAP_ADMIN_EMAIL` from `.env` after the one-time operation. Do not expose this script through an API route or run it casually in production.

## Paystack configuration

1. Add your Paystack **secret key** to `PAYSTACK_SECRET_KEY` on the server only. Use a test key while developing. Never put the secret key in frontend environment variables.
2. Set `PAYSTACK_CALLBACK_URL` to the frontend route that handles the return from checkout.
3. Configure the Paystack dashboard webhook URL to `https://YOUR_API_HOST/api/payments/webhook/paystack`.
4. Test both the authenticated verification endpoint and webhook with Paystack test transactions before going live.
5. This checkout is currently configured for NGN leases. Add and test additional currencies only if your Paystack account supports them and your accounting policy allows them.

## Important behavior

- Property records are created as private drafts. A manager publishes them after review.
- Approving an application reserves the property atomically. Lease creation uses the rent, service charge, caution fee, and currency saved on the property; clients cannot override those terms.
- Activating a lease changes the property to rented/private. Ended leases are marked expired by an hourly lifecycle sweep; verify this behavior on your Atlas deployment.
- Payment records remain pending until Paystack verification or a valid signed webhook confirms the transaction. Failed payments release the active billing-period key so the customer can retry.
- Billing keys prevent duplicate successful/pending payments for the same rent/service-charge period or one-time security deposit.
- `GET /api/health` confirms the HTTP service is running; it is not a full readiness check for the database or payment provider.

## Before production

Set production `NODE_ENV`, exact `CORS_ORIGIN` frontend origins, real environment secrets, HTTPS, database backups, monitoring, and a verified Paystack webhook. Add automated integration tests against a dedicated test database and complete end-to-end payment tests. The project can be integrated with a frontend after local dependency installation and API smoke tests; live payment acceptance still requires your Paystack account keys and webhook configuration.
