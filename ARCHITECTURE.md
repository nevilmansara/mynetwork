# ARCHITECTURE.md — MyNetwork

> Deep dive into system design, data flow, and component interactions.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                      │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │           React Frontend (Vite)              │  │
│   │                                              │  │
│   │  Pages → Components → Hooks → Services       │  │
│   │                    ↕ axios                   │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕ HTTP / REST API
                    (localhost:8000)
┌─────────────────────────────────────────────────────┐
│              Python FastAPI Backend                  │
│                                                      │
│   Routers → Services → Neo4j Driver                 │
│                                                      │
│   Auth Middleware (JWT verification)                 │
└─────────────────────────────────────────────────────┘
                         ↕ Bolt Protocol
                    (localhost:7687)
┌─────────────────────────────────────────────────────┐
│           Neo4j Database (Docker)                    │
│                                                      │
│   Graph: User nodes, Person nodes, KNOWS edges       │
│   Browser UI: localhost:7474                         │
└─────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Component Hierarchy

```
App.jsx
├── AuthContext.Provider
│   └── NetworkContext.Provider
│       ├── PublicRoute
│       │   ├── LoginPage
│       │   └── RegisterPage
│       │
│       └── PrivateRoute
│           └── Layout.jsx
│               ├── Navbar.jsx
│               ├── Sidebar.jsx
│               └── <Page Content>
│                   ├── DashboardPage
│                   │   └── Stats, QuickActions
│                   ├── PeoplePage
│                   │   ├── PersonCard (×N)
│                   │   └── PersonForm (modal)
│                   ├── PersonDetailPage
│                   │   ├── PersonProfile
│                   │   ├── ConnectionList
│                   │   └── ConnectionForm
│                   ├── GraphPage
│                   │   ├── NetworkGraph (react-force-graph)
│                   │   ├── GraphControls
│                   │   └── PersonProfile (side panel)
│                   └── SearchPage
│                       ├── SearchBar
│                       └── PathResult (list of results with paths)
```

### Data Flow

```
User Action
    ↓
Component (e.g., PersonForm submits)
    ↓
Custom Hook (e.g., usePeople.addPerson())
    ↓
Service Layer (e.g., peopleService.create(data))
    ↓
Axios (with JWT header auto-attached)
    ↓
FastAPI Backend
    ↓
Response updates Context state
    ↓
All subscribed components re-render
```

### Routing Structure

```
/                    → Redirect to /dashboard (if auth) or /login
/login               → LoginPage
/register            → RegisterPage
/dashboard           → DashboardPage (stats overview)
/people              → PeoplePage (grid/list of all contacts)
/people/:id          → PersonDetailPage
/graph               → GraphPage (interactive network visualization)
/search              → SearchPage (skill/path search)
```

---

## 3. Backend Architecture

### Request Lifecycle

```
HTTP Request
    ↓
FastAPI Router (routers/*.py)
    ↓
Auth Middleware (verify JWT, extract user_id)
    ↓
Input Validation (Pydantic model)
    ↓
Service Layer (services/*.py)
    ↓
Neo4j Query (via neo4j driver)
    ↓
Response Model (Pydantic → JSON)
    ↓
HTTP Response
```

### Layer Responsibilities

| Layer | File | Responsibility |
|---|---|---|
| Router | `routers/people.py` | HTTP methods, URL params, calls service |
| Service | `services/people_service.py` | Business logic, Neo4j queries |
| Model | `models/person.py` | Request/response data shapes |
| Database | `database.py` | Neo4j driver connection pool |
| Config | `config.py` | Reads .env, exposes settings |
| Middleware | `middleware/auth_middleware.py` | JWT decode, user injection |

### Example: Add Person Flow

```python
# 1. Router receives POST /people
@router.post("/people", response_model=PersonResponse)
async def create_person(
    person_data: PersonCreate,          # Pydantic validates input
    current_user = Depends(get_current_user)  # JWT verified
):
    return await people_service.create_person(
        person_data, current_user["user_id"]
    )

# 2. Service runs Neo4j query
async def create_person(data, user_id):
    query = """
    MATCH (u:User {id: $user_id})
    CREATE (p:Person {
        id: randomUUID(),
        name: $name,
        occupation: $occupation,
        skills: $skills,
        ...
        created_at: datetime()
    })
    CREATE (u)-[:OWNS]->(p)
    RETURN p
    """
    result = await db.run(query, user_id=user_id, **data.dict())
    return result.single()["p"]
```

---

## 4. Neo4j Graph Model

### Visual Representation

```
(User: Alice)
    |
    | [:OWNS]
    ↓
(Person: Alice-self) ──[:KNOWS]──► (Person: Raj)
                                        |
                                        | [:KNOWS]
                                        ↓
                                   (Person: Priya)
                                   skills: ["UI Design"]

(User: Bob)
    |
    | [:OWNS]
    ↓
(Person: Bob-self) ──[:KNOWS]──► (Person: Meera)
```

### Why "Self" Person Node?

