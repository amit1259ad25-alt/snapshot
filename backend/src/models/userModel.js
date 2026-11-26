const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {type: String, enum:["user", "admin"], default: "user"}, // <-- stored once on user!
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("User", userSchema);
