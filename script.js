// -------------------------------------
// CONFIG
// -------------------------------------
const API_BASE = "https://buzztalk-gateway.logustrancy.workers.dev";

// -------------------------------------
// LOAD PHOTOS (The Core Function)
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
// QR SCANNER (SIMPLE VERSION - LIKE YOUR TEST FILE)
// -------------------------------------
let qrScanner = null;

function scanQR() {
  // 1. Show the modal
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; 

  // 2. Initialize the scanner library
  if (!qrScanner) {
    qrScanner = new Html5Qrcode("qr-reader");
  }

  // 3. Get Cameras and Start (Just like your test file)
  Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
      
      // Try to find the "back" camera, otherwise just use the first one (cams[0])
      const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;

      qrScanner.start(
        cameraId, 
        {
          fps: 10,    // Same as your test file
          qrbox: 250  // Same as your test file
        },
        (decodedText) => {
          // SUCCESS!
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Scanning... ignore errors per frame
        }
      ).catch(err => {
        alert("Could not start camera: " + err);
        closeQR();
      });
    } else {
      alert("No cameras found.");
      closeQR();
    }
  }).catch(err => {
    alert("Camera permission issue.");
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

  // 4. Auto-trigger "View My Photos"
  loadPhotos();
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // Enable scroll again

  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
    }).catch(err => console.log(err));
  }
}
