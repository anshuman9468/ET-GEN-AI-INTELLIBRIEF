const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors()); // Allow all origins for simplicity in local development
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(__dirname)); // Serving files from the server's own directory

console.log(`📂 Remotion server serving from: ${__dirname}`);

// Lazy-load Remotion ESM modules
async function renderNewsVideo(scenes, persona, audioUrl, duration, sceneAudio, outputPath) {
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  console.log("📦 Bundling Remotion composition...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./Root.jsx"),
    webpackOverride: (config) => config,
  });

  const fps = 30;
  const totalFrames = duration ? Math.ceil(duration * fps) : scenes.length * (fps * 5);

  console.log(`🎬 Selecting composition (${totalFrames} frames)...`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "NewsVideo",
    inputProps: { scenes, persona, audioUrl, totalDurationInFrames: totalFrames, sceneAudio },
  });

  console.log(`🎥 Rendering ${totalFrames} frames...`);
  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
    },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { scenes, persona, audioUrl, totalDurationInFrames: totalFrames, sceneAudio },
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
    },
  });

  console.log("\n✅ Render complete:", outputPath);
}

// POST /render-video
app.post("/render-video", async (req, res) => {
  const { scenes = [], persona = "Investor", topic = "News", audioUrl = null, duration = null, sceneAudio = [] } = req.body;

  if (!scenes.length && !sceneAudio.length) {
    return res.status(400).json({ error: "No scenes provided" });
  }

  const filename = `news-${Date.now()}.mp4`;
  const outputPath = path.resolve(__dirname, filename);

  console.log(`🎬 Rendering: ${sceneAudio.length || scenes.length} scenes for "${topic}" (${persona})`);

  try {
    await renderNewsVideo(scenes, persona, audioUrl, duration, sceneAudio, outputPath);

    res.json({
      success: true,
      videoUrl: `http://localhost:3001/${filename}`,
      filename,
      scenes: scenes.length,
    });
  } catch (err) {
    console.error("❌ Render error:", err);
    res.status(500).json({ 
      error: "Render failed", 
      message: err.message, 
      stack: err.stack 
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Remotion render server" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🎬 Remotion Render Server`);
  console.log(`=`.repeat(50));
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`POST /render-video  → renders MP4`);
  console.log(`GET  /health        → status check`);
  console.log("=".repeat(50));
});
