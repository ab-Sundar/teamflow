# Teamflow

Teamflow is a production-style, real-time project management application inspired by tools such as Trello.

It was built as a full-stack learning and portfolio project using the PERN stack, with additional focus on real-time communication, caching, authorization, database performance, Docker containerization, and production hardening.

## Live Demo

[Open Teamflow](https://teamflow-whck.onrender.com/)

Trello like application
---

## Features

### Authentication

- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Authenticated Socket.IO connections

### Workspaces

- Create workspaces
- View user workspaces
- Workspace membership management
- Role-based access control

### Role-Based Access Control

Teamflow supports four workspace roles:

- `owner`
- `admin`
- `member`
- `viewer`

Permissions are enforced on the backend rather than relying only on frontend visibility.

### Boards

- Create boards
- View workspace boards
- Rename boards
- Delete boards
- Redis caching for workspace board lists

### Lists

- Create lists
- Rename lists
- Delete lists
- Position-based ordering

### Cards

- Create cards
- Edit cards
- Delete cards
- Assign cards to workspace members
- Add due dates
- Move cards within a list
- Move cards between lists
- Drag-and-drop interface

### Comments

- Add comments to cards
- Delete comments
- Real-time comment updates

### Real-Time Collaboration

Socket.IO is used to synchronize changes between connected clients.

Real-time events include:

- Board changes
- List changes
- Card creation
- Card updates
- Card deletion
- Card movement
- Assignee updates
- Due-date updates
- Comment changes
- Workspace member changes

The Socket.IO Redis adapter allows events to work across multiple backend instances.

---

## Tech Stack

### Frontend

- React 19
- Vite 8
- React Router
- Axios
- Socket.IO Client
- dnd-kit
- CSS

### Backend

- Node.js
- Express 5
- PostgreSQL
- `pg`
- Redis
- Socket.IO
- JWT
- bcrypt
- Helmet
- CORS
- Express Rate Limit

### Infrastructure

- Docker
- Docker Compose
- Nginx
- PostgreSQL Docker image
- Redis Docker image

---

## Architecture

```text
Browser
   |
   v
Nginx / React
Port 8080
   |
   +-----------------------------+
   |                             |
   | /api                        | /socket.io
   v                             v
Express Backend + Socket.IO
Port 3000
   |
   +-------------------+
   |                   |
   v                   v
PostgreSQL           Redis
Port 5432            Port 6379
```

Only the Nginx frontend container is exposed publicly in the Docker setup.

The backend, PostgreSQL, and Redis communicate through Docker's internal network.

---

## Project Structure

```text
teamflow/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── test/
│   ├── Dockerfile
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── teamflow_schema.sql
├── .gitignore
└── README.md
```

---

## PostgreSQL Design

The application uses PostgreSQL for persistent application data.

Main tables include:

```text
users
workspaces
workspace_members
boards
lists
cards
comments
activities
```

Foreign-key constraints and delete behaviors are used to maintain relational integrity.

Database performance work included:

- Index creation
- Query-plan analysis
- `EXPLAIN`
- `EXPLAIN ANALYZE`
- Buffer inspection
- Query execution-time analysis
- Pagination strategy review
- Position-based ordering

---

## Redis Caching

Redis is used to cache workspace board lists.

Example cache key:

```text
workspace:{workspaceId}:boards
```

The cache uses a TTL of approximately:

```text
60 seconds
```

Cache invalidation occurs when a board is:

- created
- updated
- deleted

If cache reads fail, PostgreSQL remains the source of truth.

Redis is also used by the Socket.IO Redis adapter for real-time scaling.

---

## Real-Time Architecture

Socket.IO connections are authenticated using JWT.

Users join workspace-specific Socket.IO rooms only after the backend verifies that they belong to the requested workspace.

Example concept:

```text
User
 |
 | JWT authentication
 v
Socket.IO Server
 |
 | Workspace membership verification
 v
workspace:{workspaceId} room
```

This prevents authenticated users from joining arbitrary workspace rooms.

---

## Drag and Drop

Card drag-and-drop is implemented using dnd-kit.

Supported operations include:

- reorder cards within the same list
- move cards across lists
- move cards into empty lists

The frontend updates its local state immediately and persists the final card position through the backend API.

---

## Security

Production-hardening measures include:

- Helmet HTTP security headers
- CORS restrictions
- JWT authentication
- Backend RBAC enforcement
- Auth endpoint rate limiting
- Request-body size limiting
- Environment-variable validation
- Centralized error handling
- Safe production error responses
- Internal Docker networking
- Redis and PostgreSQL not exposed publicly
- Socket.IO authentication
- Workspace membership checks before joining Socket.IO rooms

---

## Environment Variables

Create:

```text
server/.env
```

using:

```text
server/.env.example
```

as a reference.

Example:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=teamflow
DB_USER=postgres
DB_PASSWORD=your_database_password

REDIS_URL=redis://localhost:6379

JWT_SECRET=replace_with_a_long_random_secret

CLIENT_ORIGIN=http://localhost:5173
```

Never commit real `.env` files or production secrets.

---

## Frontend Environment Variables

For local Vite development, create:

```text
client/.env
```

with:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

When running through Docker and Nginx, the frontend uses same-origin routing:

```text
/api
/socket.io
```

---

## Local Development

### Requirements

Install:

- Node.js
- PostgreSQL
- Redis
- npm

### Backend

```bash
cd server
npm install
npm run dev
```

The backend runs by default on:

```text
http://localhost:3000
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

---

## Docker

The entire application can be started using Docker Compose.

From the project root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8080
```

The Docker stack contains:

```text
teamflow-frontend
teamflow-backend
teamflow-postgres
teamflow-redis
```

Check container status:

```bash
docker compose ps
```

The backend, PostgreSQL, and Redis containers include health checks.

Stop the stack with:

```bash
docker compose down
```

---

## API Overview

The backend follows a REST-style architecture.

Main API areas include:

```text
/api/auth
/api/workspaces
/api/workspaces/:workspaceId/boards
/api/boards
/api/lists
```

The API supports authentication, workspace membership, boards, lists, cards, comments, card assignment, due dates, and activity-related operations.

Authorization middleware protects operations based on workspace roles.

---

## Production Error Handling

Unknown API routes return a JSON `404` response.

Example:

```json
{
  "message": "Route not found"
}
```

Unexpected production errors return safe responses without exposing internal stack traces.

The frontend also provides a dedicated `404` page for invalid application routes.

---

## Performance

Several performance-related techniques are used throughout the project:

- PostgreSQL indexing
- Query-plan analysis
- Redis caching
- TTL-based cache expiration
- Cache invalidation
- Cursor-pagination analysis
- Efficient React state updates
- Optimistic drag-and-drop updates
- Socket.IO rooms
- Redis-backed Socket.IO adapter
- Multi-stage frontend Docker build
- Nginx static-file serving

---

## Current Docker Production Flow

```text
Client
   |
   v
Nginx
   |
   +------ React static files
   |
   +------ /api --------> Express
   |
   +------ /socket.io --> Socket.IO
                            |
                   +--------+--------+
                   |                 |
                   v                 v
              PostgreSQL          Redis
```
---
## Deployment

Teamflow is deployed using:

- Frontend: Render Static Site
- Backend: Render Web Service
- PostgreSQL: Neon
- Redis: Upstash
---

## Learning Goals

This project was built to practice production-style full-stack development beyond basic CRUD.

The project covers:

- full-stack React and Node.js development
- REST API design
- relational database design
- authentication
- authorization
- PostgreSQL performance optimization
- Redis caching
- real-time WebSocket communication
- drag-and-drop UI
- Docker containerization
- Nginx reverse proxying
- security hardening
- production configuration

---

## Future Improvements

Possible future enhancements include:

- email invitations
- password reset
- workspace update/delete features
- file attachments
- notifications
- search
- activity timeline UI
- automated tests
- CI/CD pipeline
- cloud deployment
- horizontal backend scaling
- richer monitoring and observability

---

## Author

Built as a full-stack development portfolio project.

GitHub:

```text
https://github.com/ab-Sundar
```

---

## License

This project is intended primarily for learning and portfolio demonstration.