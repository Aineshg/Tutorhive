const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("videoFile");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    setStatus("Choose a video file first.", true);
    return;
  }

  const formData = new FormData();
  formData.append("video", file);

  setStatus("Analyzing video. First run may take longer while model downloads.");
  resultEl.classList.add("hidden");

  try {
    const response = await fetch("/api/analyze-video", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Analysis failed");
    }

    renderResult(payload);
    setStatus("Analysis complete.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "status error" : "status";
}

function renderResult(data) {
  document.getElementById("verdict").textContent = data.verdict;
  document.getElementById("aiPct").textContent = data.ai_content_percentage;
  document.getElementById("confidence").textContent = data.confidence_percentage;
  document.getElementById("misIndex").textContent = data.misinterpretation_index;
  document.getElementById("frames").textContent = data.analyzed_frames;
  document.getElementById("model").textContent = data.model;

  const highlights = document.getElementById("highlights");
  highlights.innerHTML = "";
  data.frame_highlights.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `Frame ${item.frame_index}: ${item.ai_probability_percentage}% AI probability`;
    highlights.appendChild(li);
  });

  const notes = document.getElementById("notes");
  notes.innerHTML = "";
  data.notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    notes.appendChild(li);
  });

  resultEl.classList.remove("hidden");
}
