# Backend - Ticket Management System

This is the NestJS backend for the Ticket Management System.

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (for PostgreSQL)

## Setup

1.  **Install Dependencies:**
    ```bash
    cd backend
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env`.
    ```bash
    cp .env.example .env
    ```
    Update `DATABASE_URL` if needed (default expects Docker).

3.  **Start Database:**
    ```bash
    docker-compose up -d
    ```

4.  **Database Migration & Seed:**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

## Running the App

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

- **Auth**: `/auth/login`, `/auth/refresh`, `/auth/logout`
- **Users**: `/users` (Admin only)
- **Tickets**: `/tickets` (CRUD + Assignment + Status specific to Roles)
- **Notifications**: `/notifications`

## Testing

```bash
# E2E Tests
npm run test:e2e
```
*Note: E2E tests require the test database to be running.*
