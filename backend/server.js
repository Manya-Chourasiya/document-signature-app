const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const auditRoutes = require("./routes/auditRoutes");
const signingLinkRoutes = require(
  "./routes/signingLinkRoutes"
);
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/audit", auditRoutes);
app.use(
  "/api/sign-links",
  signingLinkRoutes
);

// Home Route
app.get("/", (req, res) => {
  res.send("Backend is Running");
});

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});