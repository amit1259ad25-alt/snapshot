const express = require("express");
const connectDB = require("./db/db.js");
const {
  uploadFile,
  deleteFile,
  updateFile,
} = require("./services/imagekit.js");
const multer = require("multer");
const postModel = require("./models/postModel.js");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel.js");
const protect = require("./middleware/authMiddleware.js");

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

connectDB();

// Register Route
app.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body; // <-- Make sure username is here!

    const exists = await userModel.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email or username already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const role =
      email.toLowerCase().trim() ===
      (process.env.ADMIN_EMAIL || "").toLowerCase().trim()
        ? "admin"
        : "user";

    const user = await userModel.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    });

    const payload = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginValue = (identifier || email || "").toLowerCase().trim();

    // Matches either email OR username
    const user = await userModel.findOne({
      $or: [{ email: loginValue }, { username: loginValue }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email/username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email/username or password" });
    }
    const payload = {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Update your existing POST /posts route to require login:
// app.post("/posts", protect, upload.single("image"), async (req, res) => { ... })

app.post("/posts", protect, upload.single("image"), async (req, res) => {
  try {
    const result = await uploadFile(req.file.buffer, req.file.originalname);
    const post = await postModel.create({
      img_url: result.url, // (keep whatever image field name you already have here)
      caption: req.body.caption,
      user: req.user.id,
      userName: req.user.name,
      fileId: result.fileId, // (keep the imagefile id helps in the removal of the file from the cloud storage)
    });
    res.status(201).json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .populate("user", "name username role")
      .sort({ _id: -1 }); // <-- Sorts newest posts first!
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/posts/:id", protect, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.user && post.user.toString() === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    const deletedPost = await postModel.findByIdAndDelete(req.params.id);
    if (deletedPost?.fileId) {
      await deleteFile(deletedPost.fileId);
    }

    res.json({ message: "Post removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch("/posts/:id", protect, upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const existingPost = await postModel.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "post not found " });
    }
    // start with existing values or new caption if provided
    const updateData = {};
    if (req.body.caption !== undefined) {
      updateData.caption = req.body.caption;
    }

    // only call imageKit if a new image file was actually uploaded
    if (req.file) {
      let result;
      if (existingPost.fileId) {
        result = await updateFile(existingPost.fileId, req.file.buffer);
      } else {
        // call your standard upload function instead;
        result = await uploadFile(req.file.buffer);
      }
      updateData.img_url = result.url;
      updateData.fileId = result.fileId;
    }
    // update mongodb and return the updated document( {new: true})
    const updatedPost = await postModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "post updated successfully ! ",
      post: updatedPost,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "failed to update post" });
  }
});

// Get a user's profile & all of their posts by user ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await postModel
      .find({ user: req.params.id })
      .populate("user", "name username role")
      .sort({ _id: -1 });

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = app;
