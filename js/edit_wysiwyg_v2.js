// edit_wysiwyg_v2.js
// Cloud-only editor using Supabase (no localStorage)

// ===== Safety Check =====
if (!window.sb) {
  console.error("Supabase client not found. Check script order in edit.html.");
}

// ===== Get / Generate Card ID =====
const editUrl = new URL(window.location.href);
let id = editUrl.searchParams.get("id");

if (!id) {
  id = Math.random().toString(36).slice(2, 10);
  window.location.href = `edit.html?id=${id}`;
}

// ===== Default Card Object =====
let card = {
  id,
  full_name: "",
  handle: "@yourhandle",
  title: "Your title here",
  subtitle: "Short description here",
  photo_url: "",
  photo_b64: "",      // base64 photo for VCF
  links: [],
  country_code: "+63",
  phone: "",
  email: "",
  org: "",
  role: ""
};

// ===== Load Card From Supabase =====
async function loadCardFromSupabase() {
  try {
    const { data, error } = await window.sb
      .from("cards")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Load error:", error);
    }

    if (data) {
      card = {
        id,
        full_name: data.full_name || "",
        handle: data.handle || "@yourhandle",
        title: data.title || "Your title here",
        subtitle: data.subtitle || "Short description here",
        photo_url: data.photo_url || "",
        photo_b64: data.photo_b64 || "",
        links: Array.isArray(data.links) ? data.links : [],
        country_code: data.country_code || "+63",
        phone: data.phone || "",
        email: data.email || "",
        org: data.org || "",
        role: data.role || ""
      };
    }
  } catch (err) {
    console.error("Unexpected load error:", err);
  }

  renderEditor();
}

// ===== Save to Supabase =====
async function saveFinal() {
  const payload = { ...card };

  const { error } = await window.sb.from("cards").upsert(payload);

  if (error) {
    alert("Error saving: " + error.message);
  } else {
    alert("Saved to cloud!");
  }
}

