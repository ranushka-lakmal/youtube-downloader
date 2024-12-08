document.getElementById("fetchQualitiesBtn").addEventListener("click", async () => {
    const videoUrl = document.getElementById("videoUrl").value;
    const videoAndAudioSelect = document.getElementById("videoAndAudioSelect");
    const videoOnlySelect = document.getElementById("videoOnlySelect");
    const audioOnlySelect = document.getElementById("audioOnlySelect");
  
    const statusDiv = document.getElementById("status");
  
    if (!videoUrl) {
      statusDiv.innerHTML = "<p class='error'>Please enter a YouTube URL!</p>";
      return;
    }
  
    statusDiv.innerHTML = "Fetching available qualities...";
    videoAndAudioSelect.innerHTML = "<option>Loading...</option>";
    videoOnlySelect.innerHTML = "<option>Loading...</option>";
    audioOnlySelect.innerHTML = "<option>Loading...</option>";
  
    try {
      const response = await fetch("http://localhost:3000/get-qualities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch qualities.");
      }
  
      const qualities = await response.json();
  
      // Clear previous options
      videoAndAudioSelect.innerHTML = "";
      videoOnlySelect.innerHTML = "";
      audioOnlySelect.innerHTML = "";
  
      // Combine Video + Audio options
      const combinedVideoAudio = [];
      qualities.videoOnly.forEach((videoFormat) => {
        qualities.audioOnly.forEach((audioFormat) => {
          combinedVideoAudio.push({
            id: `${videoFormat.id}+${audioFormat.id}`, // Combined format ID
            resolution: `${videoFormat.resolution} (${videoFormat.size} Video + Audio)`,
          });
        });
      });
  
      // Populate Video + Audio options
      if (combinedVideoAudio.length > 0) {
        combinedVideoAudio.forEach((format) => {
          const option = document.createElement("option");
          option.value = format.id;
          option.textContent = format.resolution;
          videoAndAudioSelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.textContent = "No Video + Audio formats available";
        option.disabled = true;
        videoAndAudioSelect.appendChild(option);
      }
  
      // Populate Video Only options
      if (qualities.videoOnly.length > 0) {
        qualities.videoOnly.forEach((format) => {
          const option = document.createElement("option");
          option.value = format.id;
          option.textContent = `${format.resolution} (${format.size})`;
          videoOnlySelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.textContent = "No Video Only formats available";
        option.disabled = true;
        videoOnlySelect.appendChild(option);
      }
  
      // Populate Audio Only options
      if (qualities.audioOnly.length > 0) {
        qualities.audioOnly.forEach((format) => {
          const option = document.createElement("option");
          option.value = format.id;
          option.textContent = `${format.resolution} (${format.size})`;
          audioOnlySelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.textContent = "No Audio Only formats available";
        option.disabled = true;
        audioOnlySelect.appendChild(option);
      }
  
      statusDiv.innerHTML = "<p class='success'>Qualities fetched successfully!</p>";
    } catch (error) {
      console.error(error);
      statusDiv.innerHTML = "<p class='error'>Failed to fetch qualities. Please try again.</p>";
    }
  });
  
  document.getElementById("downloadBtn").addEventListener("click", async () => {
    const videoUrl = document.getElementById("videoUrl").value;
    const videoAndAudioSelect = document.getElementById("videoAndAudioSelect");
    const videoOnlySelect = document.getElementById("videoOnlySelect");
    const audioOnlySelect = document.getElementById("audioOnlySelect");
  
    const selectedQuality =
      videoAndAudioSelect.value || videoOnlySelect.value || audioOnlySelect.value;
  
    const statusDiv = document.getElementById("status");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
  
    if (!videoUrl || !selectedQuality) {
      statusDiv.innerHTML = "<p class='error'>Please select a quality!</p>";
      return;
    }
  
    statusDiv.innerHTML = "";
    document.getElementById("progress-container").style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "Starting download...";
  
    try {
      const response = await fetch("http://localhost:3000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl, formatId: selectedQuality }),
      });
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
  
        chunk.split("\n").forEach((line) => {
          if (line.trim()) {
            try {
              const progressData = JSON.parse(line.trim());
              if (progressData.progress) {
                const percentage = progressData.progress;
                progressBar.style.width = `${percentage}%`;
                progressText.textContent = `Downloading: ${percentage.toFixed(
                  2
                )}%`;
              }
            } catch (e) {
              // Ignore JSON parsing errors for partial data
            }
          }
        });
      }
  
      progressBar.style.width = "100%";
      progressText.textContent = "Download complete!";
      statusDiv.innerHTML = "<p class='success'>Download completed successfully!</p>";
    } catch (error) {
      statusDiv.innerHTML = "<p class='error'>Something went wrong!</p>";
      console.error(error);
    }
  });
  