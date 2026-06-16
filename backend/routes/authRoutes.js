const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("AUTH ROUTE HIT");
  res.send("Auth Route Working");
});

router.get("/test", (req, res) => {
  res.send("Test Route Working");
});

router.get("/register", (req, res) => {
  res.send("Register Route Working");
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
   return res.status(400).send("User already exists");
}

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
  name,
  email,
  password: hashedPassword,
  });

  await user.save();

  res.send("User Registered Successfully");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send("User not found");
  }

  const isMatch = await bcrypt.compare(
  password,
  user.password
  );

  if (!isMatch) {
   return res.status(400).send("Invalid credentials");
  }

  const token = jwt.sign(
  { userId: user._id },
  "mysecretkey",
  { expiresIn: "1d" }
  );

  res.json({
   message: "Login Successful",
   token,
  });

  res.send("User Found");
  });

module.exports = router;