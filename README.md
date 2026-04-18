# Urben Solution

Urben Solution is a modern service marketplace inspired by Urban Company. It includes a customer website, technician dashboard, admin panel, JWT authentication, MongoDB models, Multer uploads, and seed data.

## Apps

- `backend`: Node.js, Express, MongoDB, JWT, Multer, Socket.io
- `frontend`: React, Vite, Tailwind CSS

## Prerequisites

- Node.js 20+
- MongoDB running locally or a MongoDB Atlas URI
- A working npm installation

This machine currently has Node installed, but the global npm shim is broken. Once npm is repaired, use the commands below.

## Setup

```bash
npm install
npm run install:all
```

Create `backend/.env` from `backend/.env.example`.

```bash
cp backend/.env.example backend/.env
```

Seed sample users, technicians, services, and bookings:

```bash
npm run seed
```

Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Accounts

- Admin: `admin@urbensolution.com` / `Admin@123`
- User: `user@urbensolution.com` / `User@123`
- Technician: `tech@urbensolution.com` / `Tech@123`

## Key API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/services`
- `POST /api/services`
- `POST /api/book`
- `GET /api/book/user`
- `GET /api/book/technician`
- `POST /api/technician/register`
- `POST /api/technician/login`
- `GET /api/technician/jobs`
- `PUT /api/technician/status`
- `GET /api/admin/stats`
