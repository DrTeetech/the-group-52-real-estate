const express = require("express");

const authRoutes = require("./routes/authRoutes");

const propertyRoutes = require("./routes/propertyRoutes");

const leaseRoutes = require("./routes/leaseRoutes");

const paymentRoutes = require("./routes/paymentRoutes");

const inquiryRoutes = require("./routes/inquiryRoutes");

const favouriteRoutes = require("./routes/favouriteRoutes");

const viewingRoutes = require("./routes/viewingRoutes");

const rentalApplicationRoutes = require("./routes/rentalApplicationRoutes");




const app = express();

// ===============================
// GLOBAL MIDDLEWARE
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.use("/api/properties", propertyRoutes);

app.use("/api/leases", leaseRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/inquiries", inquiryRoutes);

app.use("/api/favourites", favouriteRoutes);

app.use("/api/viewings", viewingRoutes);

app.use("/api/rental-applications", rentalApplicationRoutes);

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
