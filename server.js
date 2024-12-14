const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Route to fetch available video qualities
app.get("/get-qualities", (req, res) => {
  const { url } = req.query;

  if (!url) {
    console.error("YouTube URL not provided.");
    return res
      .status(400)
      .json({ message: "YouTube URL is required to fetch qualities." });
  }

  console.log(`Fetching qualities for: ${url}`);

  const ytDlp = spawn("yt-dlp", ["-F", url]);

  let output = "";
  ytDlp.stdout.on("data", (data) => {
    output += data.toString();
  });

  ytDlp.stderr.on("data", (data) => {
    console.error(`Error: ${data.toString()}`);
  });

  ytDlp.on("close", (code) => {
    if (code === 0) {
      console.log("Fetched qualities successfully.");
      res.json({ qualities: output });
    } else {
      console.error(`yt-dlp process exited with code ${code}`);
      res
        .status(500)
        .json({ message: "Failed to fetch video qualities. Please try again." });
    }
  });
});

// Route to download a YouTube video
app.get("/download", (req, res) => {
  const { url, formatId } = req.query;

  if (!url) {
    console.error("YouTube URL not provided.");
    return res
      .status(400)
      .json({ message: "YouTube URL is required to download the video." });
  }

  if (!formatId) {
    console.error("Format ID not provided.");
    return res
      .status(400)
      .json({ message: "Format ID is required to download the video." });
  }

  console.log(`Downloading video from: ${url} in format: ${formatId}`);

  // Temporary file path for the download
  const tempFilePath = path.join(
    __dirname,
    `temp_download_${Date.now()}.mp4`
  );

  const ytDlp = spawn("yt-dlp", ["-f", formatId, url, "-o", tempFilePath]);

  ytDlp.stderr.on("data", (data) => {
    console.error(`Error: ${data.toString()}`);
  });

  ytDlp.on("close", (code) => {
    if (code === 0) {
      console.log("Download completed successfully.");

      // Send the file to the browser for download
      res.download(tempFilePath, "downloaded_video.mp4", (err) => {
        if (err) {
          console.error("Error sending the file:", err);
          res.status(500).json({ message: "Failed to download the file." });
        } else {
          // Delete the temporary file after serving it
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting temporary file:", unlinkErr);
            }
          });
        }
      });
    } else {
      console.error(`yt-dlp process exited with code ${code}`);
      res.status(500).json({ message: "Failed to download the video." });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
