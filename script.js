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
// QR SCANNER (SQUARE + FLIP FIXED)
// -------------------------------------
let html5QrCode = null;
let allCameras = [];
let cameraIndex = 0;

async function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // 1. ZOMBIE KILLER: Stop existing browser streams
  if (window.stream) {
    window.stream.getTracks().forEach(track => track.stop());
  }
  
  // 2. Clear previous instance safely
  if (html5QrCode) {
    try { await html5QrCode.clear(); } catch(e) {}
    html5QrCode = null;
  }

  // 3. Wait for UI then init
  setTimeout(initScanner, 300);
}

function initScanner() {
  html5QrCode = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      allCameras = devices;
      
      // Default to back camera (last one usually)
      cameraIndex = devices.length - 1; 
      
      // Start the camera
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
  html5QrCode.start(
    cameraId,
    {
      fps: 10,
      qrbox: 250,
      aspectRatio: 1.0 // <--- FORCES SQUARE SHAPE
    },
    (decodedText) => {
      // Success
      forceCloseQR();
      const cleanText = decodedText.trim();
      document.getElementById("uid").value = cleanText;
      loadPhotos();
    },
    (errorMessage) => {
      // Ignore scan errors
    }
  ).catch(err => {
    handleError(err);
  });
}

function switchCamera() {
  // 1. Check if we have cameras to switch to
  if (!allCameras || allCameras.length < 2) {
    alert("Only one camera available.");
    return;
  }

  // 2. Stop current stream
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      // 3. Increment index and wrap around
      cameraIndex = (cameraIndex + 1) % allCameras.length;
      
      // 4. Start new camera
      startCamera(allCameras[cameraIndex].id);
    }).catch(err => {
      console.error("Stop failed during switch", err);
      // Try to force restart anyway
      cameraIndex = (cameraIndex + 1) % allCameras.length;
      startCamera(allCameras[cameraIndex].id);
    });
  }
}

function handleError(err) {
  console.error("Camera Error:", err);
  
  if (err.name === "NotReadableError") {
    alert("Camera busy. Close other browser tabs/apps.");
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
    // Try to stop gracefully, then clear
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

// Make globally available
window.switchCamera = switchCamera;
window.forceCloseQR = forceCloseQR;
