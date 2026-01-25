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
// QR SCANNER (AGGRESSIVE CLEANUP VERSION)
// -------------------------------------
let qrScanner = null;

function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; 

  // Wait for modal to render
  setTimeout(startScanner, 300);
}

function startScanner() {
  // 1. Force cleanup of any lingering instances
  if (qrScanner) {
    qrScanner.clear().catch(e => console.log(e));
    qrScanner = null;
  }

  // 2. Create new instance
  qrScanner = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;

      qrScanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: 250
        },
        (decodedText) => {
          // Success
          closeQR();
          const cleanText = decodedText.trim();
          document.getElementById("uid").value = cleanText;
          loadPhotos();
        },
        (errorMessage) => {
          // Scanning...
        }
      ).catch(err => {
        handleCameraError(err);
      });
    } else {
      alert("No cameras found.");
      closeQR();
    }
  }).catch(err => {
    handleCameraError(err);
  });
}

function handleCameraError(err) {
  console.error(err);
  
  let msg = "Camera error.";
  if (err.name === "NotReadableError") {
    msg = "Camera is in use by another app. Please close other apps/tabs and try again.";
  } else if (err.name === "NotAllowedError") {
    msg = "Camera permission denied. Please allow camera access.";
  }

  alert(msg);
  closeQR();
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";

  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
    }).catch(() => {
      // Force kill if library fails
      qrScanner.clear();
    });
  }
}
