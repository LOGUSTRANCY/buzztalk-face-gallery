// -------------------------------------
// CONFIG — CHANGE ONLY THIS IF NEEDED
// -------------------------------------

const API_BASE =
  "https://buzztalk-gateway.logustrancy.workers.dev";

// -------------------------------------
// MAIN FUNCTION
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

  // Reset UI
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
      "<p style='text-align:center;color:red'>Something went wrong. Please try again.</p>";
    console.error(error);
  }
}

// -------------------------------------
// RENDER PHOTOS (PINTEREST STYLE)
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
// OPTIONAL: AUTO-LOAD ID FROM URL (?id=)
// -------------------------------------

(function autoFillFromURL() {
  const params = new URLSearchParams(window.location.search);
  const idFromQR = params.get("id");

  if (idFromQR && idFromQR.trim() !== "") {
    document.getElementById("uid").value = idFromQR.trim();
    loadPhotos(); // auto-load ONLY for QR
  }
})();
let qrScanner;
let currentCamera = "environment";

function scanQR() {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");

  setTimeout(() => {
    qrScanner = new Html5Qrcode("qr-reader");
    startCamera();
  }, 300); // 🔑 critical delay
}

function startCamera() {
  qrScanner.start(
    { facingMode: currentCamera },
    {
      fps: 10,
      qrbox: 250
    },
    onQRSuccess,
    () => {}
  );
}

function onQRSuccess(decodedText) {
  qrScanner.stop().catch(() => {});
  closeQR();

  try {
    const url = new URL(decodedText);
    const uid = url.searchParams.get("id");

    if (!uid) {
      alert("QR code does not contain an ID");
      return;
    }

    document.getElementById("uid").value = uid;
    loadPhotos();
  } catch {
    alert("Invalid QR code");
  }
}

function switchCamera() {
  if (!qrScanner) return;

  qrScanner.stop().then(() => {
    currentCamera =
      currentCamera === "environment" ? "user" : "environment";
    startCamera();
  });
}

function closeQR() {
  if (qrScanner) qrScanner.stop().catch(() => {});
  document.getElementById("qrModal").classList.add("hidden");
}
