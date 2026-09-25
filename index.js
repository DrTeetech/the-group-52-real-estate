const express = require("express");

const app = express();

// ===============================
// GLOBAL MIDDLEWARE
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Real estate rental API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Real Estate Rental API",
  });
});

module.exports = app;
