const WORKER_MATCH =
  "https://buzztalk-gateway.YOURNAME.workers.dev/match";

async function scan() {
  const file = document.getElementById("selfie").files[0];
  if (!file) return alert("Upload a selfie");

  document.getElementById("gallery").innerHTML = "";
  document.getElementById("loading").classList.remove("hidden");

  const fd = new FormData();
  fd.append("photo", file);

  const res = await fetch(WORKER_MATCH, {
    method: "POST",
    body: fd
  });

  const data = await res.json();
  document.getElementById("loading").classList.add("hidden");

  if (!data.photos || data.photos.length === 0) {
    document.getElementById("gallery").innerHTML =
      "<p style='text-align:center'>No photos found</p>";
    return;
  }

  renderPhotos(data.photos);
}

function renderPhotos(urls) {
  const gallery = document.getElementById("gallery");

  urls.forEach(url => {
    const div = document.createElement("div");
    div.className = "photo";
    div.innerHTML = `
      <img src="${url}" loading="lazy">
      <a href="${url}" download target="_blank">⬇ Download</a>
    `;
    gallery.appendChild(div);
  });
}
