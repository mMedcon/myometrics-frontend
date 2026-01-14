# MyoMetrics Django Backend API Specification

## Overview
This document outlines the complete API requirements for the Django backend service that powers the MyoMetrics medical imaging analysis platform. The Django service handles user authentication, authorization, audit logging, analytics, and user management.

## Base Configuration
- **Base URL**: `http://localhost:8001/api` (Development)
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json`
- **API Prefix**: All endpoints prefixed with `/api/`

## Environment Variables
```bash
# Frontend expects these URLs
DJANGO_API_URL=http://localhost:8001/api
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🔐 Authentication Endpoints

### POST `/auth/login/`
User authentication endpoint.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin|doctor|technician",
    "clinicName": "Medical Center",
    "dateJoined": "2025-08-19T10:30:00Z"
  }
}
```

**Error Response (400/401):**
```json
{
  "detail": "Invalid credentials"
}
```

### POST `/auth/register/`
User registration endpoint.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "clinicName": "Heart Clinic" // optional
}
```

**Response (201):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "doctor",
    "clinicName": "Heart Clinic",
    "dateJoined": "2025-08-19T10:30:00Z"
  }
}
```

### POST `/auth/logout/`
User logout endpoint.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "detail": "Successfully logged out"
}
```

### GET `/auth/user/`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin",
  "clinicName": "Medical Center",
  "dateJoined": "2025-08-19T10:30:00Z"
}
```

### PUT `/auth/user/`
Update current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "clinicName": "Updated Medical Center"
}
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "Johnny",
  "lastName": "Doe",
  "role": "admin",
  "clinicName": "Updated Medical Center",
  "dateJoined": "2025-08-19T10:30:00Z"
}
```

### POST `/auth/change-password/`
Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "old_password": "oldpassword",
  "new_password": "newpassword"
}
```

**Response (200):**
```json
{
  "detail": "Password changed successfully"
}
```

### POST `/auth/password-reset/`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "detail": "Password reset email sent"
}
```

### POST `/auth/token/refresh/`
Refresh JWT access token.

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## 👥 User Management Endpoints

### GET `/users/`
List all users (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)
- `search`: Search by name or email
- `role`: Filter by role

**Response (200):**
```json
{
  "count": 25,
  "next": "http://localhost:8001/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "clinicName": "Medical Center",
      "dateJoined": "2025-08-19T10:30:00Z",
      "lastLogin": "2025-08-19T15:45:00Z",
      "isActive": true
    }
  ]
}
```

### GET `/users/{id}/`
Get specific user details (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin",
  "clinicName": "Medical Center",
  "dateJoined": "2025-08-19T10:30:00Z",
  "lastLogin": "2025-08-19T15:45:00Z",
  "isActive": true
}
```

### PUT `/users/{id}/`
Update user (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "role": "doctor",
  "clinicName": "Updated Clinic",
  "isActive": true
}
```

### DELETE `/users/{id}/`
Delete user (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

## 📊 Analytics Endpoints

### GET `/analytics/`
Get comprehensive analytics data (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days`: Number of days to include (default: 30)

**Response (200):**
```json
{
  "user_activity": {
    "daily_uploads": [
      {"date": "2025-08-01", "count": 23},
      {"date": "2025-08-02", "count": 19},
      {"date": "2025-08-03", "count": 31}
    ],
    "weekly_uploads": [
      {"week": "Week 1", "count": 156},
      {"week": "Week 2", "count": 198}
    ],
    "monthly_uploads": [
      {"month": "2025-07", "count": 456},
      {"month": "2025-08", "count": 523}
    ]
  },
  "diagnosis_trends": [
    {
      "diagnosis": "Normal",
      "count": 245,
      "trend": "up",
      "percentage_change": 15.2
    },
    {
      "diagnosis": "Myocardial Infarction",
      "count": 89,
      "trend": "stable",
      "percentage_change": 2.1
    }
  ],
  "system_health": {
    "active_users": 45,
    "total_uploads": 1247,
    "success_rate": 94.2,
    "average_processing_time": 45.6
  }
}
```

### GET `/users/me/activity/`
Get current user's activity data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "uploads_today": 5,
  "uploads_this_week": 23,
  "uploads_this_month": 87,
  "last_login": "2025-08-19T15:45:00Z",
  "recent_uploads": [
    {
      "id": "upload_001",
      "filename": "cardiac_scan_001.jpg",
      "timestamp": "2025-08-19T14:30:00Z",
      "status": "completed"
    },
    {
      "id": "upload_002",
      "filename": "cardiac_scan_002.jpg",
      "timestamp": "2025-08-19T13:15:00Z",
      "status": "processing"
    }
  ]
}
```

---

## 🔍 Audit Log Endpoints

### POST `/audit-logs/`
Create audit log entry.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "action": "upload_created",
  "resource_type": "upload",
  "resource_id": "upload_001",
  "details": {
    "filename": "cardiac_scan.jpg",
    "file_size": 2048576,
    "diagnosis": "Normal"
  }
}
```

**Response (201):**
```json
{
  "id": 123,
  "user_id": 1,
  "action": "upload_created",
  "resource_type": "upload",
  "resource_id": "upload_001",
  "timestamp": "2025-08-19T15:45:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "filename": "cardiac_scan.jpg",
    "file_size": 2048576,
    "diagnosis": "Normal"
  }
}
```

### GET `/audit-logs/`
Get audit logs (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number
- `user_id`: Filter by user ID
- `action`: Filter by action type
- `resource_type`: Filter by resource type
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "count": 1247,
  "next": "http://localhost:8001/api/audit-logs/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "user_id": 1,
      "action": "upload_created",
      "resource_type": "upload",
      "resource_id": "upload_001",
      "timestamp": "2025-08-19T15:45:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "filename": "cardiac_scan.jpg"
      }
    }
  ]
}
```

