# Backend Audit and Changes

## Critical issues found in the supplied ZIP

1. **Case-sensitive model import failures.** Controllers imported `../models/User`, `../models/Property`, etc., while the supplied files used lowercase names. This can work on some local filesystems and fail on Linux deployment. Model filenames now match the imports exactly.
2. **Duplicate auth route mount.** `/api/auth` was mounted twice. It is now mounted once.
3. **Property mass assignment.** Property creation accepted the entire request body, including fields intended to be staff-controlled or workflow-controlled. Creation now allowlists editable fields and forces new properties to private drafts. Updates allowlist fields and enforce agent assignment.
4. **Public property details could expose unavailable properties.** Detail lookup now requires both public visibility and available status, and public payloads omit internal assignment/reservation fields.
5. **Lease/property state was not atomic.** Lease creation and status changes updated multiple MongoDB documents without transactions. These transitions now use MongoDB transactions and company-owned property pricing; application approval reserves a property atomically.
6. **Conflicting application approvals.** Approval previously relied on read-then-write checks. It now conditionally reserves the property in the same transaction, and an active-application key prevents duplicate active applications for the same customer/property.
7. **Lease cancellation could incorrectly republish a property.** Cancelling a pending lease preserves the reservation for its approved application so staff can issue a corrected lease; ending an active lease releases the property.
8. **No automatic end-of-lease transition.** An hourly lifecycle task marks ended active leases as expired and releases their properties when no other current lease exists.
9. **Payments were only records.** Customer-submitted amounts/statuses were not enough for real payment processing. Paystack checkout initialization, server-side verification, signed webhook handling, amount/currency checks, and billing-period duplicate prevention are now included.
10. **Insufficient baseline HTTP protections.** Helmet, CORS configuration, request body limits, global/auth rate limiting, JSON error handling, and a consistent 404 response were added.
11. **Staff account administration was absent.** Admin-protected list/create/update endpoints and a one-time local bootstrap script were added. Public registration still always creates a customer.
12. **Unbounded staff list endpoints.** Staff inquiry, viewing, application, lease, payment, and staff lists now support pagination (page/limit).

## Important remaining operational requirements

- Run `npm install` on the development machine and run the API against a dedicated MongoDB Atlas test database.
- Ensure the database has the unique indexes declared by the models, especially `Favorite(user, property)`, `User.email`, `Property.slug`, `Property.propertyCode`, `RentalApplication.activeApplicationKey`, `Payment.reference`, and `Payment.activePaymentKey`.
- Set a strong unique JWT secret and exact frontend origins in production.
- Configure Paystack test keys and the webhook URL, then test successful, failed, mismatched-amount, repeated-webhook, and repeated-verification cases.
- This project is a strong integration baseline, not a substitute for end-to-end QA, security review, legal review of lease documents, payment reconciliation, backups, and production monitoring.
