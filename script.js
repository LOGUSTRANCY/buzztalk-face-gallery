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
const API_BASE =
  "https://buzztalk-gateway.logustrancy.workers.dev";

let qr;
let cameras = [];
let currentCamIndex = 0;

/* ---------------- LOAD PHOTOS ---------------- */

async function loadPhotos() {
  const uid = document.getElementById("uid").value.trim();
  if (!uid) return alert("Enter Unique ID");

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("gallery").innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/photos?uid=${uid}`);
    const data = await res.json();

    document.getElementById("loading").classList.add("hidden");

    if (!data.photos || data.photos.length === 0) {
      document.getElementById("gallery").innerHTML =
        "<p style='text-align:center'>No photos found</p>";
      return;
    }

    data.photos.forEach(url => {
      const div = document.createElement("div");
      div.className = "photo";
      div.innerHTML = `
        <img src="${url}" loading="lazy">
        <a href="${url}" download>⬇ Download</a>
      `;
      document.getElementById("gallery").appendChild(div);
    });

  } catch {
    alert("Failed to load photos");
  }
}

/* ---------------- QR SCAN ---------------- */

async function scanQR() {
  document.getElementById("qrModal").classList.remove("hidden");

  cameras = await Html5Qrcode.getCameras();
  if (!cameras.length) {
    alert("No camera found");
    return;
  }

  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";
  cameras.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.text = c.label || `Camera ${i+1}`;
    select.appendChild(opt);
  });

  qr = new Html5Qrcode("qr-reader");
  startCamera();
}

function startCamera() {
  const cam = cameras[currentCamIndex];

  qr.start(
    cam.id,
    { fps: 15, qrbox: 220 },
    decodedText => {
      const uid = decodedText.trim(); // 🔑 ONLY TEXT

      qr.stop();
      closeQR();

      document.getElementById("uid").value = uid;
      loadPhotos();
    }
  );
}

function switchCamera() {
  if (!qr) return;
  qr.stop().then(() => {
    currentCamIndex = (currentCamIndex + 1) % cameras.length;
    startCamera();
  });
}

function closeQR() {
  document.getElementById("qrModal").classList.add("hidden");
  if (qr) qr.stop().catch(() => {});
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
