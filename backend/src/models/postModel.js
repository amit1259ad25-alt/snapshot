const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    img_url: String,
    caption: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, default: "Anonymous" },
    fileId: String,
  },
  { timestamps: true },
);

const postModel = mongoose.model("posts", postSchema);

module.exports = postModel;
