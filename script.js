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
// QR SCANNER (WINDOWS/PC COMPATIBLE)
// -------------------------------------
let html5QrCode = null;

function scanQR() {
  // 1. Show the Modal immediately
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; 

  // 2. Wait 300ms for UI to render before accessing Windows Webcam
  setTimeout(startWindowsCamera, 300);
}

function startWindowsCamera() {
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      // On Windows, devices[0] is usually the main webcam
      const cameraId = devices[0].id;

      // Init scanner if needed
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
      }

      html5QrCode.start(
        cameraId, 
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          // Success!
          forceCloseQR(); // Stop scanning immediately
          
          const cleanText = decodedText.trim();
          document.getElementById("uid").value = cleanText;
          loadPhotos();
        },
        (errorMessage) => {
          // Scanning... ignore frames
        }
      ).catch(err => {
        // ERROR: Camera is busy (Windows specific handling)
        console.error("Camera Start Error:", err);
        alert("Camera is busy or blocked. Check if Zoom/Teams is open.");
        
        // IMPORTANT: Do NOT call .stop(), just hide the UI
        hideModal();
      });
    } else {
      alert("No webcam found on this PC.");
      hideModal();
    }
  }).catch(err => {
    alert("Permission denied. Check browser settings.");
    hideModal();
  });
}

// -------------------------------------
// ROBUST CLOSE FUNCTION
// -------------------------------------
function forceCloseQR() {
  // Try to stop the camera, but don't wait for it if it hangs
  if (html5QrCode) {
    try {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.log("Stop error ignored", err));
      } else {
        html5QrCode.clear();
      }
    } catch (e) {
      console.log("Cleanup error ignored", e);
    }
  }
  hideModal();
}

// Helper to just hide UI instantly
function hideModal() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// Map the HTML button to this robust function
window.closeQR = forceCloseQR;
