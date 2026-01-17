const WORKER_URL = "https://buzztalk-gateway.logustrancy.workers.dev/match";

async function scanFace() {
  const fileInput = document.getElementById("selfie");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload a selfie");
    return;
  }

  document.getElementById("gallery").innerHTML = "";
  document.getElementById("loading").classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    document.getElementById("loading").classList.add("hidden");

    if (!data.photos || data.photos.length === 0) {
      document.getElementById("gallery").innerHTML =
        "<p style='text-align:center'>No matching photos found.</p>";
      return;
    }

    renderPhotos(data.photos);

  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    alert("Something went wrong. Try again.");
    console.error(err);
  }
}

function renderPhotos(photos) {
  const gallery = document.getElementById("gallery");

  photos.forEach(url => {
    const div = document.createElement("div");
    div.className = "photo";

    div.innerHTML = `
      <img src="${url}" loading="lazy" />
      <a href="${url}" download target="_blank">⬇ Download</a>
    `;

    gallery.appendChild(div);
  });
}

