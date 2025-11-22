// edit_wysiwyg.js
// WYSIWYG editor with DRAFT + SAVE CHANGES button

const url = new URL(window.location.href);
let id = url.searchParams.get("id");

if (!id) {
  id = Math.random().toString(36).slice(2, 10);
  window.location.href = `edit.html?id=${id}`;
}

const STORAGE_KEY = "card_" + id;

// Load existing saved card
let card = JSON.parse(localStorage.getItem(STORAGE_KEY) || `{
  "photo": "",
  "handle": "@yourhandle",
  "title": "Your title here",
  "subtitle": "Short description here",
  "links": []
}`);

// Create a DRAFT copy (this is what we edit)
let draft = JSON.parse(JSON.stringify(card));

function saveFinal() {
  card = JSON.parse(JSON.stringify(draft)); // copy draft into card
  localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
  alert("Saved!");
}

// RENDER EDITOR
function renderEditor() {
  const root = document.getElementById("editorCard");
  root.innerHTML = "";

  // ---------- Header (Photo + Text fields) ----------
  const header = document.createElement("div");
  header.className = "card-header";

  const photoWrap = document.createElement("div");
  photoWrap.className = "profile-photo-wrapper";

  const img = document.createElement("img");
  img.className = "profile-photo";
  img.src = draft.photo || "";
  img.alt = "Profile photo";
  img.onclick = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.onchange = () => {
      const file = picker.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        draft.photo = reader.result;
        renderEditor(); // re-render
      };
      if (file) reader.readAsDataURL(file);
    };
    picker.click();
  };

  const hint = document.createElement("div");
  hint.className = "profile-photo-hint";
  hint.textContent

  photoWrap.appendChild(img);
  photoWrap.appendChild(hint);

  const textFields = document.createElement("div");
  textFields.className = "card-text-fields";

  const handleInput = document.createElement("input");
  handleInput.className = "card-input handle";
  handleInput.value = draft.handle;
  handleInput.placeholder = "@yourhandle";
  handleInput.oninput = () => draft.handle = handleInput.value;

  const titleInput = document.createElement("input");
  titleInput.className = "card-input title";
  titleInput.value = draft.title;
  titleInput.placeholder = "Your title";
  titleInput.oninput = () => draft.title = titleInput.value;

  const subInput = document.createElement("input");
  subInput.className = "card-input subtitle";
  subInput.value = draft.subtitle;
  subInput.placeholder = "Short description";
  subInput.oninput = () => draft.subtitle = subInput.value;

  textFields.appendChild(handleInput);
  textFields.appendChild(titleInput);
  textFields.appendChild(subInput);

  header.appendChild(photoWrap);
  header.appendChild(textFields);

  root.appendChild(header);

  // ---------- Divider ----------
  const divider = document.createElement("div");
  divider.className = "card-divider";
  root.appendChild(divider);

  // ---------- Links ----------
  const linksTitle = document.createElement("div");
  linksTitle.className = "links-area-title";
  linksTitle.textContent = "Links";
  root.appendChild(linksTitle);

  draft.links.forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "link-row";

    const top = document.createElement("div");
    top.className = "link-row-top";

    const labelInput = document.createElement("input");
    labelInput.className = "link-label-input";
    labelInput.placeholder = "Label (Facebook, IG, etc)";
    labelInput.value = link.label;
    labelInput.oninput = () => draft.links[index].label = labelInput.value;

    const delBtn = document.createElement("button");
    delBtn.className = "link-delete-btn";
    delBtn.textContent = "×";
    delBtn.onclick = () => {
      draft.links.splice(index, 1);
      renderEditor();
    };

    top.appendChild(labelInput);
    top.appendChild(delBtn);

    const urlInput = document.createElement("input");
    urlInput.className = "link-url-input";
    urlInput.placeholder = "https://yourlink.com";
    urlInput.value = link.url;
    urlInput.oninput = () => draft.links[index].url = urlInput.value;

    row.appendChild(top);
    row.appendChild(urlInput);

    root.appendChild(row);
  });

  // Add link
  const addBtn = document.createElement("button");
  addBtn.className = "add-link-btn";
  addBtn.textContent = "+ Add link";
  addBtn.onclick = () => {
    draft.links.push({ label: "", url: "" });
    renderEditor();
  };
  root.appendChild(addBtn);

  // ----- PUBLIC URL -----
  const urlBox = document.createElement("div");
  urlBox.className = "public-url-box";

  const urlLabel = document.createElement("div");
  urlLabel.className = "public-url-label";
  urlLabel.textContent = "Public card URL";

  const urlInputPublic = document.createElement("input");
  urlInputPublic.className = "public-url-input";
  urlInputPublic.value = `${window.location.origin}/card.html?id=${id}`;
  urlInputPublic.readOnly = true;

  urlBox.appendChild(urlLabel);
  urlBox.appendChild(urlInputPublic);

  root.appendChild(urlBox);

  // ---------- SAVE BUTTON ----------
  const saveBtn = document.createElement("button");
  saveBtn.className = "add-link-btn";
  saveBtn.textContent = "Save Changes";
  saveBtn.style.background = "#3c6aff";
  saveBtn.style.color = "white";
  saveBtn.style.border = "none";
  saveBtn.style.marginTop = "16px";
  saveBtn.onclick = saveFinal;

  root.appendChild(saveBtn);
}

renderEditor();
