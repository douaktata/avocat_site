# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JurisHub is a Law Firm Management System (Cabinet d'Avocats) with a Spring Boot 3.2.0 REST API backend (Java 17) and a React 19 + Vite frontend. It manages cases, appointments, documents, users, payments, tasks, and more for a law office.

## Build & Run Commands

### Backend (Spring Boot)

```bash
./mvnw clean install           # Full build
./mvnw spring-boot:run         # Run the application (port 8081)
./mvnw test                    # Run tests
./mvnw test -Dtest=ClassName   # Run a single test class
./mvnw test -Dtest=ClassName#methodName  # Run a single test method
```

On Windows, use `mvnw.cmd` instead of `./mvnw`.

### Frontend (React + Vite)

```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Dev server (default port 5173)
npm run build                  # Production build
npm run lint                   # ESLint
```

## Database

MySQL on localhost:3306, database `jurishub`, user `root` with no password. Schema is auto-managed by Hibernate (`ddl-auto=update`). Roles are seeded via `src/main/resources/import.sql` on startup.

## Architecture

### Backend

Standard Spring layered REST API:

```
Controller (@RestController) -> Service (optional) or Repository (Spring Data JPA) -> MySQL
```

**Key architectural decisions:**

- **Flat DTO pattern**: All API responses use flat DTOs with no nested objects. Foreign key IDs and denormalized fields (e.g., `client_full_name`, `case_number`) are included directly. See `FLAT_DTO_ARCHITECTURE.md` for details.
- **Static mapper methods**: Most DTOs have a `public static XyzDTO fromEntity(Entity e)` factory method. AppointmentMapper lives in `dto/`, while PresenceJournalMapper lives in `mapper/`.
- **Inconsistent service layer**: Some controllers call repositories directly; others (Task, Payment, PhoneCall, PresenceJournal) go through a service class. Follow the existing pattern for the entity you're modifying.
- **Mixed Lombok**: Some entities use `@Data`, others have manual getters/setters.
- **Entity ID naming**: Every entity uses a 3-letter abbreviation: `idc` (Case), `idn` (CaseNote), `idd` (Document), `idt` (Trial), `ida` (Appointment), `idu` (User), `id` (Payment, Task, PhoneCall). Always check the DTO class.
- **French entity fields**: User entity field names are in French (`nom`, `prenom`, `adresse`, `CIN`, `tel`, `date_naissance`).

### Frontend

React 19 SPA in `frontend/` using Vite, axios, and react-router-dom. API base URL is `http://localhost:8081`. JWT token stored in localStorage, attached via axios interceptor in `frontend/src/api.js`. Auth state managed through `AuthContext.jsx`.

## Authentication & Security

JWT-based stateless auth using `jjwt` 0.12.3. Bearer token in `Authorization` header, 24h expiration. BCrypt for passwords. Security classes are in `src/main/java/.../security/` and config in `src/main/java/.../config/SecurityConfig.java`.

- Public endpoints: `POST /auth/login`, `POST /auth/register`
- Role-based access: `ADMINISTRATEUR` (full access), `SECRETAIRE`, `AVOCAT`, `STAGIAIRE`, `CLIENT`
- CORS uses `setAllowedOriginPatterns("http://localhost:*")` — any localhost port is allowed

## Package Structure (under `com.example.monpremiersite`)

| Package | Purpose |
|---|---|
| `config/` | Spring Security & CORS configuration |
| `controller/` | REST controllers (17 total, including AuthController) |
| `dto/` | Flat DTOs with `fromEntity()` static mappers + AppointmentMapper |
| `entities/` | JPA entities |
| `mapper/` | Dedicated mapper class (PresenceJournalMapper) |
| `repository/` | Spring Data JPA repositories |
| `security/` | JWT utilities, filters, UserDetails implementation |
| `service/` | Service layer (only for Task, Payment, PhoneCall, PresenceJournal) |

## Authentication Response

`POST /auth/login` returns `{ token, idu, email, nom, prenom, roles[] }`. `AuthContext` persists this object in localStorage under both `token` and `user` keys. Roles can be a string or an array — the frontend defensively handles both.

No token refresh logic exists: expired JWTs return 401 but the frontend does not auto-logout.

## Notes

- The `avocat_site/` directory is a legacy snapshot and should be ignored.
- A Java 17 -> 21 upgrade is in progress on branch `appmod/java-upgrade-20260218075430` using OpenRewrite (`rewrite.yml`).
- All tests in the test file are currently commented out. Frontend has no test runner configured.
- The project language/documentation is primarily in French.
- The server runs on port **8081** (configured in `application.properties`), not the Spring Boot default 8080.
- CORS uses `setAllowedOriginPatterns(List.of("http://localhost:*"))` — any localhost port is allowed, not just 5173/3000.
- `CaseController` correctly returns `CaseDTO` for all endpoints (previously noted TODO has been resolved).