Every user gets a `Person` node that represents themselves.
- Makes pathfinding natural: "shortest path from ME to a UI designer"
- User can fill in their own details (occupation, skills)
- Stored with `is_self: true` property

### Multi-user Data Isolation

Every query is scoped to the logged-in user:
```cypher
MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
```
User A can never access User B's nodes.

### Indexes (Create on first setup)

```cypher
CREATE INDEX user_id_index FOR (u:User) ON (u.id);
CREATE INDEX user_email_index FOR (u:User) ON (u.email);
CREATE INDEX person_id_index FOR (p:Person) ON (p.id);
CREATE FULLTEXT INDEX person_search FOR (p:Person) ON EACH [p.name, p.occupation, p.skills];
```

---

## 5. Authentication Architecture

```
REGISTER:
  Client sends { name, email, password }
      ↓
  Backend hashes password (bcrypt, cost=12)
      ↓
  Creates User node in Neo4j
      ↓
  Auto-creates "self" Person node
      ↓
  Creates OWNS relationship
      ↓
  Returns { user_id, name, email }

LOGIN:
  Client sends { email, password }
      ↓
  Backend finds User by email
      ↓
  Verifies password with bcrypt
      ↓
  Generates JWT: { user_id, email, my_person_id, exp: 24h }
      ↓
  Returns { access_token, token_type: "bearer", user: {...} }

PROTECTED REQUEST:
  Client sends request + Header: "Authorization: Bearer <token>"
      ↓
  auth_middleware.py intercepts
      ↓
  Decodes JWT, verifies signature & expiry
      ↓
  Injects current_user into route handler
      ↓
  Route proceeds normally
```

---

## 6. Search & Pathfinding Architecture

### Simple Search (by skill/occupation)
```
User types "UI Design" in search
    ↓
GET /search?q=UI+Design
    ↓
Neo4j: Find all Person nodes owned by user
       WHERE skill matches OR occupation matches
    ↓
Returns list of people with match highlights
```

### Pathfinding Search
```
User asks "How do I reach a UI Designer?"
    ↓
GET /search/path?skill=UI+Design
    ↓
Neo4j shortestPath() from user's self-node
       to any Person with matching skill
       max depth: 6 hops
    ↓
Returns: [
  {
    person: { name: "Priya", occupation: "UI Designer" },
    path: ["You", "Raj", "Priya"],
    hops: 2
  }
]
    ↓
Frontend highlights path on graph visualization
```

---

## 7. Graph Visualization Architecture

### Data Pipeline

```
Neo4j
  ↓ GET /graph
FastAPI returns:
{
  "nodes": [
    { "id": "uuid1", "name": "You", "occupation": "...", "skills": [...], "connections_count": 3 },
    { "id": "uuid2", "name": "Raj", "occupation": "Designer", "skills": [...], "connections_count": 5 }
  ],
  "links": [
    { "source": "uuid1", "target": "uuid2", "type": "colleague" }
  ]
}
  ↓
graphHelpers.js transforms if needed
  ↓
react-force-graph renders interactive graph
```

### Node Visual Encoding

| Property | Visual |
|---|---|
| Occupation category | Node color |
| Number of connections | Node size |
| Currently selected | Gold border |
| In search path | Orange/yellow highlight |
| Hovered | Enlarged + neighbors highlighted |

### Occupation Color Map
```js
const OCCUPATION_COLORS = {
  "Design":      "#A855F7",  // purple
  "Engineering": "#3B82F6",  // blue
  "Marketing":   "#F97316",  // orange
  "Finance":     "#10B981",  // green
  "Legal":       "#EF4444",  // red
  "HR":          "#F59E0B",  // amber
  "Other":       "#6B7280",  // gray
}
```

---

## 8. Docker Setup

```yaml
# docker/docker-compose.yml
services:
  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"   # Browser UI
      - "7687:7687"   # Bolt (app connection)
    environment:
      NEO4J_AUTH: neo4j/mynetwork123
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs

volumes:
  neo4j_data:
  neo4j_logs:
```

Access Neo4j browser at: `http://localhost:7474`
Connection URL: `bolt://localhost:7687`

---

## 9. Error Handling Strategy

### Backend
```python
# Consistent error format
{
  "detail": "Human readable error message"
}

# HTTP Status codes used:
200 - Success
201 - Created
400 - Bad request (validation error)
401 - Unauthorized (no/invalid token)
403 - Forbidden (wrong user)
404 - Not found
409 - Conflict (duplicate email, etc.)
500 - Server error
```

### Frontend
```js
// Every API call has 3 states: loading, success, error
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// Errors shown as toast notifications or inline messages
// Network errors shown clearly with retry option
```

---

## 10. Performance Considerations

- Neo4j indexes on `id`, `email` fields (fast lookup)
- `/graph` endpoint limited to 200 nodes max (paginate if larger)
- Frontend graph re-renders only when data changes (useMemo)
- JWT validated once per request, not per query
- People list supports search/filter on frontend (no extra API call for simple filters)
- Pathfinding capped at 6 hops (prevents infinite traversal)
