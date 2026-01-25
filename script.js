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
// QR SCANNER (CLEAN & MOBILE READY)
// -------------------------------------
let qrScanner = null;
let cameras = [];
let camIndex = 0;

async function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent background scroll

  // 1. Get Cameras
  try {
    cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) {
      alert("No cameras found");
      closeQR();
      return;
    }
    
    // 2. Populate Dropdown
    const select = document.getElementById("cameraSelect");
    select.innerHTML = "";
    cameras.forEach((c, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.text = c.label || `Camera ${i+1}`;
      select.appendChild(opt);
    });

    // 3. Auto-select Back Camera
    camIndex = cameras.findIndex(c => c.label.toLowerCase().includes("back"));
    if (camIndex === -1) camIndex = cameras.length - 1;
    select.value = camIndex;

    select.onchange = () => {
      camIndex = Number(select.value);
      startCamera();
    };

    // 4. Start
    qrScanner = new Html5Qrcode("qr-reader");
    startCamera();

  } catch (err) {
    alert("Camera permission denied");
    closeQR();
  }
}

function startCamera() {
  qrScanner.start(
    cameras[camIndex].id,
    { fps: 15, qrbox: 250, aspectRatio: 1.0 },
    (text) => {
      // SUCCESS
      const uid = text.trim(); 
      if(uid) {
        qrScanner.stop().catch(()=>{});
        closeQR();
        document.getElementById("uid").value = uid;
        loadPhotos();
      }
    },
    () => {} // Ignore failures per frame
  ).catch(err => {
    // If start fails, just retry or ignore
    console.log("Camera start error", err);
  });
}

function switchCamera() {
  camIndex = (camIndex + 1) % cameras.length;
  document.getElementById("cameraSelect").value = camIndex;
  if(qrScanner) {
    qrScanner.stop().then(startCamera).catch(startCamera);
  }
}

function closeQR() {
  if (qrScanner) {
    qrScanner.stop().catch(()=>{});
    qrScanner.clear();
    qrScanner = null;
  }
  document.getElementById("qrModal").classList.add("hidden");
  document.body.style.overflow = ""; // Restore scroll
}
