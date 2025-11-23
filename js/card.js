// card.js
// Public read-only card with "Save Contact" (.vcf)

// ----- Read card ID from URL -----
const viewUrl = new URL(window.location.href);
const cardId = viewUrl.searchParams.get("id");
const viewRoot = document.getElementById("cardView");

if (!window.sb) {
  console.error("Supabase client not found in card.html.");
}

// -------- Helpers --------
async function fetchCard() {
  if (!cardId) {
    viewRoot.innerHTML =
      "<p class='public-error'>No card ID provided.</p>";
    return null;
  }

  const { data, error } = await window.sb
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (error) {
    console.error(error);
    viewRoot.innerHTML =
      "<p class='public-error'>Error loading card.</p>";
    return null;
  }

  if (!data) {
    viewRoot.innerHTML =
      "<p class='public-error'>Card not found.</p>";
    return null;
  }

  return data;
}

function sanitize(text) {
  return (text || "").replace(/\r?\n/g, " ");
}

async function imageUrlToDataURL(url) {
  try {
    const resp = await fetch(url, { mode: "cors" });
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Unable to embed photo into VCF:", e);
    return null;
  }
}

function buildVCard(data, photoDataUrl) {
  const lines = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  const fullName = sanitize(
    data.title ||
      data.handle ||
      ""
  );
  lines.push(`FN:${fullName}`);

  const tel = (data.country_code || "") + (data.phone || "");
  if (tel.trim()) {
    lines.push(`TEL;TYPE=CELL:${tel}`);
  }

  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${sanitize(data.email)}`);
  }

  if (data.org) {
    lines.push(`ORG:${sanitize(data.org)}`);
  }

  if (data.role) {
    lines.push(`TITLE:${sanitize(data.role)}`);
  }

  if (photoDataUrl) {
    const base64 = photoDataUrl.split(",")[1] || "";
    if (base64) {
      lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${base64}`);
    }
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

async function handleSaveContact(data) {
  let photoDataUrl = null;

  if (data.photo_url) {
    photoDataUrl = await imageUrlToDataURL(data.photo_url);
  }

  const vcf = buildVCard(data, photoDataUrl);
  const blob = new Blob([vcf], {
    type: "text/vcard;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  const safeName =
    sanitize(data.title || data.handle || "contact")
      .replace(/[^\w\-]+/g, "_") || "contact";

  a.download = `${safeName}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------- Render --------
async function renderPublicCard() {
  const data = await fetchCard();
  if (!data) return;

  const photoHtml = data.photo_url
    ? `<img src="${data.photo_url}" class="public-photo" alt="Profile photo" />`
    : "";

  const handle = sanitize(data.handle || "@user");
  const title = sanitize(data.title || "");
  const subtitle = sanitize(data.subtitle || "");

  let linksHTML = "";

  if (Array.isArray(data.links) && data.links.length > 0) {
    linksHTML = data.links
      .filter(l => l && l.label && l.url)
      .map(
        l => `
          <a href="${l.url}" class="public-link" target="_blank" rel="noopener">
            ${sanitize(l.label)}
          </a>
        `
      )
      .join("");
  }

  viewRoot.innerHTML = `
    <div class="public-card-inner">
      <div class="public-top">
        ${photoHtml}
        <div class="public-text">
          <div class="public-handle">${handle}</div>
          ${
            title
              ? `<div class="public-title">${title}</div>`
              : ""
          }
          ${
            subtitle
              ? `<div class="public-subtitle">${subtitle}</div>`
              : ""
          }
        </div>
      </div>
      <div class="public-links">
        ${linksHTML}
        <button class="public-link save-contact-btn">
          Save Contact
        </button>
      </div>
    </div>
  `;

  const saveBtn = viewRoot.querySelector(".save-contact-btn");
  saveBtn.addEventListener("click", () => handleSaveContact(data));
}

renderPublicCard();
