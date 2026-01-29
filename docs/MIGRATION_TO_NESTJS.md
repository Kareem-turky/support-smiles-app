# Migration to NestJS Backend

This document provides a comprehensive guide for migrating from the Mock API layer to a real NestJS + PostgreSQL backend.

## Overview

The current frontend uses an in-memory mock database (`src/services/mockDb.ts`) that simulates all backend operations. The migration involves:

1. Setting up NestJS with Prisma ORM
2. Creating PostgreSQL tables matching our data model
3. Replacing mock service calls with real HTTP fetch calls
4. Implementing JWT authentication
5. Adding WebSocket support for real-time notifications

---

## 1. Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  ACCOUNTING
  CS
}

enum IssueType {
  ACCOUNTING
  DELIVERY
  COD
  RETURNS
  ADDRESS
  DUPLICATE
  OTHER
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  NEW
  ASSIGNED
  IN_PROGRESS
  WAITING
  RESOLVED
  CLOSED
  REOPENED
}

enum NotificationType {
  TICKET_ASSIGNED
  MESSAGE_RECEIVED
  STATUS_CHANGED
  TICKET_REASSIGNED
}

enum EventType {
  TICKET_CREATED
  TICKET_ASSIGNED
  STATUS_CHANGED
  MESSAGE_SENT
  TICKET_RESOLVED
  TICKET_REOPENED
  TICKET_UPDATED
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password_hash String
  role          UserRole
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  created_tickets   Ticket[]        @relation("TicketCreator")
  assigned_tickets  Ticket[]        @relation("TicketAssignee")
  messages          TicketMessage[]
  notifications     Notification[]
  events            TicketEvent[]

  @@map("users")
}

model Ticket {
  id              String       @id @default(uuid())
  order_number    String
  courier_company String
  issue_type      IssueType
  priority        Priority
  status          TicketStatus @default(NEW)
  description     String
  
  created_by      String
  creator         User         @relation("TicketCreator", fields: [created_by], references: [id])
  
  assigned_to     String?
  assignee        User?        @relation("TicketAssignee", fields: [assigned_to], references: [id])
  
  resolved_at     DateTime?
  closed_at       DateTime?
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
  deleted_at      DateTime?    // Soft delete

  // Relations
  messages        TicketMessage[]
  events          TicketEvent[]

  @@index([status])
  @@index([priority])
  @@index([assigned_to])
  @@index([created_by])
  @@index([deleted_at])
  @@map("tickets")
}

model TicketMessage {
  id         String   @id @default(uuid())
  ticket_id  String
  ticket     Ticket   @relation(fields: [ticket_id], references: [id], onDelete: Cascade)
  sender_id  String
  sender     User     @relation(fields: [sender_id], references: [id])
  message    String
  created_at DateTime @default(now())

  @@index([ticket_id])
  @@map("ticket_messages")
}

model Notification {
  id         String           @id @default(uuid())
  user_id    String
  user       User             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  type       NotificationType
  title      String
  body       String
  is_read    Boolean          @default(false)
  link       String
  created_at DateTime         @default(now())

  @@index([user_id, is_read])
  @@map("notifications")
}

model TicketEvent {
  id         String    @id @default(uuid())
  ticket_id  String
  ticket     Ticket    @relation(fields: [ticket_id], references: [id], onDelete: Cascade)
  actor_id   String
  actor      User      @relation(fields: [actor_id], references: [id])
  event_type EventType
  meta       Json      @default("{}")
  created_at DateTime  @default(now())

  @@index([ticket_id])
  @@map("ticket_events")
}

model RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([user_id])
  @@index([expires_at])
  @@map("refresh_tokens")
}
```

---

## 2. NestJS Module Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts      # @Roles('ADMIN', 'ACCOUNTING')
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts          # POST /auth/login, /auth/refresh
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── refresh-token.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts         # GET /users, PATCH /users/:id
│   ├── users.service.ts
│   └── dto/
│       └── create-user.dto.ts
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts       # CRUD + /assign + /status
│   ├── tickets.service.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       ├── update-ticket.dto.ts
│       └── ticket-filters.dto.ts
├── messages/
│   ├── messages.module.ts
│   ├── messages.controller.ts      # GET/POST /tickets/:id/messages
│   └── messages.service.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts # GET /notifications, mark read
│   ├── notifications.service.ts
│   └── notifications.gateway.ts    # WebSocket gateway
├── events/
│   ├── events.module.ts
│   └── events.service.ts           # Audit log creation
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### Module Mapping

| Frontend Service | NestJS Module | Controller |
|-----------------|---------------|------------|
| `authService` | `AuthModule` | `AuthController` |
| `usersService` | `UsersModule` | `UsersController` |
| `ticketsService` | `TicketsModule` | `TicketsController` |
| `ticketsService.getMessages/addMessage` | `MessagesModule` | `MessagesController` |
| `notificationsService` | `NotificationsModule` | `NotificationsController` |
| Audit events | `EventsModule` | (internal service) |

---

## 3. Frontend API Client Migration

### Step 1: Create API Client

Create `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';