---

## 🔔 Notification Settings Endpoints

### GET `/users/me/notifications/`
Get user notification settings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "email_notifications": true,
  "upload_completed": true,
  "analysis_ready": true,
  "system_alerts": false
}
```

### PATCH `/users/me/notifications/`
Update notification settings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email_notifications": false,
  "system_alerts": true
}
```

**Response (200):**
```json
{
  "email_notifications": false,
  "upload_completed": true,
  "analysis_ready": true,
  "system_alerts": true
}
```

---

## 💾 Data Export Endpoints

### GET `/users/me/export/`
Export user data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `format`: Export format (`csv` or `json`, default: `csv`)

**Response (200):**
- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="user_data.csv"`
- Returns file blob for download

### DELETE `/users/me/`
Delete user account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

## 🏥 System Health Endpoints

### GET `/health/`
Get system health status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "status": "healthy",
  "services": {
    "database": "up",
    "redis": "up",
    "email": "up",
    "microservice": "up"
  },
  "last_check": "2025-08-19T15:45:00Z"
}
```

---

## 🛡️ Security Requirements

### JWT Token Configuration
- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days
- **Algorithm**: HS256
- **Issuer**: myometrics-backend

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://myometrics.com"  # Production
]
CORS_ALLOW_CREDENTIALS = True
```

### Required Headers
All protected endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Rate Limiting
- **Authentication endpoints**: 5 requests/minute
- **API endpoints**: 100 requests/minute
- **Export endpoints**: 2 requests/hour

---

## 📋 Data Models

### User Model
```python
class User(AbstractUser):
    email = EmailField(unique=True)
    firstName = CharField(max_length=30)
    lastName = CharField(max_length=30)
    role = CharField(choices=[
        ('admin', 'Administrator'),
        ('doctor', 'Doctor'),
        ('technician', 'Technician')
    ])
    clinicName = CharField(max_length=100, blank=True)
    dateJoined = DateTimeField(auto_now_add=True)
    lastLogin = DateTimeField(null=True, blank=True)
    isActive = BooleanField(default=True)
```

### AuditLog Model
```python
class AuditLog(Model):
    user = ForeignKey(User, on_delete=CASCADE)
    action = CharField(max_length=50)
    resource_type = CharField(max_length=50)
    resource_id = CharField(max_length=100)
    timestamp = DateTimeField(auto_now_add=True)
    ip_address = GenericIPAddressField()
    user_agent = TextField()
    details = JSONField(default=dict)
```

### NotificationSettings Model
```python
class NotificationSettings(Model):
    user = OneToOneField(User, on_delete=CASCADE)
    email_notifications = BooleanField(default=True)
    upload_completed = BooleanField(default=True)
    analysis_ready = BooleanField(default=True)
    system_alerts = BooleanField(default=False)
```

---

## 🔧 Implementation Notes

### Database Requirements
- **PostgreSQL 13+** (Recommended)
- **Redis** for caching and sessions
- **Celery** for background tasks

### Required Django Packages
```bash
django==4.2.x
djangorestframework==3.14.x
djangorestframework-simplejwt==5.x
django-cors-headers==4.x
psycopg2-binary==2.9.x
redis==4.x
celery==5.x
```

### Background Tasks
Implement Celery tasks for:
- Email notifications
- Data export generation
- System health checks
- Analytics data aggregation

### Error Handling
All endpoints should return consistent error formats:
```json
{
  "detail": "Error message",
  "code": "error_code",
  "field_errors": {
    "email": ["This field is required"]
  }
}
```

### Logging
Log all API access with:
- User ID
- IP address
- Endpoint accessed
- Timestamp
- Response status

---

## 🚀 Deployment Configuration

### Environment Variables
```bash
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/myometrics
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@myometrics.com
EMAIL_HOST_PASSWORD=app-password
MICROSERVICE_URL=http://localhost:8000
FRONTEND_URL=https://myometrics.com
ALLOWED_HOSTS=localhost,myometrics.com
```

### Production Considerations
- Use environment-specific settings
- Enable SSL/TLS for all communications
- Implement proper database connection pooling
- Set up monitoring and alerting
- Configure log aggregation
- Implement backup strategies

---

This API specification provides the complete backend requirements for the MyoMetrics platform. The Django team should implement these endpoints to ensure seamless integration with the Next.js frontend.
