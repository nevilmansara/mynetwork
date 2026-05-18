# CLAUDE.md — MyNetwork Project

> This file is the single source of truth for Claude Code.
> Read this entire file before writing any code, creating any file, or making any decision.

---

## 1. What Is This Project?

**MyNetwork** is a visual people-network manager web app.

Users can:
- Add people (contacts) with details like name, phone, occupation, skills, etc.
- Connect people to each other (A knows B, B knows C)
- Visualize the entire network as an **interactive graph** (nodes = people, edges = relationships)
- **Search by skill/occupation** and find the shortest path to reach that person through the network
- Example: User searches "UI Designer" → App shows: You → Raj → Priya (UI Designer)

This is designed for **non-technical users**. No SQL queries, no CLI. Everything through UI.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 18.x |
| Frontend Build | Vite | 5.x |
| Frontend Styling | Tailwind CSS | 3.x |
| Graph Visualization | react-force-graph | latest |
| HTTP Client | Axios | 1.x |
| Routing | react-router-dom | 6.x |
| State Management | React Context + useState | built-in |
| Backend | Python FastAPI | 0.110+ |
| Backend Server | Uvicorn | latest |
| Database | Neo4j Community Edition | 5.x |
| Neo4j Python Driver | neo4j | 5.x |
| Auth | JWT (python-jose) | latest |
| Password Hashing | passlib + bcrypt | latest |
| Environment | python-dotenv | latest |
| Local DB Setup | Docker + docker-compose | latest |

---

## 3. Project Folder Structure

```
mynetwork/
├── CLAUDE.md                    ← This file (always read first)
├── ARCHITECTURE.md              ← System architecture details
├── DEVELOPMENT_PHASES.md        ← Phase-wise dev plan
├── API_SPEC.md                  ← All API endpoints documented
├── README.md                    ← Setup and run instructions
│
├── frontend/                    ← React app (Vite)
│   ├── public/
│   ├── src/
│   │   ├── main.jsx             ← Entry point
│   │   ├── App.jsx              ← Root component + routing
│   │   ├── index.css            ← Global styles + Tailwind
│   │   │
│   │   ├── pages/               ← Full page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PeoplePage.jsx
│   │   │   ├── PersonDetailPage.jsx
│   │   │   ├── GraphPage.jsx
│   │   │   └── SearchPage.jsx
│   │   │
│   │   ├── components/          ← Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── people/
│   │   │   │   ├── PersonCard.jsx
│   │   │   │   ├── PersonForm.jsx
│   │   │   │   └── PersonProfile.jsx
│   │   │   ├── graph/
│   │   │   │   ├── NetworkGraph.jsx
│   │   │   │   └── GraphControls.jsx
│   │   │   ├── connections/
│   │   │   │   ├── ConnectionForm.jsx
│   │   │   │   └── ConnectionList.jsx
│   │   │   ├── search/
│   │   │   │   └── SearchBar.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Input.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   ├── context/             ← React Context for global state
│   │   │   ├── AuthContext.jsx  ← User auth state
│   │   │   └── NetworkContext.jsx ← People + connections state
│   │   │
│   │   ├── hooks/               ← Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── usePeople.js
│   │   │   ├── useConnections.js
│   │   │   └── useSearch.js
│   │   │
│   │   ├── services/            ← API call functions (axios)
│   │   │   ├── api.js           ← Axios instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── peopleService.js
│   │   │   ├── connectionService.js
│   │   │   └── searchService.js
│   │   │
│   │   └── utils/               ← Helper functions
│   │       ├── graphHelpers.js  ← Transform API data → graph format
│   │       └── constants.js     ← App-wide constants
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     ← Python FastAPI app
│   ├── main.py                  ← FastAPI app entry point
│   ├── database.py              ← Neo4j connection + session
│   ├── config.py                ← Settings from .env
│   ├── requirements.txt
│   ├── .env                     ← Environment variables (never commit)
│   ├── .env.example             ← Template (safe to commit)
│   │
│   ├── routers/                 ← API route handlers
│   │   ├── auth.py              ← /auth/register, /auth/login
│   │   ├── people.py            ← /people CRUD
│   │   ├── connections.py       ← /connections CRUD
│   │   └── search.py            ← /search endpoints
│   │
│   ├── models/                  ← Pydantic models (request/response schemas)
│   │   ├── user.py
│   │   ├── person.py
│   │   └── connection.py
│   │
│   ├── services/                ← Business logic layer
│   │   ├── auth_service.py
│   │   ├── people_service.py
│   │   ├── connection_service.py
│   │   └── search_service.py
│   │
│   └── middleware/
│       └── auth_middleware.py   ← JWT token verification
│
└── docker/
    ├── docker-compose.yml       ← Neo4j local setup
    └── neo4j.conf               ← Neo4j config (optional)
```

