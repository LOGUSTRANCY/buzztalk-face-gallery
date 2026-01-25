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
let camIndex = 0;

async function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

  // Create fresh scanner EVERY TIME
  qrScanner = new Html5Qrcode("qr-reader");

  cameras = await Html5Qrcode.getCameras();
  if (!cameras.length) {
    alert("No camera found");
    closeQR();
    return;
  }

  fillCameraList();
  startCamera();
}

function fillCameraList() {
  const sel = document.getElementById("cameraSelect");
  sel.innerHTML = "";

  cameras.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.text = c.label || `Camera ${i+1}`;
    sel.appendChild(opt);
  });

  sel.onchange = () => {
    camIndex = Number(sel.value);
    restartCamera();
  };
}

function startCamera() {
  qrScanner.start(
    cameras[camIndex].id,
    { fps: 15, qrbox: 220 },
    text => {
      qrScanner.stop();
      closeQR();

      const uid = text.trim(); // 🔑 ONLY TEXT
      document.getElementById("uid").value = uid;
      loadPhotos();
    }
  );
}

function restartCamera() {
  qrScanner.stop().then(startCamera);
}

function switchCamera() {
  camIndex = (camIndex + 1) % cameras.length;
  restartCamera();
}

function closeQR() {
  if (qrScanner) {
    qrScanner.stop().catch(()=>{});
    qrScanner = null;
  }
  document.getElementById("qrModal").classList.add("hidden");
  document.body.style.overflow = "";
}

