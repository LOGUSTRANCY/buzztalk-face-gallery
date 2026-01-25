// -------------------------------------
// CONFIG
// -------------------------------------
const API_BASE = "https://buzztalk-gateway.logustrancy.workers.dev";

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

    if (!response.ok) throw new Error("Fetch failed");

    const data = await response.json();
    loading.classList.add("hidden");

    if (!data.photos || data.photos.length === 0) {
      gallery.innerHTML = "<p style='text-align:center'>No photos found.</p>";
      return;
    }

    renderGallery(data.photos);

  } catch (error) {
    loading.classList.add("hidden");
    gallery.innerHTML = "<p style='text-align:center;color:red'>Error loading photos.</p>";
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
// AUTO LOAD ID FROM URL
// -------------------------------------
(function autoFill() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    document.getElementById("uid").value = id;
    loadPhotos();
  }
})();

// -------------------------------------
// QR SCANNER (WINDOWS FIX + FLIP)
// -------------------------------------
let html5QrCode = null;
let currentCameraId = null;
let allCameras = [];
let cameraIndex = 0;

async function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // NUCLEAR OPTION: Kill stuck browser streams
  if (window.stream) {
    window.stream.getTracks().forEach(track => track.stop());
  }

  // Wait 300ms for UI, then start
  setTimeout(initScanner, 300);
}

function initScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      allCameras = devices;
      
      // Default to back camera (usually last in list on Android)
      // or find one labeled "back"
      let backCamIndex = devices.findIndex(d => d.label.toLowerCase().includes("back"));
      if (backCamIndex === -1) backCamIndex = devices.length - 1;
      
      cameraIndex = backCamIndex;
      startCamera(allCameras[cameraIndex].id);
    } else {
      alert("No cameras found.");
      forceCloseQR();
    }
  }).catch(err => {
    handleError(err);
  });
}

function startCamera(cameraId) {
  currentCameraId = cameraId;
  
  html5QrCode.start(
    cameraId,
    {
      fps: 10,
      qrbox: 250,
      // TRIANGLE FIX: Do not force aspectRatio: 1.0
      // Let the library decide based on the device
    },
    (decodedText) => {
      forceCloseQR();
      const cleanText = decodedText.trim();
      document.getElementById("uid").value = cleanText;
      loadPhotos();
    },
    () => {}
  ).catch(err => {
    handleError(err);
  });
}

function switchCamera() {
  if (!html5QrCode || allCameras.length < 2) {
    alert("Only one camera available.");
    return;
  }

  // Stop current stream before switching
  html5QrCode.stop().then(() => {
    // Increment index
    cameraIndex = (cameraIndex + 1) % allCameras.length;
    startCamera(allCameras[cameraIndex].id);
  }).catch(err => {
    console.error("Switch failed", err);
    // Try to force restart if stop fails
    startCamera(allCameras[cameraIndex].id);
  });
}

function handleError(err) {
  console.error("Camera Error:", err);
  if (err.name === "NotReadableError") {
    alert("Camera blocked. Close other apps using camera.");
  } else if (err.name === "NotAllowedError") {
    alert("Permission denied. Reset browser permissions.");
  } else {
    alert("Error: " + err.name);
  }
  forceCloseQR();
}

function forceCloseQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";

  if (html5QrCode) {
    // Try to stop normally
    try {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(() => {
          html5QrCode.clear();
        });
      } else {
        html5QrCode.clear();
      }
    } catch (e) {
      // Ignore errors
    }
  }
}

window.closeQR = forceCloseQR;
