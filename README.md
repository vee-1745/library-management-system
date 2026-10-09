# Library Management System

NoSQL Lab project: a full-stack library management app.

**Live demo:** (https://library-management-system-plum-rho.vercel.app/)

**API:** (https://library-api-ny2z.onrender.com/)

## Tech stack
- Database: MongoDB Atlas (Mongoose ODM)
- Backend: Node.js, Express, JWT auth, bcrypt
- Frontend: React (Vite), React Router, Axios
- Deployment: Render (API), Vercel (frontend)

## Features
- Admin login with JWT
- Books: add, edit, delete, search, pagination
- Members: manage members
- Issue / return with due dates and automatic fines
- Dashboard built with MongoDB aggregation pipelines

## Run locally
1. `cd backend`, copy `.env.example` to `.env`, fill in values, `npm install`, `npm run dev`
2. `cd frontend`, set `VITE_API_URL` in `.env`, `npm install`, `npm run dev`
3. Create an admin: `node scripts/createAdmin.js "Name" email password`