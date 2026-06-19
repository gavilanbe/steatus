# sTEAtus API Reference

## Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All API endpoints except public ones require authentication via Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer {jwt_token}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Authentication Endpoints

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "uniqueUsername",
  "displayName": "User Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "session": {...}
  }
}
```

### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Sign Out
```http
POST /api/auth/signout
Authorization: Bearer {token}
```

## User Management

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "display_name": "string",
    "bio": "string",
    "avatar_url": "string",
    "avatar_emoji": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "display_name": "New Display Name",
  "bio": "Updated bio",
  "avatar_emoji": "🎭"
}
```

### Upload Avatar
```http
POST /api/users/upload-avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
```

## Mood Management

### Get Mood History
```http
GET /api/moods?limit=50&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `start_date`: Filter from date (ISO format)
- `end_date`: Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "user_id": "uuid",
      "mood_type": "happy",
      "is_visible": true,
      "created_at": "timestamp",
      "acknowledgment_count": 5
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### Create Mood Entry
```http
POST /api/moods
Authorization: Bearer {token}
Content-Type: application/json

{
  "mood_type": "happy",
  "is_visible": true
}
```

**Mood Types:**
- `calm`
- `happy`
- `anxious`
- `overwhelmed`
- `focused`
- `tired`
- `shutdown`
- `meltdown`

### Get Current Mood
```http
GET /api/moods/current
Authorization: Bearer {token}
```

### Acknowledge Mood
```http
POST /api/moods/{mood_id}/acknowledge
Authorization: Bearer {token}
```

## Contact Management

### Get Contacts
```http
GET /api/contacts
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": 1,
        "contact_user_id": "uuid",
        "status": "accepted",
        "created_at": "timestamp",
        "contact_profile": {
          "username": "string",
          "display_name": "string",
          "avatar_url": "string"
        },
        "current_mood": {
          "mood_type": "happy",
          "created_at": "timestamp",
          "is_visible": true
        }
      }
    ],
    "friend_requests": [
      {
        "id": 2,
        "user_id": "uuid",
        "created_at": "timestamp",
        "requester_profile": {
          "username": "string",
          "display_name": "string"
        }
      }
    ]
  }
}
```

### Search Users
```http
GET /api/contacts/search?q={query}&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `q`: Search query (username or display name)
- `limit`: Number of results (default: 10, max: 50)

### Send Friend Request
```http
POST /api/contacts/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "target_user_uuid",
  "message": "Optional message"
}
```

### Accept Friend Request
```http
PUT /api/contacts/{request_id}/accept
Authorization: Bearer {token}
```

### Decline Friend Request
```http
DELETE /api/contacts/{request_id}
Authorization: Bearer {token}
```

### Remove Contact
```http
DELETE /api/contacts/{contact_id}
Authorization: Bearer {token}
```

### Add by Friend Code
```http
POST /api/contacts/friend-code
Authorization: Bearer {token}
Content-Type: application/json

{
  "friend_code": "TEA-12345678"
}
```

## Settings Management

### Get User Settings
```http
GET /api/settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "push_enabled": true,
    "sound_enabled": false,
    "quiet_hours": true,
    "mood_updates": true,
    "acknowledgments": true,
    "show_to_all": true,
    "allow_friend_requests": true,
    "share_history": false,
    "dark_mode": false,
    "color_scheme": "warm",
    "font_size": "medium"
  }
}
```

### Update Settings
```http
PUT /api/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "dark_mode": true,
  "color_scheme": "cool",
  "push_enabled": false
}
```

## Push Notifications

### Subscribe to Push
```http
POST /api/push/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "userId": "user_uuid"
}
```

### Test Notification
```http
POST /api/push/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_uuid",
  "message": "Test notification message"
}
```

### Trigger Mood Notification
```http
POST /api/push/notify-mood
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_uuid",
  "moodType": "shutdown",
  "userName": "User Name"
}
```

### Trigger Acknowledgment Notification
```http
POST /api/push/notify-acknowledgment
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_uuid",
  "acknowledgerName": "Friend Name"
}
```

## Export Endpoints

### Export Mood Data (CSV)
```http
GET /api/export/moods/csv?range=month
Authorization: Bearer {token}
```

