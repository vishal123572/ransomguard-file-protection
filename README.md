# Ransomware Detection and File Protection System

The login page can display public trainer demo access when `VITE_DEMO_ADMIN_EMAIL` and `VITE_DEMO_ADMIN_PASSWORD` are supplied at build time. These values are intentionally visible to site visitors. Local values belong in the ignored `frontend/.env.local` file.

Harmless upload samples are available in `frontend/public/test-files`: `trainer-ransom-demo.locked` produces a HIGH_RISK filename result (95/100), and `normal-notes.txt` produces CLEAN (0/100). Both contain plain text only.

RansomGuard is a React and Spring Boot application for safe file-risk checks and ransomware prevention tasks. Employees upload files for non-executing heuristic analysis, view their results, and complete assigned tasks. Administrators manage users, review file-risk reports, assign and approve tasks, and inspect the application's MySQL tables.

## Live application

- Frontend: https://cybershield-workspace.vercel.app/login
- Backend database dashboard: https://cybershield-api-production-9275.up.railway.app/database
- Backend health endpoint: https://cybershield-api-production-9275.up.railway.app/api/health

Users can register through the frontend. The database dashboard requires an administrator account. Production login details and secrets are not included in this repository.

## Source code

- `frontend/`: React workspace, file checks, prevention tasks, user management, and database console.
- `backend/`: Spring Boot API, JWT authentication, BCrypt password hashing, role-based access, file analysis, and MySQL persistence.
- `PROJECT_DESCRIPTION.md`: Project overview.

The frontend is deployed on Vercel and connects to the backend on Railway. The backend also serves a bundled copy of the React database console. The application uses the existing project dependencies and has no AI API requirement.

## Run locally

Requirements: Node.js compatible with the project's Vite version, Java 21, Maven, and MySQL.

Configure the backend environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | JDBC MySQL connection URL; default is `jdbc:mysql://localhost:3306/cybershield_app`. |
| `MYSQLUSER` | MySQL username. |
| `MYSQLPASSWORD` | MySQL password. |
| `JWT_SECRET` | A private JWT signing secret containing at least 32 bytes. |
| `CORS_ORIGINS` | Allowed frontend origins; default is `http://localhost:5173`. |
| `ADMIN_EMAIL` | Optional administrator email for initial setup. |
| `ADMIN_PASSWORD` | Optional administrator password for initial setup. |
| `ADMIN_NAME` | Administrator display name. |
| `PORT` | API port; default is `8080`. |

Start the backend:

```sh
cd backend
mvn spring-boot:run
```

Start the frontend in another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Use `VITE_API_URL=http://localhost:8080/api` for the local frontend. An example is provided in `frontend/.env.example`.

## Build and verify

```sh
cd frontend
npm run lint
npm run build:backend
```

`build:backend` builds the React UI and copies it into Spring Boot's static resources for the backend dashboard.

```sh
cd backend
mvn test
mvn package
```

Deploy `frontend/` to Vercel with `VITE_API_URL` set to the backend's `/api` URL. Deploy `backend/` to Railway using its Dockerfile and configure the database and authentication environment variables there.

## File-check scope

File checks examine metadata, file types, fingerprints, and heuristic risk signals without executing or retaining uploads. Results are not a definitive malware diagnosis. A quarantine review records an administrative decision and does not isolate files on a user's device. Continuous device protection requires endpoint security software.

The read-only database console is restricted to administrators. It displays stored BCrypt hashes in the users table while masking other credential and token fields. JWTs are generated on login and are not stored as passwords.
