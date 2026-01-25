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
// QR SCANNER (SIMPLE VERSION)
// -------------------------------------
let html5QrCode;

function scanQR() {
  // 1. Unhide the modal FIRST so the div is visible to the library
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Lock scroll

  // 2. Initialize library if not already done
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  // 3. Get Cameras and Start (Exact logic from your working test file)
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      
      // Try to select back camera, otherwise use the first one available
      let cameraId = devices[0].id;
      const backCam = devices.find(d => d.label.toLowerCase().includes("back"));
      if (backCam) {
        cameraId = backCam.id;
      }

      // Start scanning
      html5QrCode.start(
        cameraId, 
        {
          fps: 10,
          qrbox: 250
        },
        (decodedText) => {
          // --- SUCCESS CALLBACK ---
          console.log(`Scan result: ${decodedText}`);
          
          // Stop scanning
          closeQR();

          // Auto-fill input
          const cleanText = decodedText.trim();
          document.getElementById("uid").value = cleanText;

          // Auto-trigger view photos
          loadPhotos();
        },
        (errorMessage) => {
          // Parse error, ignore it
        }
      ).catch(err => {
        // Start failed
        alert("Error starting camera: " + err);
        closeQR();
      });
    } else {
      alert("No cameras found.");
      closeQR();
    }
  }).catch(err => {
    alert("Camera permission error: " + err);
    closeQR();
  });
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // Unlock scroll

  if (html5QrCode) {
    // Stop the camera
    html5QrCode.stop().then(() => {
      // clear() removes the video element from the DOM to reset it
      html5QrCode.clear();
    }).catch(err => {
      console.log("Failed to stop/clear", err);
    });
  }
}
