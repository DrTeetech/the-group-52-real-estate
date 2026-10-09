# Group 52 Real Estate Rental Platform

This repository contains the React frontend and Express/Mongoose backend.

## Requirements
- Node.js 16.20+ and npm 8+ (the frontend uses Vite 4 for Node 16 compatibility)
- MongoDB Atlas connection string

## 1. Configure the backend
Open a terminal in `backend/`:

```bash
npm install
```

Create `backend/.env` using the values below (replace the placeholders with your own credentials):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

Then run:

```bash
npm run dev
```

The API health check is `http://localhost:5000/api/health`.

## 2. Run the frontend
Open a second terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. The Vite proxy forwards `/api` requests to the backend on port 5000.

## 3. Push to GitHub
From this repository's root folder:

```bash
git init
git add .
git commit -m "Prepare Group 52 rental platform submission"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do not commit `.env` or real database credentials.

## Submission notes
- Register/login, public property browsing, and customer requests depend on the backend running and MongoDB Atlas being configured with accessible network/IP settings.
- Payment records are not the same as a completed online checkout. Configure and test the payment provider/webhook before claiming live payments are operational.
- Run the frontend build with `npm run build` before final submission.