**Query Parameters:**
- `range`: `week`, `month`, or `all`
- `start_date`: Custom start date (ISO format)
- `end_date`: Custom end date (ISO format)

**Response:** CSV file download

### Export Mood Report (PDF)
```http
GET /api/export/moods/pdf?range=month
Authorization: Bearer {token}
```

**Response:** PDF file download

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: jwt_token
  }
});
```

### Client Events (Send)

#### Mood Update
```javascript
socket.emit('mood_update', {
  mood: 'happy'
});
```

#### Acknowledge Mood
```javascript
socket.emit('acknowledge_mood', {
  userId: 'target_user_id'
});
```

### Server Events (Receive)

#### Contact Mood Update
```javascript
socket.on('contact_mood_update', (data) => {
  // data: { userId, mood, timestamp }
});
```

#### Mood Acknowledged
```javascript
socket.on('mood_acknowledged', (data) => {
  // data: { acknowledgedBy, timestamp }
});
```

#### User Online/Offline
```javascript
socket.on('user_online', (userId) => {
  // User came online
});

socket.on('user_offline', (userId) => {
  // User went offline
});
```

#### Online Users List
```javascript
socket.on('online_users', (userIds) => {
  // Array of currently online user IDs
});
```

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication token required
- `AUTH_INVALID`: Invalid or expired token
- `AUTH_FORBIDDEN`: Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `INVALID_MOOD_TYPE`: Invalid mood type provided
- `INVALID_USER_ID`: User ID format invalid

### Resource Errors
- `USER_NOT_FOUND`: User does not exist
- `MOOD_NOT_FOUND`: Mood entry does not exist
- `CONTACT_NOT_FOUND`: Contact relationship does not exist
- `ALREADY_EXISTS`: Resource already exists (e.g., friendship)

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Server Errors
- `INTERNAL_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `NOTIFICATION_ERROR`: Push notification failed

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Push Notifications**: 20 requests per minute per user
- **File Uploads**: 10 requests per hour per user

## Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `limit`: Items per page (default: 20, max: 100)
- `offset`: Number of items to skip
- `cursor`: Cursor-based pagination token (when available)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_more": true,
    "next_cursor": "eyJ..."
  }
}
```

## Webhooks

### Mood Update Webhook
Triggered when a user creates a new mood entry with critical states.

```http
POST /your-webhook-endpoint
Content-Type: application/json

{
  "event": "mood.created",
  "data": {
    "user_id": "uuid",
    "mood_type": "shutdown",
    "is_visible": true,
    "created_at": "timestamp"
  },
  "timestamp": "timestamp"
}
```

### Friend Request Webhook
Triggered when friend request status changes.

```http
POST /your-webhook-endpoint
Content-Type: application/json

{
  "event": "friend_request.accepted",
  "data": {
    "requester_id": "uuid",
    "recipient_id": "uuid",
    "created_at": "timestamp"
  },
  "timestamp": "timestamp"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { SupabaseClient } from '@supabase/supabase-js'

class STeatusAPI {
  constructor(private supabase: SupabaseClient) {}

  async createMood(moodType: string, isVisible: boolean = true) {
    const { data, error } = await this.supabase
      .from('moods')
      .insert([{ mood_type: moodType, is_visible: isVisible }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async getFriends() {
    const { data, error } = await this.supabase
      .from('contacts')
      .select(`
        *,
        contact_profile:profiles!contacts_contact_user_id_fkey(*),
        current_mood:moods(mood_type, created_at, is_visible)
      `)
      .eq('status', 'accepted');
      
    if (error) throw error;
    return data;
  }
}
```

### Python
```python
from supabase import create_client, Client
import requests

class STeatusAPI:
    def __init__(self, url: str, key: str):
        self.supabase: Client = create_client(url, key)
        self.base_url = "http://localhost:3001/api"
    
    def create_mood(self, mood_type: str, is_visible: bool = True):
        response = self.supabase.table('moods').insert({
            'mood_type': mood_type,
            'is_visible': is_visible
        }).execute()
        return response.data
    
    def get_friends(self):
        response = self.supabase.table('contacts') \
            .select("*, contact_profile:profiles!contacts_contact_user_id_fkey(*)") \
            .eq('status', 'accepted') \
            .execute()
        return response.data
```

This API reference covers all available endpoints and their usage patterns for the sTEAtus application.