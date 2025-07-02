# API Documentation

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "artist|organizer"
}

Response: {
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: {
  "success": true,
  "token": "string",
  "user": {
    "id": "number",
    "name": "string",
    "role": "string"
  }
}
```

## Artist Endpoints

### Get Artist Profile
```http
GET /api/artists/profile
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "id": "number",
    "name": "string",
    "bio": "string",
    "skills": "array",
    "portfolio": "array",
    "ratings": "object"
  }
}
```

### Update Artist Profile
```http
PUT /api/artists/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "name": "string",
  "bio": "string",
  "skills": "array",
  "profileImage": "file"
}

Response: {
  "success": true,
  "message": "Profile updated successfully"
}
```

## Event Endpoints

### Create Event
```http
POST /api/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "date": "date",
  "venue": "string",
  "budget": "number",
  "requirements": "array"
}

Response: {
  "success": true,
  "data": {
    "id": "number",
    "title": "string",
    "status": "string"
  }
}
```

### Get Event Details
```http
GET /api/events/:id
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "id": "number",
    "title": "string",
    "description": "string",
    "organizer": "object",
    "applications": "array",
    "status": "string"
  }
}
```

## Booking Endpoints

### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": "number",
  "artistId": "number",
  "details": "object"
}

Response: {
  "success": true,
  "data": {
    "bookingId": "number",
    "status": "string",
    "paymentInfo": "object"
  }
}
```

### Update Booking Status
```http
PUT /api/bookings/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed|cancelled|completed"
}

Response: {
  "success": true,
  "message": "Booking status updated"
}
```

## Admin Endpoints

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "users": "array",
    "pagination": "object"
  }
}
```

### Verify User
```http
PUT /api/admin/users/:id/verify
Authorization: Bearer {token}

Response: {
  "success": true,
  "message": "User verified successfully"
}
```

### Get System Statistics
```http
GET /api/admin/statistics
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "totalUsers": "number",
    "activeEvents": "number",
    "totalBookings": "number",
    "revenue": "object"
  }
}
```

## Error Responses

### Common Error Format
```http
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "string",
    "details": "object"
  }
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 