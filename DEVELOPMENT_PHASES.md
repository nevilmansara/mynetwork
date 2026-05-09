# DEVELOPMENT_PHASES.md — MyNetwork

> Follow phases in order. Do not skip ahead.
> Update `CLAUDE.md → Section 11` when starting/completing each phase.

---

## Phase 0 — Prerequisites (Manual, not Claude Code)

Do these manually before starting development:

- [ ] Install Node.js 20+ from https://nodejs.org
- [ ] Install Python 3.11+ from https://python.org
- [ ] Install Docker Desktop from https://docker.com
- [ ] Install Claude Code: `npm install -g @anthropic/claude-code`
- [ ] Create project folder: `mkdir mynetwork && cd mynetwork`
- [ ] Initialize git: `git init`
- [ ] Copy all `.md` files into the `mynetwork/` folder

---

## Phase 1 — Project Skeleton

**Goal:** Get empty project structure running. No features yet.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Then:

1. Create the complete folder structure as defined in CLAUDE.md Section 3
2. Create the React frontend with Vite:
   - Run: npm create vite@latest frontend -- --template react
   - Install: tailwindcss, postcss, autoprefixer, react-router-dom, axios, react-force-graph
   - Configure Tailwind CSS
   - Create empty placeholder files for all components, pages, hooks, services listed in CLAUDE.md
   - Create src/utils/constants.js with OCCUPATION_COLORS from ARCHITECTURE.md
   
3. Create the Python backend:
   - Create backend/ with all folders: routers/, models/, services/, middleware/
   - Create requirements.txt with all packages from CLAUDE.md Section 2
   - Create .env.example with all variables from CLAUDE.md Section 9
   - Create empty placeholder files for all routers, models, services
   - Create main.py with basic FastAPI app (CORS enabled for localhost:3000 and localhost:5173)
   - Create database.py with Neo4j connection setup
   - Create config.py that reads from .env

4. Create docker/docker-compose.yml exactly as in ARCHITECTURE.md Section 8

5. Create README.md with setup instructions:
   - How to start Neo4j (docker-compose up)
   - How to start backend (uvicorn main:app --reload)
   - How to start frontend (npm run dev)

Do not implement any features. Just structure and config files.
```

**Done When:**
- [ ] `cd frontend && npm run dev` → shows blank Vite React page
- [ ] `cd backend && uvicorn main:app --reload` → server starts (may show DB error, that's ok)
- [ ] `cd docker && docker-compose up` → Neo4j starts, accessible at localhost:7474

---

## Phase 2 — Database Connection & Health Check

**Goal:** Backend connects to Neo4j, health endpoint works.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Then:

1. Complete database.py:
   - Use neo4j AsyncDriver
   - Connection pool with max 10 connections
   - Expose get_db() async context manager for use in services
   - On startup, create required indexes from ARCHITECTURE.md Section 4

2. Complete main.py:
   - Add startup event: connect to DB, create indexes
   - Add shutdown event: close DB connection
   - Add GET /health endpoint that:
     * Runs a test Neo4j query (RETURN 1)
     * Returns { "api": "ok", "database": "ok", "timestamp": "..." }
     * Returns { "api": "ok", "database": "error", "error": "..." } if DB fails

3. Update React frontend homepage (App.jsx or a temporary page) to:
   - Call GET /health on load
   - Display "API: Connected ✓" and "Database: Connected ✓" with green badges
   - Display errors in red if something fails

Refer to CLAUDE.md for env variable names and ARCHITECTURE.md for connection details.
```

**Done When:**
- [ ] `GET localhost:8000/health` returns `{ "api": "ok", "database": "ok" }`
- [ ] `GET localhost:8000/docs` shows FastAPI auto-docs page
- [ ] Frontend shows both green "connected" badges

---

## Phase 3 — Authentication

**Goal:** Users can register, login, and stay logged in.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Then implement authentication:

BACKEND:
1. models/user.py:
   - UserRegister: { name, email, password }
   - UserLogin: { email, password }
   - UserResponse: { id, name, email, my_person_id, created_at }
   - TokenResponse: { access_token, token_type, user: UserResponse }

