# Group 52 Real Estate Frontend

This is a separate React/Vite frontend for the uploaded Group 52 Node/Express backend.

## Important

The backend is not modified.

The frontend uses the existing `/api/...` endpoints through the Vite development proxy:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

This proxy is important because the current backend does not need CORS changes for local development.

## Run

1. Keep the backend running in its existing project:
   `npm run dev`
2. Open this frontend folder in another terminal.
3. Install dependencies:
   `npm install`
4. Start:
   `npm run dev`

## Included

Customer:
- Home page
- Property search/filtering
- Property details
- Register/login
- JWT token storage
- Favorites
- Inquiries
- Viewing requests
- Rental applications
- Lease list
- Payment list
- Customer dashboard

Staff:
- Role-protected staff dashboard
- Reads inquiry/viewing/application/lease/payment management endpoints

## Backend contract

The frontend intentionally calls the existing routes:
- `/api/auth`
- `/api/properties`
- `/api/me/favorites`
- `/api/inquiries`
- `/api/viewings`
- `/api/rental-applications`
- `/api/leases`
- `/api/payments`

No backend file needs to be moved, renamed or edited.

## Production note

For production, serve the React build behind the same domain/reverse proxy as the API, or configure CORS at the infrastructure layer. The frontend itself does not alter the backend.
