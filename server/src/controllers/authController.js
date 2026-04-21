const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/crypto");
const { signToken } = require("../utils/jwt");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    role: "user",
  });

  return res.status(201).json({
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const me = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
};

module.exports = {
  register,
  login,
  me,
};
