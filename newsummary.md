# Citrus Project Topic Summary

Generated on 2026-05-04 for the `Citrus` codebase.

## Middleware

### 1) Middleware lifecycle
Status: PRESENT
Where:
- `server/src/app.js:20` to `server/src/app.js:31` -> app-level middleware executes in declared order.
- `server/src/app.js:41` to `server/src/app.js:46` -> route mounting.
- `server/src/app.js:48` to `server/src/app.js:49` -> terminal middleware (`notFound`, `errorHandler`).

### 2) Application-level middleware
Status: PRESENT
Where:
- `server/src/app.js:20` -> `helmet()`
- `server/src/app.js:21` -> `compression()`
- `server/src/app.js:22` to `server/src/app.js:27` -> `cors(...)`
- `server/src/app.js:28` -> `express.json(...)` (body parser for JSON)
- `server/src/app.js:29` -> `express.urlencoded(...)` (body parser for form bodies)
- `server/src/app.js:30` -> `cookieParser()`
- `server/src/app.js:31` -> `loggerMiddleware`

### 3) Router-level middleware
Status: PRESENT
Where:
- `server/src/routes/chatRoutes.js:10` -> `router.use(protect)`
- `server/src/routes/aiRoutes.js:10` -> `router.use(protect)`
- Route-chain middleware examples:
- `server/src/routes/questionRoutes.js:9` -> `optionalAuth`, validators, `validateRequest`, controller.
- `server/src/routes/authRoutes.js:11` -> `protectFirebaseToken` before controller.

### 4) Error-handling middleware
Status: PRESENT
Where:
- `server/src/middleware/errorMiddleware.js:7` -> centralized Express error handler signature `(err, req, res, next)`.
- `server/src/app.js:49` -> error handler registered after all routes.

### 5) Third-party middleware
Status: PRESENT
Where:
- `helmet`, `compression`, `cors`, `cookie-parser`, `morgan` in:
- `server/src/app.js:20` to `server/src/app.js:31`
- `server/src/middleware/loggerMiddleware.js:1` to `server/src/middleware/loggerMiddleware.js:4`
- Validation stack uses `express-validator` in:
- `server/src/utils/validators.js:1`
- `server/src/middleware/validateMiddleware.js:1`

## Express Request Flow

### 6) How request travels in this Express app
Status: PRESENT
Typical flow:
- `server/src/server.js:14` creates HTTP server with Express app.
- Request enters app middleware chain in `server/src/app.js:20` to `server/src/app.js:31`.
- Request is routed via mounted path in `server/src/app.js:41` to `server/src/app.js:46`.
- Route-level middleware/validators run (example `server/src/routes/questionRoutes.js:9`).
- Controller executes (example `server/src/controllers/questionController.js:19`).
- Controller calls service layer (example `server/src/services/questionService.js:39`).
- Service hits Mongoose models (example `server/src/services/questionService.js:75`).
- Response returned from controller (`res.status(...).json(...)`).
- Any thrown error goes to `server/src/middleware/errorMiddleware.js:7`.

### 7) Blocking vs non-blocking code + body parser
Status: PARTIAL (both patterns exist)
Where:
- Non-blocking style is dominant (`async/await` with DB and IO), e.g. `server/src/services/questionService.js:74`, `server/src/services/chatService.js:77`.
- Explicit blocking sync IO exists at startup: `server/src/config/firebaseAdmin.js:10` (`fs.existsSync`), `server/src/config/firebaseAdmin.js:11` (`fs.readFileSync`).
- Body parser is built-in Express middleware, not `body-parser` package:
- `server/src/app.js:28` (`express.json`)
- `server/src/app.js:29` (`express.urlencoded`)

## Rendering and Templates

### 8) SSR vs CSR
Status: CSR PRESENT, SSR MISSING
Where:
- CSR entry point: `client/src/main.jsx:7` to `client/src/main.jsx:12` (`ReactDOM.createRoot(...)`).
- Static root container: `client/index.html:19`.
- No server-side rendering pipeline found in `server/src`.

### 9) EJS/HBS template engine usage
Status: MISSING
Evidence:
- No `ejs`, `hbs`, `handlebars`, `res.render`, or `view engine` setup in backend source.

## Databases

### 10) SQL and NoSQL usage
Status: NoSQL PRESENT, SQL MISSING
Where:
- NoSQL MongoDB is used throughout backend.
- SQL/PostgreSQL/ORM setup not present.

### 11) Connecting MongoDB
Status: PRESENT
Where:
- `server/src/config/db.js:7` -> `mongoose.connect(process.env.MONGO_URI, ...)`.
- `server/src/server.js:12` -> DB connection invoked before listen.

### 12) ODM (Mongoose) usage
Status: PRESENT
Where:
- Schema/model definitions:
- `server/src/models/User.js:3`
- `server/src/models/Question.js:11`
- `server/src/models/Answer.js:11`
- `server/src/models/Chat.js:3`
- `server/src/models/Message.js:3`
- Query and populate examples in services:
- `server/src/services/questionService.js:75`
- `server/src/services/chatService.js:78`

## Sessions, Cookies, and Auth

### 13) Cookies and express-session
Status: PARTIAL
Where:
- Cookie parsing is present: `server/src/app.js:30`, `server/src/middleware/authMiddleware.js:10`.
- Frontend stores token/user in localStorage: `client/src/lib/session.js:1`.
- Requests include credentials and bearer tokens: `client/src/lib/apiClient.js:40` to `client/src/lib/apiClient.js:53`.
- `express-session` is NOT configured.

### 14) Bcrypt auth
Status: MISSING
Evidence:
- No `bcrypt`/`bcryptjs` usage in source or direct dependencies.

### 15) JWT token handling
Status: PRESENT (via Firebase ID token verification)
Where:
- Token extracted from bearer header/cookie: `server/src/middleware/authMiddleware.js:5` to `server/src/middleware/authMiddleware.js:14`.
- Token verified by Firebase Admin: `server/src/config/firebaseAdmin.js:67` to `server/src/config/firebaseAdmin.js:70`.
- Used for HTTP auth and socket auth:
- `server/src/middleware/authMiddleware.js:27` to `server/src/middleware/authMiddleware.js:39`
- `server/src/sockets/index.js:29` to `server/src/sockets/index.js:53`

### 16) Passport.js
Status: MISSING
Evidence:
- No `passport` setup or strategy usage.

## Realtime / Full Duplex

### 17) Socket.io full-duplex communication
Status: PRESENT
Where:
- Socket server setup and auth middleware: `server/src/sockets/index.js:21` to `server/src/sockets/index.js:62`.
- Bi-directional chat events: `server/src/sockets/chatSocket.js:8` to `server/src/sockets/chatSocket.js:81`.
- Client socket setup: `client/src/features/chat/socketClient.js:15` to `client/src/features/chat/socketClient.js:31`.

## PostgreSQL

### 18) Starting with PostgreSQL + middleware creation
Status: MISSING
Evidence:
- No `pg`, `postgres`, Prisma, Sequelize, Knex, or SQL migration/config files found.
- Current app is MongoDB + Mongoose based.

## Notes on gaps vs your requested syllabus

Not yet in this project:
- EJS/HBS templating.
- SSR backend rendering.
- `express-session` based server sessions.
- Password hashing with bcrypt.
- Passport.js auth strategies.
- PostgreSQL + SQL layer and Postgres-specific middleware.
