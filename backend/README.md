# Company-Owned Real Estate Rental Backend

Express + Mongoose API for a company-managed rental platform. It supports public property browsing, customer accounts, favorites, inquiries, viewing requests, rental applications, leases, staff administration, and Paystack checkout/verification.

## Requirements

- Node.js 18.18+
- MongoDB Atlas (transactions are used for application approval and lease state changes)
- Paystack test/live secret key for online checkout

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env with your actual Atlas URI, a random JWT secret, and local frontend origin(s)
npm run dev
```

Health check: `GET http://localhost:5000/api/health`.

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never commit `.env`. The `.env.example` contains placeholders only.

## Staff bootstrap

Public registration only creates customers. To create the first super administrator, register the intended account, set `BOOTSTRAP_ADMIN_EMAIL` to that account in the trusted local `.env`, and run `node scripts/setInitialSuperAdmin.js` once. Remove the bootstrap variable afterward. Then log in again. Use the admin API to create subsequent staff accounts.

## Payment integration

Paystack initialization, authenticated server-side verification, signature-checked webhook handling, amount/currency checks, idempotent status transitions, and per-billing-period duplicate prevention are implemented. Set `PAYSTACK_SECRET_KEY`, `PAYSTACK_CALLBACK_URL`, and the Paystack dashboard webhook URL. Start with test keys and test transactions. The live provider flow cannot be confirmed until your own credentials and webhook configuration are supplied and tested.

## API documentation

See [`API_GUIDE.md`](./API_GUIDE.md) for endpoints, authorization roles, example request bodies, property lifecycle behavior, and frontend integration notes.

## Important business rules

- No property sales: the app is rental-only.
- Company inventory is created as private drafts and must be reviewed/published by authorized staff.
- Customers cannot create properties, set roles, or alter rental pricing.
- Application approval atomically reserves the property; lease creation uses saved company property terms.
- Public browsing exposes only public/available properties.
- Property records with linked rental/financial history are archived instead of permanently deleted.
- Staff agents are restricted to assigned properties/records where applicable.

## Validation status

All JavaScript files pass `node --check`, and relative local `require()` paths were checked for existence in the packaged source. Full runtime/API and Paystack integration tests must be run after `npm install` against your Atlas test database and Paystack test account.
