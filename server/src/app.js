const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const trainRoutes = require("./routes/trainRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools like curl/postman and same-origin requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    message: "Railway API is running",
    routes: ["/api/auth", "/api/trains", "/api/bookings", "/api/admin"],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use(/.*/, notFound);
app.use(errorHandler);

module.exports = app;
