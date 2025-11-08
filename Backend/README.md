# SlotSwapper API Documentation

This document provides comprehensive documentation for all API endpoints in the SlotSwapper backend.

## Base URL

```
http://localhost:5001/api
```

## Authentication

Most endpoints require authentication using JWT tokens. After logging in or registering, you'll receive a token that must be included in the `Authorization` header:

```
Authorization: Bearer your_jwt_token_here
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

In development mode, error responses also include a stack trace.

## Authentication Endpoints

### Register User
- **POST** `/api/auth/register`
- **Description:** Create a new user account
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "token": "jwt_token"
    }
  }
  ```
- **Errors:**
  - 400: Validation errors or email already exists
  - 500: Server error

### Login User
- **POST** `/api/auth/login`
- **Description:** Authenticate user and receive JWT token
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "token": "jwt_token"
    }
  }
  ```
- **Errors:**
  - 400: Missing email or password
  - 401: Invalid credentials
  - 500: Server error

### Get Current User
- **GET** `/api/auth/me`
- **Description:** Get authenticated user's profile
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      }
    }
  }
  ```

## Event Endpoints

### Create Event
- **POST** `/api/events`
- **Description:** Create a new event
- **Headers:** `Authorization: Bearer jwt_token`
- **Body:**
  ```json
  {
    "title": "Team Meeting",
    "description": "Weekly sync",
    "startTime": "2024-02-15T10:00:00.000Z",
    "endTime": "2024-02-15T11:00:00.000Z",
    "status": "SWAPPABLE"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "event_id",
      "userId": "user_id",
      "title": "Team Meeting",
      "description": "Weekly sync",
      "startTime": "2024-02-15T10:00:00.000Z",
      "endTime": "2024-02-15T11:00:00.000Z",
      "status": "SWAPPABLE",
      "createdAt": "2024-02-10T08:00:00.000Z",
      "updatedAt": "2024-02-10T08:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 400: Validation errors or event overlap
  - 401: Unauthorized
  - 500: Server error

### Get All User Events
- **GET** `/api/events`
- **Description:** Get all events for the authenticated user
- **Headers:** `Authorization: Bearer jwt_token`
- **Query Parameters:**
  - `status`: Filter by status (BUSY, SWAPPABLE, SWAPPED)
  - `startDate`: Filter events from date
  - `endDate`: Filter events until date
  - `sort`: Sort by field (startTime, title)
  - `order`: Sort order (asc, desc)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      {
        "id": "event_id",
        "userId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": null
        },
        "title": "Team Meeting",
        "description": "Weekly sync",
        "startTime": "2024-02-15T10:00:00.000Z",
        "endTime": "2024-02-15T11:00:00.000Z",
        "status": "SWAPPABLE",
        "duration": 60,
        "createdAt": "2024-02-10T08:00:00.000Z",
        "updatedAt": "2024-02-10T08:00:00.000Z"
      }
    ]
  }
  ```

### Get Single Event
- **GET** `/api/events/:id`
- **Description:** Get a specific event by ID
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "event_id",
      "userId": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "title": "Team Meeting",
      "description": "Weekly sync",
      "startTime": "2024-02-15T10:00:00.000Z",
      "endTime": "2024-02-15T11:00:00.000Z",
      "status": "SWAPPABLE",
      "duration": 60,
      "createdAt": "2024-02-10T08:00:00.000Z",
      "updatedAt": "2024-02-10T08:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 401: Unauthorized
  - 403: Not authorized to access this event
  - 404: Event not found

### Update Event
- **PUT** `/api/events/:id`
- **Description:** Update an existing event
- **Headers:** `Authorization: Bearer jwt_token`
- **Body:**
  ```json
  {
    "title": "Updated Team Meeting",
    "description": "Weekly sync and planning"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "event_id",
      "userId": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "title": "Updated Team Meeting",
      "description": "Weekly sync and planning",
      "startTime": "2024-02-15T10:00:00.000Z",
      "endTime": "2024-02-15T11:00:00.000Z",
      "status": "SWAPPABLE",
      "duration": 60,
      "createdAt": "2024-02-10T08:00:00.000Z",
      "updatedAt": "2024-02-10T09:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 400: Validation errors or event overlap
  - 401: Unauthorized
  - 403: Not authorized to update this event
  - 404: Event not found

### Delete Event
- **DELETE** `/api/events/:id`
- **Description:** Delete an event
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Event deleted successfully"
  }
  ```
- **Errors:**
  - 401: Unauthorized
  - 403: Not authorized to delete this event
  - 404: Event not found
  - 400: Cannot delete event with pending swap requests

### Mark Event as Swappable
- **PATCH** `/api/events/:id/mark-swappable`
- **Description:** Mark an event as swappable for the marketplace
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "event_id",
      "userId": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": null
      },
      "title": "Team Meeting",
      "description": "Weekly sync",
      "startTime": "2024-02-15T10:00:00.000Z",
      "endTime": "2024-02-15T11:00:00.000Z",
      "status": "SWAPPABLE",
      "duration": 60,
      "createdAt": "2024-02-10T08:00:00.000Z",
      "updatedAt": "2024-02-10T08:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 401: Unauthorized
  - 403: Not authorized to update this event
  - 404: Event not found
  - 400: Event is already swappable

