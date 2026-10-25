# MediConnect Server (TypeScript)

Backend API server for the MediConnect mobile application built with Node.js, Express, and TypeScript.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already created by default):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:8081
```

### 3. Run Development Server (with hot reload via tsx)
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

### 5. Typecheck
```bash
npm run typecheck
```

Server runs on `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/auth/login` | Patient login |
| `POST` | `/api/auth/register` | Patient registration |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/doctors` | List doctors (supports `?specialty=&consultationType=&minRating=`) |
| `GET` | `/api/doctors/specialties` | List all unique doctor specialties |
| `GET` | `/api/doctors/:id` | Get doctor details by ID |
| `GET` | `/api/appointments` | List appointments (supports `?status=&patientId=`) |
| `POST` | `/api/appointments` | Book a new appointment |
| `PATCH` | `/api/appointments/:id` | Update appointment status |