2. services/auth_service.py:
   - register_user(data): 
     * Check email not already used
     * Hash password with bcrypt
     * Create User node in Neo4j
     * Create "self" Person node with is_self=true
     * Create OWNS relationship
     * Return user data
   - login_user(email, password):
     * Find User by email
     * Verify password
     * Generate JWT with { user_id, email, my_person_id }
     * Return token + user data

3. middleware/auth_middleware.py:
   - get_current_user() dependency:
     * Extract Bearer token from Authorization header
     * Decode and verify JWT
     * Return { user_id, email, my_person_id }
     * Raise 401 if invalid/expired

4. routers/auth.py:
   - POST /auth/register → calls auth_service.register_user
   - POST /auth/login → calls auth_service.login_user  
   - GET /auth/me → returns current user (protected)

FRONTEND:
5. context/AuthContext.jsx:
   - State: { user, token, isAuthenticated, loading }
   - Functions: login(), register(), logout()
   - On mount: check localStorage for token, validate with /auth/me
   - On login: save token to localStorage
   - On logout: clear localStorage

6. services/authService.js:
   - register(name, email, password)
   - login(email, password)
   - getMe()

7. services/api.js:
   - Create axios instance with baseURL from VITE_API_BASE_URL
   - Request interceptor: attach JWT token to every request
   - Response interceptor: redirect to /login on 401

8. pages/LoginPage.jsx:
   - Email + password form
   - Calls authService.login()
   - Redirects to /dashboard on success
   - Shows error message on failure
   - Link to register page

9. pages/RegisterPage.jsx:
   - Name + email + password + confirm password form
   - Calls authService.register()
   - Redirects to /dashboard on success
   - Shows error message on failure
   - Link to login page

10. App.jsx routing:
    - Public routes: /login, /register
    - Private routes (require auth): /dashboard, /people, /graph, /search
    - Redirect unauthenticated users to /login
    - Redirect authenticated users away from /login to /dashboard

Style all auth pages cleanly with Tailwind. Center the form card on screen.
```

**Done When:**
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] JWT stored in localStorage
- [ ] Protected routes redirect to /login if not authenticated
- [ ] /auth/me returns current user when logged in

---

## Phase 4 — People Management (CRUD)

**Goal:** Add, view, edit, delete people in the network.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Implement People CRUD:

BACKEND:
1. models/person.py:
   - PersonCreate: { name, email?, phone?, occupation?, company?, skills?: [], location?, notes?, photo_url? }
   - PersonUpdate: all fields optional
   - PersonResponse: all fields + id, created_at, updated_at, connections_count, is_self

2. services/people_service.py — implement all functions:
   - get_all_people(user_id): returns all Person nodes owned by user, include connections_count
   - get_person_by_id(person_id, user_id): returns single person (verify ownership)
   - create_person(data, user_id): creates Person node + OWNS relationship
   - update_person(person_id, data, user_id): updates Person node properties
   - delete_person(person_id, user_id): deletes Person node + all its KNOWS relationships
   - Always scope queries with OWNS relationship to ensure user isolation

3. routers/people.py:
   - GET /people → list all people
   - POST /people → create person
   - GET /people/{id} → get one person
   - PUT /people/{id} → update person
   - DELETE /people/{id} → delete person
   All routes protected with get_current_user dependency.

FRONTEND:
4. services/peopleService.js:
   - getAll(), getById(id), create(data), update(id, data), delete(id)

5. hooks/usePeople.js:
   - State: { people, loading, error }
   - loadPeople(), addPerson(data), editPerson(id, data), removePerson(id)

6. components/people/PersonForm.jsx:
   - Modal form for add/edit person
   - Fields: name (required), phone, email, occupation, company, skills (tag input), location, notes
   - Skills input: type a skill and press Enter to add as a tag, click × to remove
   - Validates required fields
   - Submit calls addPerson or editPerson

7. components/people/PersonCard.jsx:
   - Card showing: avatar (initials if no photo), name, occupation, company
   - Skills shown as colored badges
   - Click card → navigate to /people/:id
   - Edit button → opens PersonForm modal
   - Delete button → confirm dialog then delete

8. pages/PeoplePage.jsx:
   - Grid of PersonCard components
   - "Add Person" button (top right) → opens PersonForm
   - Search input to filter people by name/occupation/skill (frontend filter, no API call)
   - Empty state message when no people added yet
   - Loading skeleton while fetching

9. components/people/PersonProfile.jsx:
   - Full profile view: all person details
   - Editable via pencil icon → opens PersonForm
   - Shows skills as badges, all contact info
   - Section for connections (will be populated in Phase 5)

10. pages/PersonDetailPage.jsx:
    - Fetches person by ID from URL
    - Renders PersonProfile
    - Back button to /people

Make cards visually appealing with Tailwind. Use color-coded skill badges.
```

