# Railway Ticket Booking System

A full-stack railway reservation system with user authentication, train enquiry, booking flow, queue handling, payment tracking, booking history, and admin dashboards.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas (Mongoose)
- Deployment: Vercel (client) + Render (server)

## Project Structure

```
client/   # React frontend
server/   # Node/Express backend
render.yaml
```

## Local Setup

### 1) Backend

Create environment file in `server/.env` using `server/.env.example` as reference.

Required keys:

- `MONGODB_URI`
- `JWT_SECRET`

Run:

```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### 2) Frontend

Create environment file in `client/.env` using `client/.env.example` as reference.

Run:

```bash
cd client
npm install
npm run dev
```

Frontend runs on Vite dev server (typically `http://localhost:5173`).

## Deployment Notes

- Render backend must have valid `MONGODB_URI` and `JWT_SECRET`.
- If Atlas password contains special characters, URL-encode it in `MONGODB_URI`.
- Health endpoints:
  - `/health`
  - `/api/health`
  - `/api`

## Author

- Arnav Mittal
- GitHub: https://github.com/arnavmittal0208-coder
