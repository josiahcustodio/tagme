// card.js
// Public read-only cloud card (with VCF Save Contact button)

// ----- Read card ID from URL -----
const urlPub = new URL(window.location.href);
const cardId = urlPub.searchParams.get("id");
const viewRoot = document.getElementById("cardView");

async function loadCard() {
  if (!cardId) {
    viewRoot.innerHTML = "<p style='text-align:center;'>No card ID provided.</p>";
    return;
  }

  const { data, error } = await window.sb
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (error) {
    console.error(error);
    viewRoot.innerHTML = "<p style='text-align:center;'>Error loading card.</p>";
    return;
  }

  if (!data) {
    viewRoot.innerHTML = "<p style='text-align:center;'>Card not found.</p>";
    return;
  }

  // ===== VCF GENERATION =====
  function generateVCF() {
    let vcf = `BEGIN:VCARD
VERSION:3.0
FN:${data.handle || ""}
TITLE:${data.role || ""}
ORG:${data.org || ""}
TEL;TYPE=CELL:${data.country_code || ""}${data.phone || ""}
EMAIL:${data.email || ""}
PHOTO;VALUE=URI:${data.photo_url || ""}
END:VCARD`;

    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.handle || "contact"}.vcf`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // ===== PHOTO =====
  const photo = data.photo_url
    ? `<img src="${data.photo_url}" class="public-photo" />`
    : "";

  // ===== LINKS =====
  let linksHTML = "";

  if (Array.isArray(data.links) && data.links.length > 0) {
    linksHTML = data.links
      .filter(l => l.label && l.url)
      .map(
        l => `
        <a href="${l.url}" class="public-link" target="_blank">
          ${l.label}
        </a>
      `
      )
      .join("");
  }

  // ===== SAVE CONTACT BUTTON =====
  const saveContactBtn = `
    <button class="public-save-contact" id="saveContactBtn">
      Save Contact
    </button>
  `;

  // ===== RENDER CARD =====
  viewRoot.innerHTML = `
    <div class="public-top">
      ${photo}
      <h2>${data.handle || "@user"}</h2>
      <h4>${data.title || ""}</h4>
      <p>${data.subtitle || ""}</p>
    </div>

    <div class="public-links">
      ${linksHTML}
    </div>

    <div class="public-save-section">
      ${saveContactBtn}
    </div>
  `;

  // Attach event to Save Contact button
  document.getElementById("saveContactBtn").onclick = generateVCF;
}

loadCard();
