const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));

// Database Connection Middleware for Serverless & Long-running
app.use(async (req, res, next) => {
  if (req.path === '/' && req.method === 'GET') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    return res.status(500).json({
      success: false,
      error: "Database connection failed",
    });
  }
});

const { apiLimiter } = require('./middleware/rateLimiter');
app.use(['/api', '/'], apiLimiter);

// Routes
const carRoutes = require("./routes/cars");
const authRoutes = require("./routes/auth");

// API Routes (supports both /api/* and stripped /* from Vercel function routing)
app.use(["/api/cars", "/cars"], carRoutes);
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/bookings", "/bookings"], require("./routes/bookings"));
app.use(["/api/users", "/users"], require("./routes/users"));
app.use(["/api/payment", "/payment"], require("./routes/payment"));
app.use(["/api/messages", "/messages"], require("./routes/messages"));

// Test Route
app.get("/", (req, res) => {
  res.json({ success: true, message: "LuxeDrive Backend running..." });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error Handler — handle Mongoose duplicate key & validation errors
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  // Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Duplicate value for field '${field}'. This ${field} already exists.`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: messages[0] || 'Validation error'
    });
  }

  // Default error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

// Only start the HTTP listener if executed directly (e.g. local dev), not when imported as a serverless function
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB on startup:", err);
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (Database pending connection)`);
      });
    });
}

module.exports = app;