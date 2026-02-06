# Local Run Guide

This guide explains how to run the Support Smiles app locally.

## Architecture Overview

The app has two modes:
1. **Frontend-Only (Mock Mode)** - Uses in-memory mock database, no backend required
2. **Full Stack** - Frontend + NestJS backend + PostgreSQL

## Quick Start (Frontend-Only)

The simplest way to run locally uses the built-in mock database.

### Prerequisites
- Node.js 20+ (see `.nvmrc`)
- npm 10+

### Steps

```bash
# 1. Install dependencies
npm ci

# 2. Start development server
npm run dev
```

**Result:** App runs at http://localhost:8082

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Accounting | sarah@company.com | accounting123 |
| CS Agent | mike@company.com | cs123 |
| CS Agent | emily@company.com | cs123 |

---

## Full Stack Setup (with Backend)

For production-like development with a real database.

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- npm 10+

### Steps

```bash
# 1. Start PostgreSQL via Docker
cd backend
docker-compose up -d

# 2. Install backend dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Run Prisma migrations
npx prisma migrate dev

# 5. Seed the database (optional)
npx prisma db seed

# 6. Start the backend
npm run start:dev
```

Backend runs at http://localhost:3000

```bash
# 7. In a new terminal, start the frontend
cd ..  # back to repo root
npm run dev
```

Frontend runs at http://localhost:8082

---

## Environment Variables

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:4001` |

**Note:** When running frontend-only mode, the API URL doesn't matter because all API calls are mocked.

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/tms_db?schema=public` |
| `JWT_SECRET` | Secret for access token signing | (required) |
| `JWT_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh token | (required) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `PORT` | Backend port | `3000` |

---

## Verification Checklist

### Frontend-Only Mode
- [ ] `npm run dev` starts without errors
- [ ] Browser opens to http://localhost:8082
- [ ] Login page appears
- [ ] Login with `admin@company.com` / `admin123` works
- [ ] Dashboard loads with ticket data
- [ ] No network errors in console (all API calls are mocked)

### Full Stack Mode (additional)
- [ ] `docker-compose up -d` starts PostgreSQL
- [ ] Backend starts with `npm run start:dev`
- [ ] Health check: `curl http://localhost:3000/health`
- [ ] Real API calls work (visible in backend logs)

---

## Scripts Reference

### Frontend (repo root)
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run check` | Lint + tests + coverage |
| `npm run test:serial` | Run tests |

### Backend (./backend)
| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Start with hot reload |
| `npm run start` | Start without reload |
| `npm run test` | Run Jest tests |
| `npx prisma studio` | Open Prisma data browser |

---

## Troubleshooting

### Port already in use
```bash
# Find process on port
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Database connection failed
```bash
# Ensure Docker is running
docker ps

# Restart PostgreSQL
cd backend && docker-compose down && docker-compose up -d
```

### Missing dependencies
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```
