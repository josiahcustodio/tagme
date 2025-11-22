// card.js
// Public read-only card, reading from localStorage by id

const urlPub = new URL(window.location.href);
const cardId = urlPub.searchParams.get("id");
const viewRoot = document.getElementById("cardView");

if (!cardId) {
  viewRoot.innerHTML = "<p style='text-align:center;'>No card ID provided.</p>";
} else {
  const data = JSON.parse(localStorage.getItem("card_" + cardId) || "{}");

  const photoSrc = data.photo || "";
  const handle = data.handle || "@yourhandle";
  const title = data.title || "";
  const subtitle = data.subtitle || "";
  const links = Array.isArray(data.links) ? data.links : [];

  viewRoot.innerHTML = `
    <div class="public-top">
      ${photoSrc ? `<img src="${photoSrc}" class="public-photo" alt="Profile photo" />` : ""}
      <h2>${handle}</h2>
      ${title ? `<h4>${title}</h4>` : ""}
      ${subtitle ? `<p>${subtitle}</p>` : ""}
    </div>
    <div class="public-links">
      ${
        links.length
          ? links
              .filter(l => l.label && l.url)
              .map(l => `<a href="${l.url}" class="public-link" target="_blank" rel="noopener noreferrer">${l.label}</a>`)
              .join("")
          : "<p style='text-align:center;font-size:0.85rem;color:rgba(255,255,255,0.7);'>No links added yet.</p>"
      }
    </div>
  `;
}
