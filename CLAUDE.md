# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: JurisHub

Law Firm Management System (Cabinet d'Avocats). Backend: Spring Boot 3.2.0, Java 17, MySQL. Frontend: React 19 + Vite. Documentation and variable names are primarily in French. Currency is TND (Tunisian Dinar).

## Build & Run

All commands run from this directory. On Windows use `mvnw.cmd` instead of `./mvnw`.

### Backend

```bash
./mvnw spring-boot:run                           # Run on port 8081
./mvnw clean install                             # Full build
./mvnw test                                      # Run tests (all commented out — no active suite)
./mvnw test -Dtest=ClassName                     # Single test class
./mvnw test -Dtest=ClassName#methodName          # Single test method
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Dev server on port 5173
npm run build      # Production build
npm run lint       # ESLint
```

### Database

MySQL on `localhost:3306`, database `jurishub`, user `root`, no password. Schema is auto-managed by Hibernate (`ddl-auto=update`). Roles are seeded via `src/main/resources/import.sql` on startup.

## Architecture

### Backend (Spring Boot)

```
Controller → Service (optional) or Repository → MySQL
```

Package layout under `com.example.monpremiersite`:

| Package | Purpose |
|---|---|
| `config/` | Spring Security & CORS (allows any `localhost:*` port) |
| `controller/` | 37 REST controllers including `AuthController` + `GlobalExceptionHandler` (`@ControllerAdvice`) |
| `dto/` | Flat DTOs with `fromEntity()` static mappers + `AppointmentMapper` |
| `entities/` | JPA entities + enums (~60 total files) |
| `events/` | Spring `ApplicationEvent` subclasses for Appointment, Audience, and Task creation |
| `mapper/` | `PresenceJournalMapper` (dedicated mapper class) |
| `repository/` | Spring Data JPA repositories |
| `security/` | `JwtUtil`, `JwtAuthenticationFilter`, `UserDetailsServiceImpl` |
| `service/` | 25 service classes (billing, payment, task, PDF, email, timesheet, chat/AI, contracts, etc.) |

**Key architectural decisions:**

- **Flat DTO pattern**: All API responses use flat DTOs with no nested objects. IDs and denormalized fields (e.g., `client_full_name`, `case_number`) are included directly. See `FLAT_DTO_ARCHITECTURE.md`.
- **Inconsistent entity ID field names**: DTO primary key fields are not uniformly named `id`. The pattern is a 3-letter abbreviation: `idc` (Case), `idn` (CaseNote), `idd` (Document), `idt` (Trial), `ida` (Appointment), `idu` (User), `id` (Payment, Task, PhoneCall). Always check the relevant DTO class.
- **Inconsistent service layer**: Some controllers call repositories directly; others use a service class. Follow the existing pattern for whichever entity you're modifying.
- **Static mappers**: Most DTOs have `public static XyzDTO fromEntity(Entity e)`. `AppointmentMapper` is in `dto/`; `PresenceJournalMapper` is in `mapper/`.
- **Mixed Lombok**: Some entities use `@Data`, others have manual getters/setters.

**Key subsystems:**

- **Billing/Payment**: `BillingLedgerService`, `TrustAccountService`, `ProvisionService`, `BillingSummaryService`, `LateFeeService`, `PaymentReminderService` manage a multi-stage accounting system. Default tax rate 19%, late fee 5% after 30 days. Reminders fire at 10/20/30-day thresholds. `@EnableScheduling` is active — reminder and late-fee jobs run automatically in the background.
- **PDF generation**: `InvoicePDFService` uses OpenPDF 1.3.30.
- **Email**: `EmailService` uses Gmail SMTP with Thymeleaf HTML templates. Credentials are hardcoded in `application.properties` — do not commit changes that expose or rotate these.
- **AI Chat**: `GeminiService` + `ChatService` + `ChatContextEnricher` provide a session-based AI assistant backed by **Google Gemini 2.5 Flash** (replaces Ollama). `ChatContextEnricher.buildSystemPrompt()` injects client data (cases, appointments, unpaid invoices, real available slots from DB) into the system prompt. `GeminiService` uses `responseMimeType=application/json` + `responseSchema` to guarantee valid structured JSON — no regex extraction needed. `ChatService` parses the JSON, detects `appointment_confirmed=true`, and books appointments automatically. Conversation history is persisted as `ChatMessage` entities. Config: `gemini.api.key=${GEMINI_API_KEY:CONFIGURE_MOI}`, `gemini.api.url`, `gemini.temperature=0.3`, `chat.max-history-messages=20`, `chat.session-expiry-hours=24`. Gemini requires the `GEMINI_API_KEY` environment variable (free key at aistudio.google.com). Frontend: `services/chatApi.js` + `components/chat/ChatWidget.jsx`. Falls back to a static JSON error message when the API is unavailable.
- **Contract Generation**: `ContractGenerateController` (`/api/contracts`) streams AI-generated legal documents via **SSE** using a local Ollama instance (still uses Ollama, not Gemini). `ContractDataInitializer` seeds 16 templates (Tunisian law — judicial acts, contracts, company law) into the DB on startup. `ContractPDFService` generates PDF from completed documents. History is persisted in `ContractHistory`. Frontend: `avocate/GenerateurContrat.jsx` (3-step wizard: template select → dynamic form → streaming result + PDF download) using `services/contractService.js` which calls `streamContract()` via the Fetch SSE API. Contract templates are managed via `ContractController` (`/api/contract-templates`). Ollama must be running locally for contract generation to work.

### Frontend (React 19 SPA)

Key versions: React 19, React Router 7, Axios 1.x, Vite 7, Tailwind CSS 3.4, Chart.js 4.5, FullCalendar 6.1.

- API base URL: `http://localhost:8081`
- JWT stored in localStorage, attached via axios interceptor in `frontend/src/api.js`
- Auth state: `AuthContext.jsx` wraps the app; `App.jsx` handles routing with public/private route guards

**Role-based routing** — `getRolePath()` in `App.jsx` maps each role to its landing path after login:

| Role | Layout entry | Dashboard child route | Layout component |
|---|---|---|---|
| `ADMINISTRATEUR` | `/admin` | (no nesting) | none — direct `pages/Dashboard.jsx` |
| `AVOCAT` | `/avocat` | `/avocat/dashboard` | `avocate/Layout.jsx` |
| `SECRETAIRE` | `/secretaire` | `/secretaire/dashboard` | `secretaire/LayoutSecretaire.jsx` |
| `STAGIAIRE` | `/stagiaire` | `/stagiaire/dashboard` | `stagiaire/LayoutStagiaire.jsx` |
| `CLIENT` | `/client` | `/client/accueil` | `client/LayoutClient.jsx` |

Backend role constants are all-caps (`ADMINISTRATEUR`, `AVOCAT`); `AuthContext` stores them exactly as returned by the server. The `roles` field may arrive as a string or an array — the frontend handles both defensively.

Frontend source subfolders:

| Subfolder | Contents |
|---|---|
| `avocate/` | 50+ component files — full case management, billing, statistics (Chart.js) |
| `secretaire/` | 25+ component files — client/case management pages |
| `stagiaire/` | Stagiaire pages + `LayoutStagiaire.jsx` |
| `client/` | Client portal pages + `LayoutClient.jsx` |
| `aceuille/` | Public landing page + role selector — folder name is a typo of "accueil" |
| `pages/` | `AuthPage.jsx`, `Dashboard.jsx` (Admin), and role dashboard stubs |
| `components/` | Shared UI: `Logo.jsx`, `DatePicker.jsx`, `BackgroundCircles.jsx`, `RoleSelector.jsx`; `chat/ChatWidget.jsx` |
| `services/` | `chatApi.js` — API calls for the Ollama AI chat feature |

## Authentication & Roles

JWT stateless auth (JJWT 0.12.3), Bearer token, 24h expiration, BCrypt passwords.

- Public: `POST /auth/login`, `POST /auth/register`
- Login response: `{ token, idu, email, nom, prenom, roles[] }` — stored in localStorage under both `token` and `user` keys
- Roles: `ADMINISTRATEUR` (full access), `SECRETAIRE`, `AVOCAT`, `STAGIAIRE`, `CLIENT`
- No token refresh logic: a 401 from an expired JWT does not auto-logout the user

## Notes

- Server port is **8081** (not the Spring Boot default 8080).
- `spring.jpa.show-sql=true` — SQL queries are printed to the backend console.
- Dates are serialized as ISO 8601 strings (`write-dates-as-timestamps=false`), not arrays.
- User entity uses French field names: `nom`, `prenom`, `adresse`, `CIN`, `tel`, `date_naissance`.
- All tests are currently commented out; the frontend has no test runner configured.
- A Java 17 → 21 upgrade is in progress on branch `appmod/java-upgrade-20260218075430` using OpenRewrite (`rewrite.yml`).
- **Two AI backends coexist**: chat uses Gemini (cloud API, requires `GEMINI_API_KEY`); contract generation uses Ollama (local, requires Ollama running). Both degrade silently if unavailable.
- `ContractGenerateController` uses `@CrossOrigin(origins = "http://localhost:5173")` explicitly — this is redundant with the global CORS config but harmless.
