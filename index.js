require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

// ================== ROOT TEST ==================
app.get("/", (req, res) => {
  res.send("SahelPay API is running 🚀");
});

// ================== CONNECT DB ==================
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });
// ================== USER MODEL ==================
const UserSchema = new mongoose.Schema({
  name: String,
  phone: String,
  password: String,
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

// ================== REGISTER ==================
app.post("/api/auth/register", async (req, res) => {
  const { name, phone, password } = req.body;

  const exists = await User.findOne({ phone });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    phone,
    password: hashed,
    balance: 100
  });

  await user.save();

  res.json({ message: "Registered successfully" });
});

// ================== LOGIN ==================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================== PROFILE ==================
app.get("/api/users/me", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// ================== WALLET ==================
app.get("/api/wallet/balance", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    res.json({ balance: user.balance });
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SahelPay API running on port " + PORT);
});