---

## 4. Database Design (Neo4j Graph)

### Node Types

#### `User` Node
Represents a registered app user.
```
(u:User {
  id: "uuid",
  email: "user@email.com",
  password_hash: "bcrypt_hash",
  name: "Full Name",
  created_at: "ISO datetime"
})
```

#### `Person` Node
Represents a contact/person in the network.
```
(p:Person {
  id: "uuid",
  name: "Full Name",
  email: "email",
  phone: "phone number",
  occupation: "Job Title",
  company: "Company Name",
  skills: ["UI Design", "React", "Python"],   ← list of strings
  location: "City, Country",
  notes: "Free text notes",
  photo_url: "url or null",
  created_at: "ISO datetime",
  updated_at: "ISO datetime"
})
```

### Relationship Types

#### `OWNS` — User owns a Person node
```
(user:User)-[:OWNS]->(person:Person)
```
This ensures each user only sees their own network.

#### `KNOWS` — Person knows another Person
```
(person1:Person)-[:KNOWS {
  relationship_type: "friend|colleague|family|mentor|other",
  since: "year or date (optional)",
  notes: "how they met (optional)",
  created_at: "ISO datetime"
}]->(person2:Person)
```
**Important:** KNOWS is stored as bidirectional.
When adding A KNOWS B, create both:
- `(A)-[:KNOWS]->(B)`
- `(B)-[:KNOWS]->(A)`

### Key Neo4j Queries

**Get all people for a user:**
```cypher
MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
RETURN p
```

**Get connections of a person:**
```cypher
MATCH (p:Person {id: $person_id})-[:KNOWS]-(connected:Person)
RETURN connected
```

**Find path from user's "self" node to a person with skill:**
```cypher
MATCH path = shortestPath(
  (start:Person {id: $my_person_id})-[:KNOWS*1..6]-(target:Person)
)
WHERE $skill IN target.skills OR target.occupation CONTAINS $skill
RETURN path, target
ORDER BY length(path)
```

**Search people by skill in user's network:**
```cypher
MATCH (u:User {id: $user_id})-[:OWNS]->(p:Person)
WHERE $skill IN p.skills 
   OR toLower(p.occupation) CONTAINS toLower($skill)
   OR toLower(p.name) CONTAINS toLower($skill)
RETURN p
```

---

## 5. API Design Summary

Base URL: `http://localhost:8080` (port 8000 is reserved by Windows on this machine)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login, get JWT token | No |
| GET | `/auth/me` | Get current user | Yes |
| GET | `/people` | List all people in network | Yes |
| POST | `/people` | Add a new person | Yes |
| GET | `/people/{id}` | Get person by ID | Yes |
| PUT | `/people/{id}` | Update person | Yes |
| DELETE | `/people/{id}` | Delete person | Yes |
| GET | `/people/{id}/connections` | Get a person's connections | Yes |
| GET | `/connections` | List all connections | Yes |
| POST | `/connections` | Create connection between two people | Yes |
| DELETE | `/connections/{id}` | Remove a connection | Yes |
| GET | `/graph` | Get full graph data (all nodes + edges) | Yes |
| GET | `/search?q=skill` | Search people by skill/occupation | Yes |
| GET | `/search/path?from={id}&skill={skill}` | Find shortest path to a skill | Yes |
| GET | `/health` | Health check | No |

Full details in `API_SPEC.md`.

---

## 6. Authentication Flow