## Marketplace Endpoints

### Get All Swappable Slots
- **GET** `/api/marketplace`
- **Description:** Get all swappable events from other users
- **Headers:** `Authorization: Bearer jwt_token`
- **Query Parameters:**
  - `search`: Search by title or description
  - `startDate`: Filter events from date
  - `endDate`: Filter events until date
  - `minDuration`: Min duration in minutes
  - `maxDuration`: Max duration in minutes
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 15,
    "totalPages": 2,
    "currentPage": 1,
    "data": [
      {
        "id": "event_id",
        "userId": {
          "id": "user_id",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "avatar": "https://..."
        },
        "title": "Focus Block",
        "description": "Deep work session",
        "startTime": "2024-02-16T14:00:00.000Z",
        "endTime": "2024-02-16T16:00:00.000Z",
        "status": "SWAPPABLE",
        "duration": 120,
        "createdAt": "2024-02-10T08:00:00.000Z"
      }
    ]
  }
  ```

### Get Swappable Event Details
- **GET** `/api/marketplace/:id`
- **Description:** Get details of a specific swappable event
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "event_id",
      "userId": {
        "id": "user_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://..."
      },
      "title": "Focus Block",
      "description": "Deep work session",
      "startTime": "2024-02-16T14:00:00.000Z",
      "endTime": "2024-02-16T16:00:00.000Z",
      "status": "SWAPPABLE",
      "duration": 120,
      "createdAt": "2024-02-10T08:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 401: Unauthorized
  - 400: Event is not swappable or cannot view own event
  - 404: Event not found

## Swap Request Endpoints

### Get Incoming Requests
- **GET** `/api/swap-requests/incoming`
- **Description:** Get all pending swap requests where the user is the target
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "id": "request_id",
        "requesterId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "requesterEventId": {
          "id": "event_id",
          "title": "Team Meeting",
          "startTime": "2024-02-15T10:00:00.000Z",
          "endTime": "2024-02-15T11:00:00.000Z"
        },
        "targetEventId": {
          "id": "event_id",
          "title": "Focus Block",
          "startTime": "2024-02-16T14:00:00.000Z",
          "endTime": "2024-02-16T16:00:00.000Z"
        },
        "status": "PENDING",
        "createdAt": "2024-02-14T08:00:00.000Z"
      }
    ]
  }
  ```

### Get Outgoing Requests
- **GET** `/api/swap-requests/outgoing`
- **Description:** Get all swap requests created by the user
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": "request_id",
        "requesterId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "requesterEventId": {
          "id": "event_id",
          "title": "Team Meeting",
          "startTime": "2024-02-15T10:00:00.000Z",
          "endTime": "2024-02-15T11:00:00.000Z"
        },
        "targetEventId": {
          "id": "event_id",
          "title": "Focus Block",
          "startTime": "2024-02-16T14:00:00.000Z",
          "endTime": "2024-02-16T16:00:00.000Z"
        },
        "status": "PENDING",
        "createdAt": "2024-02-14T08:00:00.000Z"
      }
    ]
  }
  ```

### Create Swap Request
- **POST** `/api/swap-requests`
- **Description:** Create a new swap request
- **Headers:** `Authorization: Bearer jwt_token`
- **Body:**
  ```json
  {
    "targetEventId": "event_id",
    "requesterEventId": "event_id"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "request_id",
      "requesterId": "...",
      "requesterEventId": {...},
      "targetUserId": "...",
      "targetEventId": {...},
      "status": "PENDING",
      "createdAt": "2024-02-14T08:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - 400: Validation errors, events not swappable, or swap request already exists
  - 401: Unauthorized
  - 403: Not authorized to create swap request for this event
  - 404: Events not found

### Accept Swap Request
- **PATCH** `/api/swap-requests/:id/accept`
- **Description:** Accept a pending swap request
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Swap completed successfully",
    "data": {
      "swapRequest": {...},
      "swappedEvents": [
        {...},
        {...}
      ]
    }
  }
  ```
- **Errors:**
  - 400: Request already processed
  - 401: Unauthorized
  - 403: Not authorized to accept this request
  - 404: Swap request not found

### Reject Swap Request
- **PATCH** `/api/swap-requests/:id/reject`
- **Description:** Reject a pending swap request
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Swap request rejected",
    "data": {...}
  }
  ```
- **Errors:**
  - 400: Request already processed
  - 401: Unauthorized
  - 403: Not authorized to reject this request
  - 404: Swap request not found

### Cancel Swap Request
- **DELETE** `/api/swap-requests/:id`
- **Description:** Cancel a pending swap request
- **Headers:** `Authorization: Bearer jwt_token`
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Swap request cancelled"
  }
  ```
- **Errors:**
  - 400: Can only cancel pending requests
  - 401: Unauthorized
  - 403: Not authorized to cancel this request
  - 404: Swap request not found