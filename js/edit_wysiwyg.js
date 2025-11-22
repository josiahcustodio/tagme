// edit_wysiwyg.js
// Cloud-only WYSIWYG editor using Supabase (no localStorage)
// Uses global client: window.sb (defined in edit.html)

// ----- Get / generate card ID from URL -----
const url = new URL(window.location.href);
let id = url.searchParams.get("id");

if (!id) {
  id = Math.random().toString(36).slice(2, 10);
  window.location.href = `edit.html?id=${id}`;
}

// ----- Single source of truth: "card" object in memory -----
let card = {
  id,
  handle: "@yourhandle",
  title: "Your title here",
  subtitle: "Short description here",
  photo_url: "",
  links: []
};

// ----- Load from Supabase -----
async function loadCardFromSupabase() {
  try {
    const { data, error } = await window.sb
      .from("cards")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading:", error);
    }

    if (data) {
      card = {
        id,
        handle: data.handle || "@yourhandle",
        title: data.title || "Your title here",
        subtitle: data.subtitle || "Short description here",
        photo_url: data.photo_url || "",
        links: Array.isArray(data.links) ? data.links : []
      };
    }
  } catch (err) {
    console.error("Unexpected load error:", err);
  }

  renderEditor();
}

// ----- Save to Supabase -----
async function saveFinal() {
  const cardData = {
    id,
    handle: card.handle,
    title: card.title,
    subtitle: card.subtitle,
    photo_url: card.photo_url,
    links: card.links
  };

  const { error } = await window.sb
    .from("cards")
    .upsert(cardData);

  if (error) {
    alert("Error saving: " + error.message);
  } else {
    alert("Saved to cloud!");
  }
}

// ----- Render Editor -----
function renderEditor() {
  const root = document.getElementById("editorCard");
  root.innerHTML = "";

  // ----- Header -----
  const header = document.createElement("div");
  header.className = "card-header";

  const photoWrap = document.createElement("div");
  photoWrap.className = "profile-photo-wrapper";

  const img = document.createElement("img");
  img.className = "profile-photo";
  img.src = card.photo_url || "";
  img.alt = "Profile photo";

  // CLICK TO UPLOAD IMAGE
  img.onclick = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";

    picker.onchange = async () => {
      const file = picker.files[0];
      if (!file) return;

      const fileName = `${id}_photo_${Date.now()}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await window.sb
        .storage
        .from("profile-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        return;
      }

      // Get public URL
      const { data } = window.sb
        .storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      card.photo_url = data.publicUrl;
      renderEditor();
    };

    picker.click();
  };

  const hint = document.createElement("div");
  hint.className = "profile-photo-hint";
  hint.textContent = "Tap to upload photo";

  photoWrap.appendChild(img);
  photoWrap.appendChild(hint);

  const textFields = document.createElement("div");
  textFields.className = "card-text-fields";

  // Handle
  const handleInput = document.createElement("input");
  handleInput.className = "card-input handle";
  handleInput.value = card.handle;
  handleInput.oninput = () => (card.handle = handleInput.value);

  // Title
  const titleInput = document.createElement("input");
  titleInput.className = "card-input title";
  titleInput.value = card.title;
  titleInput.oninput = () => (card.title = titleInput.value);

  // Subtitle
  const subInput = document.createElement("input");
  subInput.className = "card-input subtitle";
  subInput.value = card.subtitle;
  subInput.oninput = () => (card.subtitle = subInput.value);

  textFields.appendChild(handleInput);
  textFields.appendChild(titleInput);
  textFields.appendChild(subInput);

  header.appendChild(photoWrap);
  header.appendChild(textFields);
  root.appendChild(header);

  // Divider
  const divider = document.createElement("div");
  divider.className = "card-divider";
  root.appendChild(divider);

  // ----- Links -----
  const linksTitle = document.createElement("div");
  linksTitle.className = "links-area-title";
  linksTitle.textContent = "Links";
  root.appendChild(linksTitle);

  card.links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "link-row";

    const top = document.createElement("div");
    top.className = "link-row-top";

    const labelInput = document.createElement("input");
    labelInput.className = "link-label-input";
    labelInput.value = link.label || "";
    labelInput.oninput = () => (card.links[index].label = labelInput.value);

    const delBtn = document.createElement("button");
    delBtn.className = "link-delete-btn";
    delBtn.textContent = "×";
    delBtn.onclick = () => {
      card.links.splice(index, 1);
      renderEditor();
    };

    top.appendChild(labelInput);
    top.appendChild(delBtn);

    const urlInput = document.createElement("input");
    urlInput.className = "link-url-input";
    urlInput.value = link.url || "";
    urlInput.oninput = () => (card.links[index].url = urlInput.value);

    row.appendChild(top);
    row.appendChild(urlInput);
    root.appendChild(row);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-link-btn";
  addBtn.textContent = "+ Add link";
  addBtn.onclick = () => {
    card.links.push({ label: "", url: "" });
    renderEditor();
  };
  root.appendChild(addBtn);

  // ----- PUBLIC URL -----
  const urlBox = document.createElement("div");
  urlBox.className = "public-url-box";

  const urlLabel = document.createElement("div");
  urlLabel.className = "public-url-label";
  urlLabel.textContent = "Public card URL";

  const urlInput = document.createElement("input");
  urlInput.className = "public-url-input";
  urlInput.value = `${window.location.origin}/card.html?id=${id}`;
  urlInput.readOnly = true;

  urlBox.appendChild(urlLabel);
  urlBox.appendChild(urlInput);
  root.appendChild(urlBox);

  // ----- SAVE BUTTON -----
  const saveBtn = document.createElement("button");
  saveBtn.className = "add-link-btn";
  saveBtn.textContent = "Save Changes";
  saveBtn.style.background = "#3c6aff";
  saveBtn.style.color = "white";
  saveBtn.onclick = saveFinal;

  root.appendChild(saveBtn);
}

// Start editor
loadCardFromSupabase();