// ===== Helper: Convert File → Base64 (string only) =====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // result is "data:image/jpeg;base64,XXXX", we only keep the XXXX
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Render UI =====
function renderEditor() {
  const root = document.getElementById("editorCard");
  root.innerHTML = "";

  // ---------- HEADER ----------
  const header = document.createElement("div");
  header.className = "card-header";

  // Photo
  const photoWrap = document.createElement("div");
  photoWrap.className = "profile-photo-wrapper";

  const img = document.createElement("img");
  img.className = "profile-photo";
  img.src = card.photo_url || "";
  img.alt = "Profile photo";

  img.onclick = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";

    picker.onchange = async () => {
      const file = picker.files[0];
      if (!file) return;

      const fileName = `${id}_photo_${Date.now()}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await window.sb.storage
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
      const { data } = window.sb.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      card.photo_url = data.publicUrl || card.photo_url;

      // Also store base64 for VCF so phone doesn't need to re-download
      try {
        card.photo_b64 = await fileToBase64(file);
      } catch (e) {
        console.warn("Base64 conversion failed:", e);
      }

      renderEditor();
    };

    picker.click();
  };

  const hint = document.createElement("div");
  hint.className = "profile-photo-hint";
  hint.textContent = "Tap to upload photo";

  photoWrap.appendChild(img);
  photoWrap.appendChild(hint);

  // Text fields
  const textFields = document.createElement("div");
  textFields.className = "card-text-fields";

  // Full Name
  const nameInput = document.createElement("input");
  nameInput.className = "card-input name";
  nameInput.placeholder = "Full Name";
  nameInput.value = card.full_name || "";
  nameInput.oninput = () => (card.full_name = nameInput.value);

  // Handle
  const handleInput = document.createElement("input");
  handleInput.className = "card-input handle";
  handleInput.placeholder = "@yourhandle";
  handleInput.value = card.handle;
  handleInput.oninput = () => (card.handle = handleInput.value);

  // Title
  const titleInput = document.createElement("input");
  titleInput.className = "card-input title";
  titleInput.placeholder = "Your title";
  titleInput.value = card.title;
  titleInput.oninput = () => (card.title = titleInput.value);

  // Subtitle
  const subtitleInput = document.createElement("input");
  subtitleInput.className = "card-input subtitle";
  subtitleInput.placeholder = "Short description";
  subtitleInput.value = card.subtitle;
  subtitleInput.oninput = () => (card.subtitle = subtitleInput.value);

  textFields.appendChild(nameInput);
  textFields.appendChild(handleInput);
  textFields.appendChild(titleInput);
  textFields.appendChild(subtitleInput);

  header.appendChild(photoWrap);
  header.appendChild(textFields);
  root.appendChild(header);

  // ---------- DIVIDER ----------
  const divider = document.createElement("div");
  divider.className = "card-divider";
  root.appendChild(divider);

  // ---------- LINKS ----------
  const linksTitle = document.createElement("div");
  linksTitle.className = "links-area-title";
  linksTitle.textContent = "LINKS";
  root.appendChild(linksTitle);

  card.links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "link-row";

    const top = document.createElement("div");
    top.className = "link-row-top";

    const labelInput = document.createElement("input");
    labelInput.className = "link-label-input";
    labelInput.placeholder = "Label (Facebook, IG, etc)";
    labelInput.value = link.label || "";
    labelInput.oninput = () => (card.links[index].label = labelInput.value);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "link-delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.onclick = () => {
      card.links.splice(index, 1);
      renderEditor();
    };

    top.appendChild(labelInput);
    top.appendChild(deleteBtn);

    const urlInput = document.createElement("input");
    urlInput.className = "link-url-input";
    urlInput.placeholder = "https://yourlink.com";
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

  // ---------- CONTACT INFO ----------
  const contactTitle = document.createElement("div");
  contactTitle.className = "links-area-title";
  contactTitle.textContent = "CONTACT INFORMATION";
  root.appendChild(contactTitle);

  const contactContainer = document.createElement("div");
  contactContainer.className = "contact-container";

  // Phone row
  const phoneRow = document.createElement("div");
  phoneRow.className = "phone-row";

  const ccInput = document.createElement("input");
  ccInput.className = "contact-cc";
  ccInput.value = card.country_code || "+63";
  ccInput.oninput = () => (card.country_code = ccInput.value);

  const phoneInput = document.createElement("input");
  phoneInput.className = "contact-phone";
  phoneInput.placeholder = "Phone number";
  phoneInput.value = card.phone || "";
  phoneInput.oninput = () => (card.phone = phoneInput.value);

  phoneRow.appendChild(ccInput);
  phoneRow.appendChild(phoneInput);
  contactContainer.appendChild(phoneRow);

  // Email
  const emailInput = document.createElement("input");
  emailInput.className = "contact-input";
  emailInput.placeholder = "Email (optional)";
  emailInput.value = card.email || "";
  emailInput.oninput = () => (card.email = emailInput.value);
  contactContainer.appendChild(emailInput);

  // Organization
  const orgInput = document.createElement("input");
  orgInput.className = "contact-input";
  orgInput.placeholder = "Organization / Company (optional)";
  orgInput.value = card.org || "";
  orgInput.oninput = () => (card.org = orgInput.value);
  contactContainer.appendChild(orgInput);

  // Role / Position
  const roleInput = document.createElement("input");
  roleInput.className = "contact-input";
  roleInput.placeholder = "Role / Position (optional)";
  roleInput.value = card.role || "";
  roleInput.oninput = () => (card.role = roleInput.value);
  contactContainer.appendChild(roleInput);

  root.appendChild(contactContainer);

  // ---------- PUBLIC URL ----------
  const urlBox = document.createElement("div");
  urlBox.className = "public-url-box";

  const urlLabel = document.createElement("div");
  urlLabel.className = "public-url-label";
  urlLabel.textContent = "PUBLIC CARD URL";

  const urlInput = document.createElement("input");
  urlInput.className = "public-url-input";

  // For GitHub Pages: /tagme
  const base = window.location.origin + "/tagme";
  urlInput.value = `${base}/card.html?id=${id}`;
  urlInput.readOnly = true;

  urlBox.appendChild(urlLabel);
  urlBox.appendChild(urlInput);
  root.appendChild(urlBox);

  // ---------- SAVE BUTTON ----------
  const saveBtn = document.createElement("button");
  saveBtn.className = "add-link-btn";
  saveBtn.textContent = "Save Changes";
  saveBtn.style.background = "#3c6aff";
  saveBtn.style.color = "white";
  saveBtn.onclick = saveFinal;

  root.appendChild(saveBtn);
}

// Start
loadCardFromSupabase();