interface ApiConfig {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  async fetch<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = config;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error, data.code, response.status);
    }

    return data;
  }
}

export const api = new ApiClient();
```

### Step 2: Replace Service Methods

**Before (Mock):**
```typescript
// src/services/auth.service.ts
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const user = mockDb.getUserByEmail(credentials.email);
    // ... mock logic
  },
};
```

**After (Real API):**
```typescript
// src/services/auth.service.ts
import { api } from './api';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.fetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    api.setAccessToken(response.data.access_token);
    return response;
  },
};
```

### Step 3: Update Each Service

Replace each mock service file:

| File | Changes |
|------|---------|
| `auth.service.ts` | Replace `mockDb` calls with `api.fetch('/auth/...')` |
| `users.service.ts` | Replace with `api.fetch('/users/...')` |
| `tickets.service.ts` | Replace with `api.fetch('/tickets/...')` |
| `notifications.service.ts` | Replace with `api.fetch('/notifications/...')` |

---

## 4. Environment Variables

Create `.env` files:

```env
# .env.development
VITE_API_URL=http://localhost:3000/v1
VITE_WS_URL=ws://localhost:3000

# .env.production
VITE_API_URL=https://api.example.com/v1
VITE_WS_URL=wss://api.example.com
```

---

## 5. WebSocket Migration

Replace polling with WebSocket for real-time notifications.

### Frontend Changes

Update `src/services/notifications.provider.ts`:

```typescript
// Switch from PollingProvider to WebSocketProvider
import { WebSocketProvider } from './notifications/WebSocketProvider';

export const notificationsProvider = new WebSocketProvider({
  url: import.meta.env.VITE_WS_URL,
});
```

### NestJS Gateway

```typescript
// src/notifications/notifications.gateway.ts
@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Authenticate via JWT in handshake
  }

  sendNotification(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
```

---

## 6. Migration Checklist

### Phase 1: Backend Setup
- [ ] Create NestJS project: `nest new ticket-api`
- [ ] Install dependencies: `prisma`, `@nestjs/jwt`, `@nestjs/passport`, `bcrypt`
- [ ] Set up Prisma with PostgreSQL
- [ ] Run `prisma migrate dev` to create tables
- [ ] Implement auth module with JWT
- [ ] Implement users module
- [ ] Implement tickets module with RBAC guards
- [ ] Implement messages module
- [ ] Implement notifications module
- [ ] Add seed script for demo data
- [ ] Write integration tests

### Phase 2: Frontend Migration
- [ ] Create API client (`src/services/api.ts`)
- [ ] Add environment variables for API URL
- [ ] Update `auth.service.ts` to use real API
- [ ] Update `users.service.ts` to use real API
- [ ] Update `tickets.service.ts` to use real API
- [ ] Update `notifications.service.ts` to use real API
- [ ] Remove `mockDb.ts` and old mock files
- [ ] Test all RBAC scenarios
- [ ] Test error handling (401, 403, 404, 422)

### Phase 3: Real-time Features
- [ ] Set up WebSocket gateway in NestJS
- [ ] Implement `WebSocketProvider` in frontend
- [ ] Switch notifications from polling to WebSocket
- [ ] Test real-time notification delivery

### Phase 4: Production Readiness
- [ ] Set up CI/CD pipeline
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Load testing
- [ ] Security audit

---

## 7. RBAC Implementation in NestJS

### Roles Decorator

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### Roles Guard

```typescript
// src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Usage in Controller

```typescript
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  @Post()
  @Roles('ADMIN', 'ACCOUNTING')
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: User) {
    return this.ticketsService.create(dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.ticketsService.softDelete(id);
  }
}
```

---

## 8. Testing Strategy

### Backend Tests

```typescript
// tickets.controller.spec.ts
describe('TicketsController', () => {
  it('should deny CS from creating tickets', async () => {
    const response = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${csUserToken}`)
      .send(createTicketDto);
    
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });
});
```

### Frontend Tests

Keep existing Vitest tests, but mock the API client:

```typescript
vi.mock('@/services/api', () => ({
  api: {
    fetch: vi.fn(),
  },
}));
```

---

## Notes

- The mock layer is designed to match the API contract exactly, so frontend code changes should be minimal
- JWT tokens should be stored in memory (not localStorage) for security
- Refresh tokens can be stored in httpOnly cookies
- All API responses follow the same `{ success, data?, error?, code? }` format
