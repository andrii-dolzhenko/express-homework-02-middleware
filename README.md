# Express.js · Homework 02 · Middleware

An Express 5 REST API for managing users and articles, extended with request logging, authentication, validation, article access control, and resource-existence middleware. The existing CRUD endpoints remain compatible with Homework 01.

## Tech Stack

- Node.js and JavaScript (ES Modules)
- Express 5 and `express-session`
- In-memory `Map` storage
- Vitest and Supertest (32 instructor tests + 4 session tests)

## Installation and Running

```bash
npm install
npm start
```

The server listens at `http://localhost:3000`. For auto-restart during development, run `npm run dev`.

## Interactive Middleware Playground

Start the Express server and open **http://localhost:3000/demo/** to send actual requests to the API.

The standalone `demo/` directory can also be hosted on GitHub Pages. Because Pages serves static files only, that version is explicitly labeled **Browser simulation · no hosted backend**; it reproduces the documented demo middleware rules and stores records only in browser memory. Reload the page or click **Reset simulation** to restore its initial data. It does not call a hosted Node.js service.

The request builder covers users/articles CRUD, strict POST routes, optional `x-require-auth` and `x-require-strict-access` headers, example Basic/Bearer Authorization values, overlong-field validation, malformed JSON, and common 400/401/403/404 scenarios. **Copy cURL** generates a command for the real local server. The middleware pipeline is a *configuration overview*, not a recorded server execution trace; actual logs appear in the Node.js terminal.

The header-based auth and admin examples are **educational stubs** provided for the assignment. They do not verify identity and must not be used as production authorization.

### Session Visits Demo

The **Session visits** panel introduces server-side session state independently of the demo authentication controls. On localhost, each click on **Visit session** sends `GET /session` with the browser's HttpOnly session-ID cookie, and the Express server increases the count (`Visits: 1`, `Visits: 2`, etc.). **Reset session** sends `DELETE /session`, invalidates the current session, and clears the cookie. This does **not** log in a user, grant permissions, or change CRUD data.

The GitHub Pages version clearly labels its session counter as a **browser-memory simulation**; Pages cannot persist real server-side sessions or set this Express session cookie. Visit counts reset on reload.

`express-session` uses the built-in in-memory store for local coursework only. The cookie is named `hw02.sid`, is `HttpOnly` with `SameSite=Lax`, and expires after 10 minutes. `Secure=false` supports local HTTP; a production deployment would require HTTPS, `Secure=true`, and a persistent production-grade session store. The secret is loaded from `SESSION_SECRET` when set or generated randomly at server startup for local testing. A restart clears the in-memory sessions. Do not use this demonstration as a production authentication system.

Test server-side cookie persistence with curl:

```bash
curl -i -c /tmp/hw02-session.txt -b /tmp/hw02-session.txt http://localhost:3000/session
curl -i -c /tmp/hw02-session.txt -b /tmp/hw02-session.txt http://localhost:3000/session
curl -i -X DELETE -c /tmp/hw02-session.txt -b /tmp/hw02-session.txt http://localhost:3000/session
```

The first two responses are `Visits: 1` and `Visits: 2`; the last response is `204 No Content`.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Root text response |
| GET | `/users` | List users |
| POST | `/users` | Create a user |
| GET | `/users/:userId` | Get a user |
| PUT | `/users/:userId` | Update a user |
| DELETE | `/users/:userId` | Delete a user |
| POST | `/users/strict` | Create a user with mandatory Basic Authorization |
| GET | `/articles` | List articles |
| POST | `/articles` | Create an article |
| GET | `/articles/:articleId` | Get an article |
| PUT | `/articles/:articleId` | Update an article |
| DELETE | `/articles/:articleId` | Delete an article |
| POST | `/articles/strict` | Create an article with mandatory Basic Authorization |
| GET | `/session` | Increment and return this browser's server-side visit count as plain text |
| DELETE | `/session` | Destroy this browser's demo session (`204 No Content`) |

CRUD responses use JSON (except `204 No Content`). Input validation and error responses use text. User `name` and article `title` must be non-empty strings; they are trimmed and limited to 100 and 200 characters, respectively.

## Middleware

| Middleware | Behavior |
| --- | --- |
| `logRequests` | Logs timestamp, method, URL, IP, User-Agent, and POST/PUT body with sensitive field names redacted |
| `demoAuth` | Logs whether an Authorization header is present, without denying normal requests |
| `strictAuth` | Requires a `Basic` Authorization header when `x-require-auth: true` is sent |
| `forceStrictAuth` | Requires Basic Authorization on both `/strict` POST routes |
| `validateUserData` / `validateArticleData` | Validate and trim input before controllers execute |
| `demoArticleAccess` | Requires a demo admin credential to DELETE an article when `x-require-strict-access: true` |
| `checkUserExists` / `checkArticleExists` | Return `404 Not Found` for missing resources |
| `sessionMiddleware` | Uses `express-session` for a per-browser visit counter; stores only the opaque session ID in the cookie |

Requests use **demo authentication, not production security**. The strict mode checks the Basic header's format rather than validating a real user or password. For the test fixture, `Authorization: Basic admin` grants demonstration admin access. There is no authenticated user session or credential store; the separate session counter is not linked to authorization.

## Example Requests

Create a user normally:

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex"}'
```

Require Basic Authorization for user creation:

```bash
curl -i -X POST http://localhost:3000/users/strict \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Basic dGVzdDp0ZXN0' \
  -d '{"name":"Alex"}'
```

Enforce demonstration admin access when deleting an existing article (replace `<articleId>`):

```bash
curl -i -X DELETE http://localhost:3000/articles/<articleId> \
  -H 'x-require-strict-access: true' \
  -H 'Authorization: Basic admin'
```

The implementation returns `200` for successful reads/updates, `201` for creation, `204` for deletion, `400` for invalid data, `401` for missing/incorrect Basic Authorization in strict mode, `403` for insufficient article permissions, `404` for missing resources, and `500` for unexpected server errors.

## Testing

```bash
npm test
```

The two instructor-provided test suites cover 23 original REST API tests and 9 middleware tests (32 total). Four additional session tests verify cookie persistence, session isolation, reset, and backwards compatibility (36 total). The instructor tests and their configuration are preserved without modifications.

## Project Structure

```text
demo/
├── index.html
├── app.js
├── styles.css
└── favicon.svg

src/
├── ASSIGNMENT.md
├── __test__/
│   ├── task1.test.js
│   ├── task2.middlewares.test.js
│   └── session.test.js
├── controllers/
│   ├── root.mjs
│   ├── users.mjs
│   └── articles.mjs
├── data/
│   ├── users.mjs
│   └── articles.mjs
├── middlewares/
│   ├── logRequests.mjs
│   ├── auth.mjs
│   ├── validation.mjs
│   ├── articleAccess.mjs
│   ├── resourceExists.mjs
│   └── session.mjs
├── routes/
│   ├── index.mjs
│   ├── users.mjs
│   ├── articles.mjs
│   └── session.mjs
└── server.mjs
```

Records are kept in memory and reset when the server restarts. No database or persistent session storage is used. The session counter is held in the default in-memory development store.

---

Copyright © 2026 Andrii Dolzhenko.
