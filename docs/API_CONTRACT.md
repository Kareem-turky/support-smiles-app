# API Contract Documentation

This document defines the API contract for the Ticket Management System.  
All endpoints are RESTful and return JSON responses.

## Base URL

```
Production: https://api.example.com/v1
Development: http://localhost:3000/v1
```

## Authentication

All endpoints (except `/auth/login`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "ADMIN" | "ACCOUNTING" | "CS"
    },
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "ISO8601 timestamp"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Account is deactivated",
  "code": "ACCOUNT_DEACTIVATED"
}
```

---

#### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "ISO8601 timestamp"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Invalid or expired refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

---

### Tickets

#### GET /tickets

List all tickets with optional filters and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| pageSize | number | Items per page (default: 10, max: 100) |
| status | string[] | Filter by status (comma-separated) |
| priority | string[] | Filter by priority (comma-separated) |
| issue_type | string[] | Filter by issue type (comma-separated) |
| assigned_to | uuid | Filter by assignee |
| created_by | uuid | Filter by creator |
| search | string | Search in order_number, description, courier |
| date_from | ISO8601 | Filter by created_at >= date |
| date_to | ISO8601 | Filter by created_at <= date |

**RBAC Rules:**
- **ADMIN**: Can view all tickets
- **ACCOUNTING**: Can view all tickets
- **CS**: Can ONLY view tickets assigned to them

**Response 200:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "order_number": "string",
        "courier_company": "string",
        "issue_type": "ACCOUNTING" | "DELIVERY" | "COD" | "RETURNS" | "ADDRESS" | "DUPLICATE" | "OTHER",
        "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        "status": "NEW" | "ASSIGNED" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | "REOPENED",
        "description": "string",
        "created_by": "uuid",
        "assigned_to": "uuid | null",
        "resolved_at": "ISO8601 | null",
        "closed_at": "ISO8601 | null",
        "created_at": "ISO8601",
        "updated_at": "ISO8601",
        "deleted_at": "ISO8601 | null"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

#### POST /tickets

Create a new ticket.

**RBAC Rules:**
- **ADMIN**: Can create tickets
- **ACCOUNTING**: Can create tickets
- **CS**: CANNOT create tickets (403)

**Request:**
```json
{
  "order_number": "string (required)",
  "courier_company": "string (required)",
  "issue_type": "ACCOUNTING" | "DELIVERY" | "COD" | "RETURNS" | "ADDRESS" | "DUPLICATE" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "description": "string (required)",
  "assigned_to": "uuid (optional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "string",
    "courier_company": "string",
    "issue_type": "DELIVERY",
    "priority": "HIGH",
    "status": "NEW",
    "description": "string",
    "created_by": "uuid",
    "assigned_to": null,
    "resolved_at": null,
    "closed_at": null,
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "deleted_at": null
  }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Access denied: CS cannot create tickets",
  "code": "FORBIDDEN"
}
```

**Response 422:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "order_number": ["Order number is required"],
    "issue_type": ["Invalid issue type"]
  }
}
```

---

#### GET /tickets/:id

Get a single ticket by ID.

