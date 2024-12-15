const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to get video qualities
app.get("/get-qualities", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ message: "Video URL is required" });
  }

  console.log(`Fetching qualities for: ${videoUrl}`);

  // Path to your cookies file
  const cookiesFilePath = path.join(__dirname, "youtube_cookies.txt");

  // yt-dlp command
  const ytDlp = spawn("yt-dlp", [
    "-F", // Fetch available formats
    "--cookies", cookiesFilePath, // Add cookies file
    videoUrl,
  ]);

  let output = "";
  let errorOutput = "";

  ytDlp.stdout.on("data", (data) => {
    output += data.toString();
  });

  ytDlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  ytDlp.on("close", (code) => {
    if (code === 0) {
      console.log(output);
      res.json({ qualities: output });
    } else {
      console.error(errorOutput);
      res.status(500).json({
        message: "Failed to fetch video qualities",
        error: errorOutput,
      });
    }
  });
});

// Endpoint to download video
app.get("/download", (req, res) => {
  const videoUrl = req.query.url;
  const formatId = req.query.formatId;
  if (!videoUrl || !formatId) {
    return res.status(400).send("Video URL and Format ID are required");
  }

  console.log(`Downloading video with Format ID: ${formatId}`);

  // Path to your cookies file
  const cookiesFilePath = path.join(__dirname, "youtube_cookies.txt");

  // yt-dlp command
  const ytDlp = spawn("yt-dlp", [
    "-f", formatId, // Select format
    "--cookies", cookiesFilePath, // Add cookies file
    "-o", "-", // Stream output
    videoUrl,
  ]);

  // Set the headers for file download
  res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
  res.setHeader("Content-Type", "video/mp4");

  ytDlp.stdout.pipe(res);

  ytDlp.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  ytDlp.on("close", (code) => {
    if (code !== 0) {
      console.error(`yt-dlp process exited with code ${code}`);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
