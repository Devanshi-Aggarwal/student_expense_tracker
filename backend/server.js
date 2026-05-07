require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./User");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// 🔥 Middlewares
app.use(cors());
app.use(express.json());

// 🔥 Disable caching (fix 304 issue)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// 🔥 MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// 🔥 Schema
const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

// 🔐 ADD AUTH MIDDLEWARE RIGHT HERE 👇
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};


// ➕ Add expense
app.post("/add", authMiddleware, async (req, res) => {
  try {
    const newExpense = new Expense({
      ...req.body,
      userId: req.userId, // 🔥 attach logged-in user
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    console.error("❌ Add Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 📥 Get all expenses
app.get("/expenses", authMiddleware, async (req, res) => {
  try {
    const data = await Expense.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✏️ UPDATE expense (🔥 REQUIRED FOR EDIT FEATURE)
app.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete expense
app.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 ================= AUTH ROUTES =================

// 🔐 SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🔐 LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🚀 Start server
app.listen(5000, () => console.log("🚀 Server running on port 5000"));
