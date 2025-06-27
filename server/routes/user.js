const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { hashPassword, comparePassword } = require("../utils/hash");
const { auth, adminOnly } = require("../middleware/auth");

router.get("/", [auth], async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", [auth, adminOnly], async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", [auth, adminOnly], async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.find({ email });
    if (existingUser.length > 0)
      return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await hashPassword(password);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
});



router.put("/:id", [auth, adminOnly], async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (email && email !== user.email) {
      const existingUser = await User.find({ email });
        if (existingUser.length > 0)
          return res.status(400).json({ message: "User already exists" });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    if (password) {
      user.password = await hashPassword(password);
    }
    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", [auth, adminOnly], async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.remove();
    res.json({ message: "User deleted successfully" });
    }
    catch (error) {
    res.status(500).json({ message: error.message });
    } 
});

module.exports = router;
