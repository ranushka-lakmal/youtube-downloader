document.addEventListener("DOMContentLoaded", () => {
  const fetchButton = document.getElementById("fetchButton");
  const urlInput = document.getElementById("urlInput");
  const qualityContainer = document.getElementById("qualityContainer");
  const audioOnlySection = document.getElementById("audioOnlySection");
  const videoAudioSection = document.getElementById("videoAudioSection");
  const audioOnlyTable = document.getElementById("audioOnlyTable");
  const videoAudioTable = document.getElementById("videoAudioTable");
  const errorMessage = document.getElementById("errorMessage");

  fetchButton.addEventListener("click", async () => {
    const url = urlInput.value.trim();

    if (!url) {
      alert("Please enter a valid YouTube URL.");
      return;
    }

    qualityContainer.classList.add("hidden");
    audioOnlySection.classList.add("hidden");
    videoAudioSection.classList.add("hidden");
    errorMessage.classList.add("hidden");
    audioOnlyTable.innerHTML = "";
    videoAudioTable.innerHTML = "";

    try {
      const response = await fetch(`/get-qualities?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        const qualities = data.qualities.split("\n").slice(3); // Skip headers

        qualities.forEach((line) => {
          const columns = line.trim().split(/\s+/);

          if (columns.length >= 3) {
            const formatId = columns[0];
            const quality = columns[1];
            const fileType = columns.slice(2).join(" ");

            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${quality}</td>
              <td>${fileType}</td>
              <td><button onclick="downloadVideo('${url}', '${formatId}')">Download</button></td>
            `;

            if (fileType.includes("audio")) {
              audioOnlyTable.appendChild(row);
              audioOnlySection.classList.remove("hidden");
            } else if (fileType.includes("video")) {
              videoAudioTable.appendChild(row);
              videoAudioSection.classList.remove("hidden");
            }
          }
        });

        qualityContainer.classList.remove("hidden");
      } else {
        errorMessage.textContent = data.message || "An error occurred while fetching qualities.";
        errorMessage.classList.remove("hidden");
      }
    } catch (err) {
      console.error(err);
      errorMessage.textContent = "Failed to fetch video qualities. Please check the console for details.";
      errorMessage.classList.remove("hidden");
    }
  });
});

async function downloadVideo(url, formatId) {
  const downloadUrl = `/download?url=${encodeURIComponent(url)}&formatId=${formatId}`;
  window.location.href = downloadUrl;
}
