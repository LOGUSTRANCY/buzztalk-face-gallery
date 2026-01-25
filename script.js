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
// QR SCANNER (TIMING FIXED)
// -------------------------------------
let qrScanner = null;

function scanQR() {
  // 1. Show the modal FIRST
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent scrolling

  // 2. WAIT for the modal to be visible before starting scanner
  // This prevents the "Camera Not Loading" error
  setTimeout(startScannerLogic, 300);
}

function startScannerLogic() {
  // If scanner already exists, clear it first to avoid duplicates
  if (qrScanner) {
    qrScanner.clear().then(() => {
      initNewScanner();
    }).catch(err => {
      initNewScanner();
    });
  } else {
    initNewScanner();
  }
}

function initNewScanner() {
  // Create fresh instance
  qrScanner = new Html5Qrcode("qr-reader");

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      // Pick back camera if available, else first one
      const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;

      qrScanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: 250
        },
        (decodedText) => {
          // Success!
          closeQR(); // Close immediately
          
          const cleanText = decodedText.trim();
          document.getElementById("uid").value = cleanText;
          loadPhotos(); // Auto-load
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      ).catch(err => {
        alert("Camera start failed: " + err);
        closeQR();
      });
    } else {
      alert("No cameras found.");
      closeQR();
    }
  }).catch(err => {
    alert("Camera permissions denied.");
    closeQR();
  });
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";

  if (qrScanner) {
    // Stop and clear the scanner so it's fresh next time
    qrScanner.stop().then(() => {
      qrScanner.clear();
    }).catch(err => console.log(err));
  }
}
