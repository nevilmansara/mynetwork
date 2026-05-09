# API_SPEC.md — MyNetwork API Reference

> Base URL: `http://localhost:8000`
> All protected routes require: `Authorization: Bearer <jwt_token>`

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "Alice Sharma",
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Alice Sharma",
  "email": "alice@example.com",
  "my_person_id": "uuid-of-self-person-node",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `409` — Email already registered

---

### POST /auth/login
Login and get a JWT token.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Alice Sharma",
    "email": "alice@example.com",
    "my_person_id": "uuid"
  }
}
```

**Errors:**
- `401` — Invalid email or password

---

### GET /auth/me
Get current logged-in user. 🔒 Protected

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Alice Sharma",
  "email": "alice@example.com",
  "my_person_id": "uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## People Endpoints

### GET /people 🔒
Get all people in current user's network.

**Query Params:**
- `q` (optional) — filter by name/occupation/skill

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Raj Patel",
    "email": "raj@example.com",
    "phone": "+91-9876543210",
    "occupation": "UI Designer",
    "company": "DesignCo",
    "skills": ["Figma", "UI Design", "Prototyping"],
    "location": "Ahmedabad, India",
    "notes": "Met at startup meetup",
    "photo_url": null,
    "is_self": false,
    "connections_count": 3,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### POST /people 🔒
Add a new person to the network.

**Request Body:**
```json
{
  "name": "Raj Patel",
  "email": "raj@example.com",
  "phone": "+91-9876543210",
  "occupation": "UI Designer",
  "company": "DesignCo",
  "skills": ["Figma", "UI Design", "Prototyping"],
  "location": "Ahmedabad, India",
  "notes": "Met at startup meetup"
}
```
Only `name` is required. All other fields are optional.

**Response 201:** Returns created PersonResponse object.

---

### GET /people/{id} 🔒
Get a specific person by ID.

**Response 200:** Returns PersonResponse object.

**Errors:**
- `404` — Person not found
- `403` — Person belongs to different user

---

### PUT /people/{id} 🔒
Update a person's details.

**Request Body:** Any subset of PersonCreate fields (all optional for update).

**Response 200:** Returns updated PersonResponse object.

---

### DELETE /people/{id} 🔒
Delete a person and all their connections.

**Response 200:**
```json
{
  "message": "Person deleted successfully"
}
```

---

### GET /people/{id}/connections 🔒
Get all connections for a specific person.

**Response 200:**
```json
[
  {
    "person": {
      "id": "uuid",
      "name": "Priya Shah",
      "occupation": "Product Manager",
      "skills": ["Product", "Strategy"],
      "photo_url": null
    },
    "relationship_type": "colleague",
    "since": "2022",
    "notes": "Worked together at TechCorp"
  }
]
```

---

## Connection Endpoints

### GET /connections 🔒
Get all connections in the user's network.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "person_a": { "id": "uuid", "name": "Raj", "occupation": "Designer" },
    "person_b": { "id": "uuid", "name": "Priya", "occupation": "PM" },
    "relationship_type": "colleague",
    "since": "2022",
    "notes": "",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### POST /connections 🔒
Create a connection between two people.

**Request Body:**
```json
{
  "person_a_id": "uuid",
  "person_b_id": "uuid",
  "relationship_type": "colleague",
  "since": "2023",
  "notes": "Met at Google I/O"
}
```

`relationship_type` options: `friend`, `colleague`, `family`, `mentor`, `classmate`, `other`

**Response 201:**
```json
{
  "id": "uuid",
  "person_a": { ... },
  "person_b": { ... },
  "relationship_type": "colleague",
  "since": "2023",
  "notes": "Met at Google I/O",
  "created_at": "..."
}
```

**Errors:**
- `409` — Connection already exists
- `400` — Cannot connect person to themselves
- `403` — One or both persons don't belong to this user

---

### DELETE /connections 🔒
Remove a connection between two people.

**Request Body:**
```json
{
  "person_a_id": "uuid",
  "person_b_id": "uuid"
}
```

**Response 200:**
```json
{
  "message": "Connection removed successfully"
}
```

---

## Graph Endpoint

### GET /graph 🔒
Get full network data in react-force-graph format.

**Response 200:**
```json
{
  "nodes": [
    {
      "id": "uuid",
      "name": "Alice (You)",
      "occupation": "Developer",
      "company": "MyStartup",
      "skills": ["Python", "React"],
      "connections_count": 5,
      "is_self": true
    },
    {
      "id": "uuid2",
      "name": "Raj Patel",
      "occupation": "UI Designer",
      "company": "DesignCo",
      "skills": ["Figma", "UI Design"],
      "connections_count": 3,
      "is_self": false
    }
  ],
  "links": [
    {
      "source": "uuid",
      "target": "uuid2",
      "type": "colleague"
    }
  ],
  "total_nodes": 2,
  "total_links": 1
}
```

---

## Search Endpoints

### GET /search?q={query} 🔒
Search people by name, occupation, skill, or company.

**Query Params:**
- `q` (required) — search term

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Raj Patel",
    "occupation": "UI Designer",
    "skills": ["Figma", "UI Design"],
    "connections_count": 3,
    "match_reason": "skills"
  }
]
```

`match_reason`: `name`, `occupation`, `skills`, or `company`

---

### GET /search/paths?skill={skill} 🔒
Find shortest paths from current user to people with a given skill.

**Query Params:**
- `skill` (required) — skill or occupation to search for

**Response 200:**
```json
[
  {
    "person": {
      "id": "uuid",
      "name": "Priya Shah",
      "occupation": "UI Designer",
      "skills": ["Figma", "UI Design", "User Research"]
    },
    "path": [
      { "id": "uuid-self", "name": "You" },
      { "id": "uuid-raj", "name": "Raj Patel" },
      { "id": "uuid-priya", "name": "Priya Shah" }
    ],
    "path_names": ["You", "Raj Patel", "Priya Shah"],
    "hops": 2,
    "match_reason": "occupation"
  },
  {
    "person": {
      "id": "uuid2",
      "name": "Dev Mehta",
      "occupation": "Product Designer",
      "skills": ["UI Design", "Figma"]
    },
    "path": [
      { "id": "uuid-self", "name": "You" },
      { "id": "uuid-dev", "name": "Dev Mehta" }
    ],
    "path_names": ["You", "Dev Mehta"],
    "hops": 1,
    "match_reason": "skills"
  }
]
```

Results sorted by `hops` ascending (closest first).

---

## Health Endpoint

### GET /health
Check API and database health. No auth required.

**Response 200:**
```json
{
  "api": "ok",
  "database": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response 200 (DB issue):**
```json
{
  "api": "ok",
  "database": "error",
  "error": "Failed to connect to Neo4j",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Response Format

All errors follow this format:
```json
{
  "detail": "Human readable error message"
}
```

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (accessing another user's data) |
| 404 | Not found |
| 409 | Conflict (duplicate data) |
| 500 | Internal server error |