**RBAC Rules:**
- **ADMIN**: Can view any ticket
- **ACCOUNTING**: Can view any ticket
- **CS**: Can ONLY view tickets assigned to them

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "string",
    "courier_company": "string",
    "issue_type": "DELIVERY",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "description": "string",
    "created_by": "uuid",
    "assigned_to": "uuid",
    "resolved_at": null,
    "closed_at": null,
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "deleted_at": null
  }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Ticket not found",
  "code": "NOT_FOUND"
}
```

---

#### PATCH /tickets/:id

Update ticket core fields.

**RBAC Rules:**
- **ADMIN**: Can update any ticket
- **ACCOUNTING**: Can ONLY update tickets they created
- **CS**: CANNOT update ticket fields (403)

**Request:**
```json
{
  "order_number": "string (optional)",
  "courier_company": "string (optional)",
  "issue_type": "DELIVERY (optional)",
  "priority": "HIGH (optional)",
  "description": "string (optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* updated ticket */ }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Access denied: CS cannot edit ticket fields",
  "code": "FORBIDDEN"
}
```

---

#### POST /tickets/:id/assign

Assign or reassign a ticket to a CS user.

**RBAC Rules:**
- **ADMIN**: Can assign any ticket
- **ACCOUNTING**: Can assign any ticket
- **CS**: CANNOT assign tickets (403)

**Request:**
```json
{
  "assigned_to": "uuid (required)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* updated ticket with assigned_to set */ }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```

---

#### PATCH /tickets/:id/status

Change ticket status.

**RBAC Rules:**
- **ADMIN**: Can set any status
- **ACCOUNTING**: Can set any status
- **CS**: Can ONLY set to: `IN_PROGRESS`, `WAITING`, `RESOLVED` (and only for assigned tickets)

**Valid Status Transitions:**
```
NEW → ASSIGNED (via assign endpoint)
NEW/ASSIGNED → IN_PROGRESS
IN_PROGRESS ↔ WAITING
IN_PROGRESS/WAITING → RESOLVED
RESOLVED → CLOSED
RESOLVED/CLOSED → REOPENED
REOPENED → IN_PROGRESS
```

**Request:**
```json
{
  "status": "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | "REOPENED"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* updated ticket */ }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "CS can only set status to: IN_PROGRESS, WAITING, RESOLVED",
  "code": "FORBIDDEN"
}
```

---

#### DELETE /tickets/:id

Soft delete a ticket.

**RBAC Rules:**
- **ADMIN**: Can delete any ticket
- **ACCOUNTING**: CANNOT delete tickets (403)
- **CS**: CANNOT delete tickets (403)

**Response 200:**
```json
{
  "success": true
}
```

**Response 403:**
```json
{
  "success": false,
  "error": "Unauthorized: Admin access required",
  "code": "FORBIDDEN"
}
```

---

### Ticket Messages

#### GET /tickets/:id/messages

Get all messages for a ticket.

**RBAC Rules:**
- Same as viewing the ticket

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "sender_id": "uuid",
      "message": "string",
      "created_at": "ISO8601"
    }
  ]
}
```

---

#### POST /tickets/:id/messages

Add a message to a ticket.

**RBAC Rules:**
- Any authenticated user who can view the ticket can add messages

**Request:**
```json
{
  "message": "string (required)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticket_id": "uuid",
    "sender_id": "uuid",
    "message": "string",
    "created_at": "ISO8601"
  }
}
```

---

### Notifications

#### GET /notifications

Get all notifications for the current user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "TICKET_ASSIGNED" | "MESSAGE_RECEIVED" | "STATUS_CHANGED" | "TICKET_REASSIGNED",
      "title": "string",
      "body": "string",
      "is_read": false,
      "link": "/tickets/{ticketId}",
      "created_at": "ISO8601"
    }
  ]
}
```

---

#### PATCH /notifications/:id/read

Mark a single notification as read.

**Response 200:**
```json
{
  "success": true,
  "data": { /* updated notification with is_read: true */ }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "Notification not found",
  "code": "NOT_FOUND"
}
```

---

#### POST /notifications/read-all

Mark all notifications as read for the current user.

**Response 200:**
```json
{
  "success": true
}
```

---

## Enums

### UserRole
| Value | Description |
|-------|-------------|
| ADMIN | Full system access |
| ACCOUNTING | Create/edit tickets, assign to CS |
| CS | Work on assigned tickets only |

### IssueType
| Value | Description |
|-------|-------------|
| ACCOUNTING | Accounting/billing issues |
| DELIVERY | Delivery problems |
| COD | Cash on delivery issues |
| RETURNS | Return handling |
| ADDRESS | Address corrections |
| DUPLICATE | Duplicate order issues |
| OTHER | Other issues |

### Priority
| Value | Description |
|-------|-------------|
| LOW | Low priority |
| MEDIUM | Medium priority |
| HIGH | High priority |
| URGENT | Urgent - immediate attention |

### TicketStatus
| Value | Description |
|-------|-------------|
| NEW | Newly created, unassigned |
| ASSIGNED | Assigned to CS agent |
| IN_PROGRESS | Being worked on |
| WAITING | Waiting for external response |
| RESOLVED | Issue resolved |
| CLOSED | Ticket closed (after resolution) |
| REOPENED | Previously resolved, reopened |

### NotificationType
| Value | Description |
|-------|-------------|
| TICKET_ASSIGNED | New ticket assigned to user |
| MESSAGE_RECEIVED | New message on a ticket |
| STATUS_CHANGED | Ticket status changed |
| TICKET_REASSIGNED | Ticket reassigned to user |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | User lacks permission for this action |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid request data |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| ACCOUNT_DEACTIVATED | 403 | User account is deactivated |
| INVALID_REFRESH_TOKEN | 401 | Refresh token invalid/expired |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 requests/minute |
| All other endpoints | 100 requests/minute |

---

## WebSocket Events (Future)

When migrating from polling to WebSocket:

```typescript
// Subscribe
ws.send({ type: 'subscribe', channel: 'notifications' });

// Events received
{ type: 'notification', data: Notification }
{ type: 'ticket_updated', data: { ticket_id: string } }
```
