const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Directory for downloads (accessible by the server)
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

// Route to fetch available video qualities
app.post("/get-qualities", (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.error("No URL provided.");
    return res.status(400).json({ message: "YouTube URL is required" });
  }

  console.log(`Fetching qualities for: ${url}`);

  const ytDlp = spawn("yt-dlp", ["-F", url]);

  let formatList = "";

  ytDlp.stdout.on("data", (data) => {
    formatList += data.toString();
  });

  ytDlp.stderr.on("data", (data) => {
    console.error(`Error: ${data.toString()}`);
  });

  ytDlp.on("close", (code) => {
    if (code === 0) {
      const formats = formatList
        .split("\n")
        .filter((line) => /\d+\s+\w+/.test(line)) // Extract lines with format details
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          const id = parts[0];
          const resolution = parts.slice(1).join(" ");
          const hasVideo = /video/.test(resolution);
          const hasAudio = /audio/.test(resolution);

          return {
            id,
            resolution,
            hasVideo,
            hasAudio,
          };
        });

      // Categorize formats
      const categorizedFormats = {
        videoAndAudio: formats.filter((f) => f.hasVideo && f.hasAudio),
        videoOnly: formats.filter((f) => f.hasVideo && !f.hasAudio),
        audioOnly: formats.filter((f) => !f.hasVideo && f.hasAudio),
      };

      // If no combined Video + Audio streams, create "fake" combinations
      if (categorizedFormats.videoAndAudio.length === 0) {
        const videoOnly = categorizedFormats.videoOnly[0]; // Pick the best video
        const audioOnly = categorizedFormats.audioOnly[0]; // Pick the best audio
        if (videoOnly && audioOnly) {
          categorizedFormats.videoAndAudio.push({
            id: `${videoOnly.id}+${audioOnly.id}`,
            resolution: `${videoOnly.resolution} + ${audioOnly.resolution}`,
            hasVideo: true,
            hasAudio: true,
          });
        }
      }

      res.json(categorizedFormats);
    } else {
      res.status(500).json({ message: "Failed to fetch qualities" });
    }
  });
});

// Route to download a YouTube video in a selected quality
app.post("/download", (req, res) => {
  const { url, formatId } = req.body;

  if (!url || !formatId) {
    console.error("URL or formatId not provided.");
    return res
      .status(400)
      .json({ message: "YouTube URL and format ID are required" });
  }

  console.log(`Downloading video from: ${url} in format: ${formatId}`);

  const ytDlp = spawn("yt-dlp", [
    "-f",
    formatId,
    url,
    "-o",
    `${downloadDir}/%(title)s.%(ext)s`,
  ]);

  let filePath = null;

  ytDlp.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(output);

    const progressMatch = output.match(/(\d+\.\d+)%/);
    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      res.write(JSON.stringify({ progress }) + "\n");
    }

    // Check if the download is complete and get the file path
    if (output.includes("[download] Destination:")) {
      const match = output.match(/Destination: (.+)/);
      if (match) {
        filePath = match[1];
      }
    }
  });

  ytDlp.stderr.on("data", (data) => {
    console.error(`Error: ${data.toString()}`);
  });

  ytDlp.on("close", (code) => {
    if (code === 0 && filePath) {
      console.log("Download completed successfully.");
      
      // Serve the video file for download
      const fileName = path.basename(filePath);
      const mimeType = mime.lookup(fileName) || "application/octet-stream";
      
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Optional: delete the file after sending
      fileStream.on("end", () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Failed to delete file: ${filePath}`);
        });
      });
    } else {
      console.error(`yt-dlp process exited with code ${code}`);
      res.end(JSON.stringify({ message: "Failed to download video" }));
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
