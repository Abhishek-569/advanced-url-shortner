// server.js
const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const requestIp = require("request-ip");
const connectDB = require("./config/db");
const { redisClient } = require("./config/redis");
const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const swaggerRoutes = require("./routes/swagger");


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(requestIp.mw());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api", urlRoutes);
app.use("/docs", swaggerRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));