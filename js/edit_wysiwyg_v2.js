// edit_wysiwyg_v2.js
// Cloud-only NFC editor using Supabase

// ===== Safety Check =====
if (!window.sb) console.error("Supabase client missing — check edit.html");

// ===== Get/Generate Card ID =====
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
  title: "",
  subtitle: "",
  photo_url: "",
  photo_b64: "",
  links: [],
  country_code: "+63",
  phone: "",
  email: "",
  org: "",
  role: ""
};

// ===== Load Card =====
async function loadCardFromSupabase() {
  const { data, error } = await window.sb
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (data) {
    card = { ...card, ...data };
  }

  renderEditor();
}

// ===== Save =====
async function saveFinal() {
  const { error } = await window.sb.from("cards").upsert(card);
  if (error) alert("Save error: " + error.message);
  else alert("Saved!");
}

// ===== File → Base64 =====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ===== Render Editor =====
function renderEditor() {
  const root = document.getElementById("editorCard");
  root.innerHTML = "";

  // HEADER
  const header = document.createElement("div");
  header.className = "card-header";

  // Photo
  const photoWrap = document.createElement("div");
  photoWrap.className = "profile-photo-wrapper";

  const img = document.createElement("img");
  img.className = "profile-photo";
  img.src = card.photo_url || "";
  img.onclick = () => {
    const pick = document.createElement("input");
    pick.type = "file";
    pick.accept = "image/*";
    pick.onchange = async () => {
      const file = pick.files[0];
      if (!file) return;

      const fileName = `${id}_photo_${Date.now()}`;

      await window.sb.storage
        .from("profile-photos")
        .upload(fileName, file, { upsert: true });

      const { data } = window.sb.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      card.photo_url = data.publicUrl;
      card.photo_b64 = await fileToBase64(file);

      renderEditor();
    };
    pick.click();
  };

  const hint = document.createElement("div");
  hint.className = "profile-photo-hint";
  hint.textContent = "Tap to upload photo";

  photoWrap.appendChild(img);
  photoWrap.appendChild(hint);

  // TEXT FIELDS
  const textFields = document.createElement("div");
  textFields.className = "card-text-fields";

  const fullName = document.createElement("input");
  fullName.className = "card-input title";
  fullName.placeholder = "Full Name";
  fullName.value = card.full_name;
  fullName.oninput = () => (card.full_name = fullName.value);

  const title = document.createElement("input");
  title.className = "card-input subtitle";
  title.placeholder = "Your Title";
  title.value = card.title;
  title.oninput = () => (card.title = title.value);

  const subtitle = document.createElement("input");
  subtitle.className = "card-input subtitle";
  subtitle.placeholder = "Short Description";
  subtitle.value = card.subtitle;
  subtitle.oninput = () => (card.subtitle = subtitle.value);

  textFields.appendChild(fullName);    // NEW
  textFields.appendChild(title);
  textFields.appendChild(subtitle);

  header.appendChild(photoWrap);
  header.appendChild(textFields);
  root.appendChild(header);

  // Divider
  root.appendChild(Object.assign(document.createElement("div"), { className: "card-divider" }));

  // LINKS
  const linksTitle = document.createElement("div");
  linksTitle.className = "links-area-title";
  linksTitle.textContent = "LINKS";
  root.appendChild(linksTitle);

  card.links.forEach((link, i) => {
    const row = document.createElement("div");
    row.className = "link-row";

    const top = document.createElement("div");
    top.className = "link-row-top";

    const lbl = document.createElement("input");
    lbl.className = "link-label-input";
    lbl.placeholder = "Label";
    lbl.value = link.label || "";
    lbl.oninput = () => (card.links[i].label = lbl.value);

    const del = document.createElement("button");
    del.className = "link-delete-btn";
    del.textContent = "×";
    del.onclick = () => {
      card.links.splice(i, 1);
      renderEditor();
    };

    const url = document.createElement("input");
    url.className = "link-url-input";
    url.placeholder = "https://";
    url.value = link.url || "";
    url.oninput = () => (card.links[i].url = url.value);

    top.appendChild(lbl);
    top.appendChild(del);

    row.appendChild(top);
    row.appendChild(url);
    root.appendChild(row);
  });

  const add = document.createElement("button");
  add.className = "add-link-btn";
  add.textContent = "+ Add link";
  add.onclick = () => {
    card.links.push({ label: "", url: "" });
    renderEditor();
  };
  root.appendChild(add);

  // CONTACT INFO
  const ciTitle = document.createElement("div");
  ciTitle.className = "links-area-title";
  ciTitle.textContent = "CONTACT INFORMATION";
  root.appendChild(ciTitle);

  const contactBox = document.createElement("div");
  contactBox.className = "contact-container";

  const phoneRow = document.createElement("div");
  phoneRow.className = "phone-row";

  const cc = document.createElement("input");
  cc.className = "contact-cc";
  cc.value = card.country_code;
  cc.oninput = () => (card.country_code = cc.value);

  const phone = document.createElement("input");
  phone.className = "contact-phone";
  phone.placeholder = "Phone number";
  phone.value = card.phone;
  phone.oninput = () => (card.phone = phone.value);

  phoneRow.appendChild(cc);
  phoneRow.appendChild(phone);

  const email = document.createElement("input");
  email.className = "contact-input";
  email.placeholder = "Email";
  email.value = card.email;
  email.oninput = () => (card.email = email.value);

  const org = document.createElement("input");
  org.className = "contact-input";
  org.placeholder = "Organization";
  org.value = card.org;
  org.oninput = () => (card.org = org.value);

  const role = document.createElement("input");
  role.className = "contact-input";
  role.placeholder = "Role";
  role.value = card.role;
  role.oninput = () => (card.role = role.value);

  contactBox.appendChild(phoneRow);
  contactBox.appendChild(email);
  contactBox.appendChild(org);
  contactBox.appendChild(role);

  root.appendChild(contactBox);

  // PUBLIC URL
  const urlBox = document.createElement("div");
  urlBox.className = "public-url-box";

  const lbl = document.createElement("div");
  lbl.className = "public-url-label";
  lbl.textContent = "PUBLIC CARD URL";

  const urlInput = document.createElement("input");
  urlInput.className = "public-url-input";
  urlInput.value = `${window.location.origin}/tagme/card.html?id=${id}`;
  urlInput.readOnly = true;

  urlBox.appendChild(lbl);
  urlBox.appendChild(urlInput);
  root.appendChild(urlBox);

  // SAVE BUTTON
  const save = document.createElement("button");
  save.className = "add-link-btn";
  save.textContent = "Save Changes";
  save.style.background = "#3c6aff";
  save.style.color = "white";
  save.onclick = saveFinal;

  root.appendChild(save);
}

loadCardFromSupabase();
