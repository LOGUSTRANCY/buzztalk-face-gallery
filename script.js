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
// QR SCANNER (FIXED TIMING)
// -------------------------------------
let qrScanner = null;

function scanQR() {
  // 1. Show the modal immediately so the user sees something happening
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; 

  // 2. Wait 300ms for the modal to render fully before starting camera
  // THIS FIXES THE BLACK BOX ISSUE
  setTimeout(initScanner, 300);
}

function initScanner() {
  if (!qrScanner) {
    qrScanner = new Html5Qrcode("qr-reader");
  }

  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;

      qrScanner.start(
        cameraId, 
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore scan errors
        }
      ).catch(err => {
        console.error(err);
        alert("Camera failed to start. Please reset permissions.");
        closeQR();
      });
    } else {
      alert("No cameras found.");
      closeQR();
    }
  }).catch(err => {
    console.error(err);
    alert("Camera permission denied.");
    closeQR();
  });
}

function handleScanSuccess(text) {
  // 1. Clean the text
  const uid = text.trim();
  
  // 2. Close the scanner immediately
  closeQR();

  // 3. Auto-fill the input
  document.getElementById("uid").value = uid;

  // 4. Auto-trigger the view function
  loadPhotos();
}

function closeQR() {
  // 1. Force hide the modal IMMEDIATELY so the app doesn't feel stuck
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";

  // 2. Clean up the camera in the background
  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
    }).catch(err => console.log("Stop failed: ", err));
  }
}
