require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const { initializeDatabase, runMigrations } = require("./db");
const { 
  staticAssetCache, 
  apiCache, 
  longTermCache,
  negotiatedCache,
  noCache,
  securityHeaders,
  devCacheBust
} = require("./middleware/cacheMiddleware");
const {
  apiRateLimit,
  authRateLimit,
  searchRateLimit,
  createPostRateLimit,
  readRateLimit,
  messageRateLimit
} = require("./middleware/rateLimiterSimple");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const notesRoutes = require("./routes/notesRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const branchRoutes = require("./routes/branchRoutes");
const toolsRoutes = require("./routes/toolsRoutes");

const http = require("http");
const { initializeSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Trust Render's proxy so rate-limiter works correctly
app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(devCacheBust);
app.use(express.static('public', staticAssetCache));

initializeSocket(server);

// Initialize Turso database
initializeDatabase();
console.log("Turso database initialized");

// Run migrations (create tables if not exist)
runMigrations().then(() => {
  console.log("Database migrations applied");
}).catch((err) => {
  console.warn("Migration error:", err.message);
});

app.use("/api/auth", authRateLimit, noCache, authRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date() });
});

// Debug endpoint to test Turso connection
app.get("/api/debug-turso", async (req, res) => {
  const results = { steps: [], env: {} };
  // Step 1: Test existing client
  try {
    const { getClient } = require("./db");
    const c = getClient();
    results.steps.push("client_exists: " + !!c);
    if (c) {
      results.steps.push("protocol: " + c.protocol + ", closed: " + c.closed);
      const r = await c.execute("SELECT 1");
      results.steps.push("existing_client_ok: " + (r.rows ? r.rows.length : 0));
    }
  } catch (err) {
    results.steps.push("existing_client_error: " + err.message);
  }
  // Step 2: Test fresh client
  try {
    const { createClient } = require("@libsql/client");
    const url = (process.env.TURSO_DATABASE_URL || "").replace(/^libsql:/, "https:");
    const c2 = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    const r2 = await c2.execute("SELECT 1");
    results.steps.push("fresh_client_ok: " + (r2.rows ? r2.rows.length : 0));
  } catch (err) {
    results.steps.push("fresh_client_error: " + err.message);
    results.steps.push("fresh_client_code: " + err.code);
  }
  // Step 3: Direct HTTPS request to Turso hrana endpoint
  try {
    const https = require("https");
    const body = JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql: "SELECT 1", args: [], named_args: [], want_rows: true } },
        { type: "close" }
      ]
    });
    const token = process.env.TURSO_AUTH_TOKEN || "";
    const url2 = new URL((process.env.TURSO_DATABASE_URL || "").replace(/^libsql:/, "https:"));
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url2.hostname,
        port: 443,
        path: "/v2/pipeline",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "Content-Length": Buffer.byteLength(body)
        }
      }, (resp) => {
        let data = "";
        resp.on("data", chunk => data += chunk);
        resp.on("end", () => {
          resolve({ status: resp.statusCode, body: data.substring(0, 200) });
        });
      });
      req.on("error", reject);
      req.write(body);
      req.end();
    });
    results.steps.push("direct_https_status: " + result.status);
    results.steps.push("direct_https_body: " + result.body);
  } catch (err) {
    results.steps.push("direct_https_error: " + err.message);
  }
  results.env = {
    tursoUrl: (process.env.TURSO_DATABASE_URL || "<not set>"),
    hasToken: !!process.env.TURSO_AUTH_TOKEN,
    tokenPrefix: (process.env.TURSO_AUTH_TOKEN || "<not set>").substring(0, 25),
    tokenLength: (process.env.TURSO_AUTH_TOKEN || "").length,
  };
  res.json(results);
});

app.use("/api/posts", readRateLimit, negotiatedCache, postRoutes);
app.post("/api/posts", createPostRateLimit, noCache, postRoutes);
app.put("/api/posts", createPostRateLimit, noCache, postRoutes);
app.delete("/api/posts", createPostRateLimit, noCache, postRoutes);

app.use("/api/timetable", apiRateLimit, noCache, timetableRoutes);
app.use("/api/profile", apiRateLimit, noCache, profileRoutes);
app.use("/api/notes", readRateLimit, negotiatedCache, notesRoutes);
app.use("/api/search", searchRateLimit, apiCache, searchRoutes);
app.use("/api/notifications", messageRateLimit, noCache, notificationRoutes);
app.use("/api/colleges", apiRateLimit, longTermCache, collegeRoutes);
app.use("/api/branches", apiRateLimit, longTermCache, branchRoutes);
app.use("/api", apiRateLimit, noCache, reportsRoutes);
app.use("/api/tools", apiRateLimit, longTermCache, toolsRoutes);

const { startCronJobs } = require('./services/cronService');

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  startCronJobs();
});
