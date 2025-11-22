// card.js
// Public read-only cloud card (Supabase-only, no localStorage)

// ----- Read card ID from URL -----
const urlPub = new URL(window.location.href);
const cardId = urlPub.searchParams.get("id");
const viewRoot = document.getElementById("cardView");

// ----- Supabase Client (loaded from HTML) -----
/*
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = "YOUR_URL";
  const SUPABASE_ANON_KEY = "YOUR_KEY";
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
*/

async function loadCard() {
  if (!cardId) {
    viewRoot.innerHTML = "<p style='text-align:center;'>No card ID provided.</p>";
    return;
  }

  // Fetch the card from Supabase
  const { data, error } = await supabase
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

  // Build the public view
  const photo = data.photo_url
    ? `<img src="${data.photo_url}" class="public-photo" alt="Profile Photo" />`
    : "";

  const title = data.title ? `<h4>${data.title}</h4>` : "";
  const subtitle = data.subtitle ? `<p>${data.subtitle}</p>` : "";

  // Build links
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
  } else {
    linksHTML = `
      <p style="text-align:center; color:rgba(255,255,255,0.6); font-size:0.85rem;">
        No links added.
      </p>
    `;
  }

  viewRoot.innerHTML = `
    <div class="public-top">
      ${photo}
      <h2>${data.handle || "@user"}</h2>
      ${title}
      ${subtitle}
    </div>
    <div class="public-links">
      ${linksHTML}
    </div>
  `;
}

loadCard();
