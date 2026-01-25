// -------------------------------------
// CONFIG
// -------------------------------------
const API_BASE =
  "https://buzztalk-gateway.logustrancy.workers.dev";

// -------------------------------------
// LOAD PHOTOS
// -------------------------------------
async function loadPhotos() {
  const uidInput = document.getElementById("uid");
  const uid = uidInput.value.trim();

  if (!uid) {
    alert("Please enter your Unique ID");
    return;
  }

  const loading = document.getElementById("loading");
  const gallery = document.getElementById("gallery");

  gallery.innerHTML = "";
  loading.classList.remove("hidden");

  try {
    const response = await fetch(
      `${API_BASE}/photos?uid=${encodeURIComponent(uid)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch photos");
    }

    const data = await response.json();
    loading.classList.add("hidden");

    if (!data.photos || data.photos.length === 0) {
      gallery.innerHTML =
        "<p style='text-align:center'>No photos found for this ID.</p>";
      return;
    }

    renderGallery(data.photos);

  } catch (error) {
    loading.classList.add("hidden");
    gallery.innerHTML =
      "<p style='text-align:center;color:red'>Something went wrong.</p>";
    console.error(error);
  }
}

// -------------------------------------
// RENDER GALLERY
// -------------------------------------
function renderGallery(photoUrls) {
  const gallery = document.getElementById("gallery");

  photoUrls.forEach(url => {
    const div = document.createElement("div");
    div.className = "photo";

    div.innerHTML = `
      <img src="${url}" loading="lazy" alt="Event photo">
      <a href="${url}" download target="_blank">⬇ Download</a>
    `;

    gallery.appendChild(div);
  });
}

// -------------------------------------
// AUTO LOAD FROM URL (?id=)
// -------------------------------------
(function autoFillFromURL() {
  const params = new URLSearchParams(window.location.search);
  const idFromQR = params.get("id");

  if (idFromQR && idFromQR.trim() !== "") {
    document.getElementById("uid").value = idFromQR.trim();
    loadPhotos();
  }
})();

// -------------------------------------
// QR SCANNER (SAFE & UNLOCKABLE)
// -------------------------------------
let qrScanner = null;
let cameras = [];

// Load cameras on page load
window.addEventListener("load", async () => {
  try {
    cameras = await Html5Qrcode.getCameras();
    const select = document.getElementById("cameraSelect");

    cameras.forEach((cam, i) => {
      const opt = document.createElement("option");
      opt.value = cam.id;
      opt.text = cam.label || `Camera ${i + 1}`;
      select.appendChild(opt);
    });

  } catch (e) {
    alert("Camera access not available");
  }
});

async function scanQR() {
  const reader = document.getElementById("qr-reader");
  const select = document.getElementById("cameraSelect");

  if (!select.value) {
    alert("Please select a camera first");
    return;
  }

  reader.style.display = "block";
  reader.innerHTML = "";

  if (qrScanner) {
    await qrScanner.stop().catch(() => {});
  }

  qrScanner = new Html5Qrcode("qr-reader");

  qrScanner.start(
    select.value,
    {
      fps: 12,
      qrbox: 240
    },
    (decodedText) => {
      // ✅ READ ONLY RAW TEXT
      const uid = decodedText.trim();

      qrScanner.stop().catch(() => {});
      reader.style.display = "none";

      document.getElementById("uid").value = uid;
      loadPhotos(); // SAME AS CLICKING VIEW
    },
    () => {}
  );
}


// -------------------------------------
// CLOSE QR (CRITICAL – PREVENT DARK LOCK)
// -------------------------------------
function closeQR() {
  if (qrScanner) {
    qrScanner.stop().catch(() => {});
    qrScanner = null;
  }
  document.getElementById("qrModal").classList.add("hidden");
}