**Done When:**
- [ ] Can add a person with all fields
- [ ] Can edit a person
- [ ] Can delete a person
- [ ] People list shows all added people
- [ ] Search/filter works on people list
- [ ] Person detail page shows all info

---

## Phase 5 — Relationship Management

**Goal:** Connect people to each other with typed relationships.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Implement Connections/Relationships:

BACKEND:
1. models/connection.py:
   - ConnectionCreate: { person_a_id, person_b_id, relationship_type, since?, notes? }
   - ConnectionResponse: { id, person_a, person_b, relationship_type, since, notes, created_at }
   - relationship_type options: "friend", "colleague", "family", "mentor", "classmate", "other"

2. services/connection_service.py:
   - get_connections_for_person(person_id, user_id): 
     * Returns all people connected to this person
     * Include relationship details
   - get_all_connections(user_id):
     * Returns all KNOWS relationships for user's network
   - create_connection(data, user_id):
     * Verify both persons are owned by user
     * Check connection doesn't already exist
     * Create BIDIRECTIONAL KNOWS relationships (both directions)
     * Return connection data
   - delete_connection(person_a_id, person_b_id, user_id):
     * Delete both directions of KNOWS relationship

3. routers/connections.py:
   - GET /connections → all connections
   - POST /connections → create connection
   - DELETE /connections → delete connection (body: { person_a_id, person_b_id })
   - GET /people/{id}/connections → connections for specific person

FRONTEND:
4. services/connectionService.js:
   - getAll(), getForPerson(personId), create(data), delete(personAId, personBId)

5. hooks/useConnections.js:
   - State: { connections, loading, error }
   - loadConnections(), addConnection(data), removeConnection(a, b)

6. components/connections/ConnectionForm.jsx:
   - Modal form to add a connection
   - "Person A" dropdown (searchable, from people list)
   - "Person B" dropdown (searchable, from people list)
   - Relationship type selector (friend/colleague/family/mentor/classmate/other)
   - Optional: since (year input), notes (textarea)
   - Person A can be pre-filled when opened from a PersonDetailPage

7. components/connections/ConnectionList.jsx:
   - List of all connections for a person
   - Shows: avatar + name + relationship type badge + since year
   - Click on person in list → navigate to their profile
   - Remove connection button with confirm dialog

8. Update pages/PersonDetailPage.jsx:
   - Add ConnectionList component showing person's connections
   - "Add Connection" button to open ConnectionForm with person pre-filled as Person A
   - Connection count displayed in profile header

9. Update context/NetworkContext.jsx:
   - Combine people and connections state
   - Build graphData from people + connections:
     nodes: people.map(p => ({ id: p.id, name: p.name, occupation: p.occupation, skills: p.skills, val: p.connections_count + 1 }))
     links: connections.map(c => ({ source: c.person_a.id, target: c.person_b.id, type: c.relationship_type }))
```

**Done When:**
- [ ] Can connect two people together
- [ ] Can see all connections on a person's profile
- [ ] Can remove a connection
- [ ] Connections are bidirectional (shown on both profiles)

---

## Phase 6 — Visual Graph

**Goal:** Interactive network visualization using react-force-graph.

**Claude Code Prompt:**
```
Read CLAUDE.md and ARCHITECTURE.md fully. Implement visual graph:

BACKEND:
1. Add GET /graph endpoint to a new routers/graph.py:
   - Returns all nodes and links in react-force-graph format (see ARCHITECTURE.md Section 7)
   - Node: { id, name, occupation, company, skills, connections_count, is_self }
   - Link: { source, target, type }
   - Scoped to current user's network only
   - Add router to main.py

