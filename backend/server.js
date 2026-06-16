const express = require("express");
const connectDB = require("./db");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

// Connect MongoDB
connectDB();

// Auth Routes
app.use("/api/auth", authRoutes);

// Home Route
app.get("/", (req, res) => {
  res.send("Backend is Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});