const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");
const { User } = require("./models");
const { hashPassword } = require("./utils/hash");

const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());

connectDB();

const initializeAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      const hashedPassword = await hashPassword("admin@123");
      const admin = new User({
        name: "admin",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "admin",
      });
      await admin.save();
      console.log("Default admin created: admin@admin.com / admin@123");
    }
  } catch (error) {
    console.error("Error initializing admin:", error.message);
  }
};

app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeAdmin();
});