FRONTEND:
2. components/graph/NetworkGraph.jsx:
   Main graph component using ForceGraph2D from react-force-graph:
   
   - Load graph data from /graph endpoint
   - Node styling:
     * Color based on occupation (use OCCUPATION_COLORS from constants.js)
     * Size based on connections_count (min 4, max 12)
     * Label showing person's name
     * User's "self" node styled differently (larger, gold color)
   
   - Link styling:
     * Color based on relationship type:
       - friend: #10B981 (green)
       - colleague: #3B82F6 (blue)  
       - family: #F97316 (orange)
       - mentor: #A855F7 (purple)
       - other: #6B7280 (gray)
     * Curved links with slight curvature
   
   - Interactions:
     * Click node → show PersonProfilePanel on right side
     * Hover node → highlight its direct connections, dim others to 20% opacity
     * Hover off → restore all to full opacity
     * Double-click background → deselect, clear panel
   
   - Highlighted path mode:
     * Accept highlightedPath prop (array of person IDs)
     * Nodes in path: bright orange (#F97316)
     * Links between path nodes: bright orange, thicker
     * Non-path nodes: dimmed

3. components/graph/GraphControls.jsx:
   - Zoom In / Zoom Out buttons
   - "Center" button (reset zoom/pan to fit all nodes)
   - "Refresh" button (re-fetch graph data)
   - Toggle: Show Labels / Hide Labels
   - Color legend (show occupation → color mapping)

4. A side panel component for when a node is clicked:
   - Slides in from right
   - Shows person name, occupation, company, skills
   - "View Profile" link → /people/:id
   - "Add Connection" button
   - Close button (×)

5. pages/GraphPage.jsx:
   - Full-screen graph (use 100% height)
   - GraphControls floating top-left
   - Side panel for selected node (right side)
   - Loading spinner while graph data loads
   - Empty state if no people added yet

Make the graph visually impressive. Dark background (#111827) for the graph area.
```

**Done When:**
- [ ] Graph shows all people as nodes
- [ ] Graph shows connections as edges
- [ ] Clicking a node shows their profile panel
- [ ] Hovering highlights connections
- [ ] Color coding by occupation works

---

## Phase 7 — Search & Pathfinding

**Goal:** Find people by skill and show path to reach them.

**Claude Code Prompt:**
```
Read CLAUDE.md and ARCHITECTURE.md fully. Implement search and pathfinding:

BACKEND:
1. services/search_service.py:
   
   - search_people(query, user_id):
     * Search across name, occupation, skills, company
     * Case-insensitive
     * Returns list of matching Person nodes
   
   - find_paths(skill_query, user_id, my_person_id):
     * Find all people matching the skill in user's network
     * For each matching person, find shortestPath from my_person_id
     * Use Neo4j shortestPath() with max 6 hops
     * Return list of { person, path: [list of person names/ids], hops }
     * Sort by fewest hops first
     * If a match IS the self node, hops = 0, path = ["You"]

2. routers/search.py:
   - GET /search?q=query → simple people search, returns PersonResponse list
   - GET /search/paths?skill=query → pathfinding search, returns path results

FRONTEND:
3. services/searchService.js:
   - searchPeople(query)
   - findPaths(skill)

4. hooks/useSearch.js:
   - State: { results, pathResults, loading, error, searchType }
   - search(query), findPaths(skill), clear()

5. components/search/SearchBar.jsx:
   - Large search input with placeholder "Search by name, skill, or occupation..."
   - Two mode buttons: "Find People" | "Find Path"  
   - "Find People" mode: simple search, shows matching people
   - "Find Path" mode: pathfinding, shows connection paths
   - Clear button (×) to reset results
   - Search as you type (debounced 400ms)

6. A PathResult component showing one pathfinding result:
   - Person's name, occupation, skills (highlighted match)
   - Visual path display: 
     You ──► [Person A] ──► [Person B] ──► [Target Person ✓]
     (each step shows name, hoverable to see details)
   - "Highlight on Graph" button → navigates to /graph with path highlighted
   - "X hops away" badge

7. pages/SearchPage.jsx:
   - SearchBar at top
   - "Find People" results: grid of PersonCard components
   - "Find Path" results: list of PathResult components
   - "No results" state with helpful message
   - Loading state while searching

8. Update GraphPage to accept URL params:
   - If URL has ?highlight=id1,id2,id3 → highlight that path on load
   - "Highlight on Graph" button from SearchPage adds these params
```

**Done When:**
- [ ] Search by name returns correct people
- [ ] Search by skill returns people with that skill
- [ ] Path search shows shortest path from self to skill
- [ ] Path highlighted on graph when "View on Graph" clicked
- [ ] Results sorted by shortest path

---

## Phase 8 — Dashboard & Polish

**Goal:** Professional home screen + UX polish.

**Claude Code Prompt:**
```
Read CLAUDE.md fully. Implement dashboard and polish the app:

1. pages/DashboardPage.jsx — Stats dashboard:
   Stats cards row:
   - Total People in Network
   - Total Connections
   - Most Connected Person (highest connection count)
   - Unique Skills in Network (count of distinct skills)
   
   Quick Actions:
   - "Add Person" button
   - "View Network Graph" button
   - "Search Skills" button
   
   Recent Activity section:
   - Last 5 people added (with timestamp)
   
   Mini graph preview:
   - Small version of NetworkGraph (non-interactive, just visual)
   - "Open Full Graph" link

2. Layout improvements:
   - Navbar: app logo + nav links (Dashboard, People, Graph, Search) + user avatar/name + logout
   - Active nav link highlighted
   - Responsive: hamburger menu on mobile

3. Empty states for all pages:
   - /people with 0 people: Illustration + "Add your first contact" button
   - /graph with 0 people: "Your network is empty" message
   - /search with no results: "No one found with that skill"

4. Loading states:
   - Skeleton cards on PeoplePage while loading
   - Spinner overlay on forms while submitting
   - Graph loading animation

5. Toast notifications:
   - Success: "Person added!", "Connection created!", "Person deleted"
   - Error: show API error message
   - Use a simple toast system (react-hot-toast or build minimal custom one)

6. Confirmation dialogs:
   - Before deleting a person: "Delete [Name]? This will remove all their connections too."
   - Before removing a connection: "Remove connection between [A] and [B]?"

7. Profile completeness indicator on PersonCard:
   - Small progress bar or percentage showing how complete the profile is
   - Based on: name, email, phone, occupation, company, skills, photo all filled in

8. Skills overview page or section:
   - List of all unique skills across your network
   - Click a skill → shows all people with that skill
```

**Done When:**
- [ ] Dashboard shows network stats
- [ ] All empty states look good
- [ ] Toast notifications work
- [ ] App feels polished and professional

---

## Phase 9 — CSV Import & Export (Optional)

**Claude Code Prompt:**
```
Add import/export functionality:

1. Export:
   - GET /export/people → returns CSV of all people
   - GET /export/connections → returns CSV of all connections
   - "Export" button in PeoplePage downloads the CSV

2. Import:
   - POST /import/people with CSV file upload
   - Parse CSV: name, email, phone, occupation, company, skills (semicolon-separated)
   - Creates Person nodes for each row
   - Returns { imported: N, errors: [...] }
   - "Import CSV" button in PeoplePage with file picker
   - Show import results in a modal
   - Provide downloadable CSV template
```

---

## Phase 10 — Docker Everything (Optional)

**Claude Code Prompt:**
```
Dockerize the full application for easy deployment:

1. backend/Dockerfile
2. frontend/Dockerfile  
3. Update docker/docker-compose.yml to include all 3 services:
   - neo4j (existing)
   - backend (FastAPI)
   - frontend (Nginx serving built React)
4. Add .dockerignore files
5. Update README.md with Docker instructions:
   docker-compose up --build
   → App available at localhost:3000
   → API at localhost:8000
   → Neo4j browser at localhost:7474
```

---

## Quick Reference — Start Each Phase

Before starting any phase, tell Claude Code:
```
Read CLAUDE.md fully. We are now working on Phase [N]: [Phase Name].
[Paste the prompt from that phase above]
```
