// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;


// ---------- Middlewares ----------
app.use(cors());
app.use(express.json());

// ---------- Ensure uploads folder exists ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads folder at", uploadDir);
}

// Static serve for uploaded PDFs
app.use("/uploads", express.static(uploadDir));

// ---------- In-memory data ----------
let uploadedComics = [];
let feedbacks = [];
let idCounter = 1;

// ---------- Multer setup (store PDFs in /uploads) ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safeName);
  },
});

// Simple setup – no strict mimetype check (so mismatch vacha kuda parledhu)
const upload = multer({ storage });

// ---------- Routes ----------

// Test route
app.get("/", (req, res) => {
  res.send("Agent Santhosh Backend running ✅");
});

// Latest comics – same as uploaded list
app.get("/api/comics", (req, res) => {
  res.json(uploadedComics);
});

// Get uploaded comics
app.get("/api/uploaded-comics", (req, res) => {
  res.json(uploadedComics);
});

// Upload a new comic (PDF)
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    const title = req.body.title || "Untitled";

    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    const newComic = {
      id: idCounter++,
      title,
      fileUrl,
      createdAt: new Date().toISOString(),
    };

    uploadedComics.push(newComic);
    console.log("📥 Uploaded:", newComic);

    res.status(201).json(newComic);
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ message: "Upload error" });
  }
});

// Delete comic
app.delete("/api/uploaded-comics/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = uploadedComics.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Comic not found" });
  }

  const comic = uploadedComics[index];
  uploadedComics.splice(index, 1);

  // Delete file from disk
  const filePath = path.join(uploadDir, path.basename(comic.fileUrl));
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("File delete error:", err.message);
    } else {
      console.log("🗑️ Deleted file:", filePath);
    }
  });

  res.json({ message: "Deleted successfully" });
});

// Feedback
app.post("/api/feedback", (req, res) => {
  const { name, feedback } = req.body;
  if (!feedback) {
    return res.status(400).json({ message: "Feedback is required" });
  }

  const item = {
    id: feedbacks.length + 1,
    name: name || "Anonymous Agent",
    feedback,
    createdAt: new Date().toISOString(),
  };

  feedbacks.push(item);
  console.log("💬 Feedback:", item);
  res.status(201).json({ message: "Feedback saved" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
