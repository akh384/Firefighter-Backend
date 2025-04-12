const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");
const Testimonial = require("./testimonialModel");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontendold-dist")));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB error:", err));

// Azure Blob Storage setup
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Multer setup
const upload = multer({ dest: "uploads/" });

// Upload Endpoint
app.post("/api/uploadVideo", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("No file uploaded");

    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const stream = fs.createReadStream(file.path);
    const streamLength = fs.statSync(file.path).size;

    await blockBlobClient.uploadStream(stream, streamLength);
    fs.unlinkSync(file.path);

    const url = blockBlobClient.url;
    console.log("✅ Uploaded to Azure Blob:", blobName);

    res.json({ embedUrl: url });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).send("Upload failed");
  }
});

// Save to MongoDB
app.post("/api/testimonials", async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch (err) {
    console.error("❌ Error saving testimonial:", err);
    res.status(500).send("Could not save testimonial");
  }
});

// Get all approved testimonials
app.get("/api/testimonials", async (req, res) => {
  try {
    // Only return testimonials that are approved
    const testimonials = await Testimonial.find({ approved: true });
    res.json(testimonials);
  } catch (err) {
    console.error("❌ Error loading testimonials:", err);
    res.status(500).send("Failed to load testimonials");
  }
});


app.delete("/api/testimonials/:id", async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting testimonial:", err);
    res.status(500).send("Error deleting testimonial");
  }
});

// Serve frontendold
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontendold-dist/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