1. User registers → password hashed with bcrypt → `User` node created in Neo4j
2. User logs in → password verified → JWT token returned (expires in 24h)
3. Frontend stores JWT in `localStorage`
4. Every API request includes header: `Authorization: Bearer <token>`
5. Backend middleware verifies token on every protected route
6. Token contains: `user_id`, `email`, `exp`

### "Self" Person Node
When a user registers, a special `Person` node is auto-created for them (representing themselves in the graph). This is the **starting point for all pathfinding queries**.

---

## 7. Frontend State Management

### AuthContext
```js
{
  user: { id, name, email, my_person_id },
  token: "jwt_string",
  isAuthenticated: true/false,
  login(email, password),
  logout(),
  register(name, email, password)
}
```

### NetworkContext
```js
{
  people: [...],          // All people in network
  connections: [...],     // All connections
  graphData: {            // react-force-graph format
    nodes: [...],
    links: [...]
  },
  loadNetwork(),          // Fetch all data
  addPerson(data),
  updatePerson(id, data),
  deletePerson(id),
  addConnection(data),
  deleteConnection(id)
}
```

---

## 8. Graph Visualization (react-force-graph)

Data format required by `react-force-graph`:
```js
{
  nodes: [
    { id: "uuid", name: "Raj", occupation: "Designer", skills: [...], val: 3 }
  ],
  links: [
    { source: "uuid1", target: "uuid2", type: "colleague" }
  ]
}
```

The `/graph` API endpoint returns data in exactly this format.

### Graph Features to Implement
- Node color based on occupation category
- Node size based on number of connections
- Edge color based on relationship type
- Click node → opens person profile panel on right
- Hover node → highlights direct connections, dims others
- Search highlight → highlights path nodes in yellow/orange
- Controls: zoom in/out, reset view, toggle labels

---

## 9. Environment Variables

### Backend `.env`
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=mynetwork123
JWT_SECRET=your-super-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 10. Coding Rules & Conventions

### General
- Always read this file before starting any task
- Build one phase at a time — do not skip ahead
- Ask for clarification if requirements are ambiguous
- Never store passwords in plain text
- **Never run any git command (commit, push, branch, reset, etc.) unless the user explicitly asks you to**

### Python (Backend)
- Use `async` functions in FastAPI routes
- Use Pydantic models for all request/response validation
- All Neo4j queries go in `services/` layer, NOT in routers
- Return consistent error responses: `{ "detail": "error message" }`
- Use type hints everywhere
- Log errors with Python's `logging` module

### React (Frontend)
- Functional components only, no class components
- Use custom hooks for all data fetching
- Keep components small and focused
- Use Tailwind classes only — no inline styles
- All API calls go through `services/` layer only
- Handle loading and error states for every async operation
- Use meaningful variable names

### Neo4j
- Always scope queries by `user_id` for data isolation
- Use parameterized queries (never string concatenation)
- Index on: `Person.id`, `User.id`, `User.email`

---

## 11. Current Phase

> **UPDATE THIS SECTION** when starting each new phase.

**Current Phase:** Phase 6 — Graph Visualization (Complete)  
**Last Completed:** connectionService.getGraph(), NetworkContext loadGraphData + graph refresh on addConnection/deleteConnection, graphHelpers (getNodeColor/getLinkColor/getNodeRadius with rgba), GraphControls (zoom in/out/fit/labels toggle), NetworkGraph (ForceGraph2D, custom canvas node rendering, hover highlight with neighbor dimming, self-node ring, responsive resize), GraphPage (graph + side panel on node click, legend, node/connection count badge)  
**Next Task:** Phase 7 — Search & Pathfinding (search by skill/occupation, shortest path visualization)

---

## 12. Known Decisions & Reasons

| Decision | Reason |
|---|---|
| Neo4j over MongoDB/PostgreSQL | Native graph DB — pathfinding is built-in, not hacked |
| FastAPI over Flask | Async support, automatic docs, Pydantic validation built-in |
| Vite over CRA | Much faster builds and HMR |
| JWT in localStorage | Simpler for this app — not handling extremely sensitive data |
| Bidirectional KNOWS edges | Real-world: if A knows B, B knows A |
| User has a "self" Person node | Makes pathfinding natural: "how do I reach X from me" |
