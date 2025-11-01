// ===== INIT =====
let products = JSON.parse(localStorage.getItem('products') || '[]');
products = products.map(p => ({ id: p.id || generateId(), ...p }));
let filtered = [...products];

const tableBody = document.querySelector('#productTable tbody');
const filePicker = document.getElementById('filePicker');
const uploadBtn = document.getElementById('uploadBtn');
const jsonOutput = document.getElementById('jsonOutput');

function generateId() {
  return Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
}

function saveLocal() {
  localStorage.setItem('products', JSON.stringify(products));
}

function sanitizeFileName(name) {
  return String(name || '').replace(/[:\/\\?%*|"<>]/g, '').trim();
}

function escapeText(s) { return String(s == null ? '' : s); }

// ===== CATEGORY OPTIONS =====
function renderCategoryOptions() {
  const sel = document.getElementById('filterCategory');
  if (!sel) return;
  const currentValue = sel.value;
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  sel.innerHTML = '<option value="">Semua</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  sel.value = currentValue;
}

// ===== FILTER & SORT =====
function buildFilteredView() {
  const cat = document.getElementById('filterCategory')?.value || '';
  const sort = document.getElementById('sortOption')?.value || '';
  const search = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';

  let view = [...products];
  if (cat) view = view.filter(p => p.category === cat);
  if (search) view = view.filter(p => p.name.toLowerCase().includes(search));

  if (sort === 'nameAsc') view.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'nameDesc') view.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'priceLow') view.sort((a, b) => Number(a.price) - Number(b.price));
  else if (sort === 'priceHigh') view.sort((a, b) => Number(b.price) - Number(a.price));

  filtered = view;
}

// ===== RENDER TABLE =====
function renderTable() {
  buildFilteredView();
  tableBody.innerHTML = '';
  filtered.forEach((p, idx) => {
    const fileName = (p.img || '').split('/').pop() || '';
    const row = document.createElement('tr');
    row.dataset.id = p.id;
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td><span contenteditable="true" class="editable" data-field="name" data-id="${p.id}" onblur="onCellBlur(event)">${escapeText(p.name)}</span></td>
      <td><span contenteditable="true" class="editable" data-field="price" data-id="${p.id}" onblur="onCellBlur(event)">${escapeText(p.price)}</span></td>
      <td><span contenteditable="true" class="editable" data-field="category" data-id="${p.id}" onblur="onCellBlur(event)">${escapeText(p.category)}</span></td>
      <td style="display:flex;align-items:center;gap:8px;">
        <span contenteditable="true" class="editable" data-field="img" data-id="${p.id}" onblur="onCellBlur(event)">${escapeText(fileName)}</span>
        <button class="file-btn" title="Pilih file dari HP" onclick="triggerFilePicker('${p.id}')">📁</button>
      </td>
      <td>
        <button onclick="searchProductImage(${idx})">🔍</button>
        <button onclick="deleteById('${p.id}')">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  renderCategoryOptions();
}

// ===== EDIT CELL =====
function onCellBlur(ev) {
  const el = ev.target;
  const id = el.dataset.id;
  const field = el.dataset.field;
  if (!id || !field) return;
  const idx = products.findIndex(x => x.id === id);
  if (idx === -1) return;
  const newVal = el.textContent.trim();
  if (field === 'price') {
    const num = Number(newVal.replace(/[^0-9.\-]/g, ''));
    if (isNaN(num)) { alert('Harga harus angka'); el.textContent = products[idx].price; return; }
    products[idx].price = num;
  } else if (field === 'img') {
    if (!newVal) { alert('Nama gambar tidak boleh kosong'); el.textContent = (products[idx].img || '').split('/').pop(); return; }
    const safe = sanitizeFileName(newVal);
    const base = (products[idx].img?.lastIndexOf('/') >= 0) ? products[idx].img.substring(0, products[idx].img.lastIndexOf('/') + 1) : 'images/';
    products[idx].img = base + safe;
    el.textContent = safe;
  } else { products[idx][field] = newVal; }
  saveLocal();
  renderTable();
}

document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target?.classList.contains('editable')) {
    ev.preventDefault(); ev.target.blur();
  }
});

// ===== ADD & DELETE =====
function addProduct() {
  const n = document.getElementById('name').value.trim();
  const pr = Number(document.getElementById('price').value || 0);
  const c = document.getElementById('category').value.trim();
  const im = document.getElementById('imageName').value.trim();
  if (!n || !pr || !c || !im) { alert('⚠️ Semua kolom harus diisi!'); return; }
  products.push({ id: generateId(), name: n, price: pr, img: 'images/' + sanitizeFileName(im), category: c });
  saveLocal();
  ['name', 'price', 'category', 'imageName'].forEach(id => document.getElementById(id).value = '');
  renderTable();
}

function addProductPreset() {
  const i = products.length + 1;
  products.push({ id: generateId(), name: `Produk Contoh ${i}`, price: 5000 + i * 100, img: `images/contoh${i}.jpg`, category: 'lainnya' });
  saveLocal(); renderTable();
}

function deleteById(id) {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;
  products = products.filter(p => p.id !== id);
  saveLocal(); renderTable();
}

function clearAllProducts() {
  if (!products.length) { alert('Daftar produk kosong.'); return; }
  if (confirm('Hapus semua produk? Tindakan ini tidak dapat dibatalkan.')) {
    products = []; saveLocal(); renderTable();
    if (jsonOutput) jsonOutput.textContent = '[ Kosong ]';
    alert('✅ Semua produk dihapus.');
  }
}

// ===== JSON IMPORT =====
function importJSON() {
  const ta = document.getElementById('jsonInput');
  if (!ta) return alert('Area JSON tidak ditemukan.');
  const text = ta.value.trim();
  if (!text) return alert('JSON kosong.');
  try {
    const arr = JSON.parse(text.replace(/'/g, '"'));
    if (!Array.isArray(arr)) return alert('Format harus array!');
    arr.forEach(p => {
      products.push({
        id: generateId(),
        name: p.name || '',
        price: Number(p.price || 0),
        img: (p.img && typeof p.img === 'string') ? (p.img.includes('/') ? p.img : 'images/' + sanitizeFileName(p.img)) : '',
        category: p.category || ''
      });
    });
    saveLocal(); ta.value = ''; renderTable();
    alert('✅ Data JSON berhasil ditambahkan!');
  } catch (err) { alert('❌ JSON tidak valid: ' + err); }
}

// ===== GENERATE JSON + SCROLL + COPY =====
function generateAndScrollJSON() {
  if (!products || products.length === 0) {
    alert('⚠️ Belum ada produk yang bisa digenerate!');
    return;
  }

  const formatted = products.map(p => ({
    name: p.name,
    price: Number(p.price),
    img: p.img,
    category: p.category
  }));

  const jsonText = JSON.stringify(formatted, null, 2);
  if (jsonOutput) {
    jsonOutput.textContent = jsonText;
    jsonOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navigator.clipboard.writeText(jsonText)
    .then(() => alert('✅ JSON berhasil digenerate dan disalin ke clipboard!'))
    .catch(err => alert('❌ Gagal menyalin JSON: ' + err));
}

function clearJSONOutput() {
  if (!jsonOutput) return;
  jsonOutput.textContent = '[ Kosong ]';
  alert('✅ JSON berhasil dihapus!');
}

function downloadJSON() {
  if (!jsonOutput) return;
  const output = jsonOutput.textContent;
  if (!output || output === '[ Kosong ]') { alert('Tidak ada JSON untuk didownload.'); return; }
  const blob = new Blob([output], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'produk-warung-emung.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ===== EXPORT EXCEL =====
function exportToExcel() {
  if (!products || products.length === 0) { alert('Tidak ada produk untuk diexport!'); return; }
  let csv = 'No,Nama,Harga,Kategori,Gambar\n';
  products.forEach((p, idx) => {
    csv += `${idx+1},"${p.name}",${p.price},"${p.category}","${p.img}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'produk-warung-emung.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ===== FILE PICKER =====
let renameTargetId = null;
function triggerFilePicker(productId) { renameTargetId = productId; filePicker.value = ''; filePicker.click(); }
filePicker.addEventListener('change', ev => {
  if (!renameTargetId) return;
  const f = ev.target.files[0]; if (!f) return;
  const idx = products.findIndex(x => x.id === renameTargetId); if (idx === -1) { alert('Produk tidak ditemukan.'); renameTargetId = null; return; }
  const currentBase = (products[idx].img || '').split('/').pop() || f.name;
  const safeTarget = sanitizeFileName(currentBase);
  const basePath = (products[idx].img?.lastIndexOf('/') >= 0) ? products[idx].img.substring(0, products[idx].img.lastIndexOf('/') + 1) : 'images/';
  const renamedFile = new File([f], safeTarget, { type: f.type });
  const url = URL.createObjectURL(renamedFile);
  const a = document.createElement('a'); a.href = url; a.download = safeTarget; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  products[idx].img = basePath + safeTarget;
  saveLocal(); renameTargetId = null; renderTable();
  alert('✅ File baru tersimpan dengan nama: ' + safeTarget);
});

// ===== SEARCH IMAGE =====
function searchProductImage(index) {
  const data = filtered[index] || products[index];
  if (!data) return;
  const query = encodeURIComponent(data.name);
  const url = `https://www.google.com/search?tbm=isch&q=${query}`;
  window.open(url, '_blank');
}

// ===== FILTER EVENTS =====
function applyFilter() { renderTable(); }
function resetFilter() {
  document.getElementById('filterCategory').value = '';
  document.getElementById('sortOption').value = '';
  document.getElementById('searchInput').value = '';
  applyFilter();
}

document.getElementById('searchInput')?.addEventListener('input', applyFilter);
document.getElementById('filterCategory')?.addEventListener('change', applyFilter);
document.getElementById('sortOption')?.addEventListener('change', applyFilter);

// ===== COPY JSON =====
function copyJSON() {
  if (!jsonOutput) return;

  const text = jsonOutput.textContent;
  if (!text || text === '[ Kosong ]') {
    alert('Tidak ada JSON untuk disalin!');
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert('✅ JSON berhasil disalin ke clipboard!'))
      .catch(err => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    const ok = document.execCommand('copy');
    if (ok) alert('✅ JSON berhasil disalin ke clipboard!');
    else alert('❌ Gagal menyalin JSON.');
  } catch (err) {
    alert('❌ Browser tidak mendukung penyalinan otomatis.');
  }
  document.body.removeChild(ta);
}

// ===== UPLOAD KE GITHUB =====
async function uploadToGitHub() {
  if (!jsonOutput) return alert('Tidak ada JSON untuk diupload!');
  const token = document.getElementById('githubToken').value.trim();
  if (!token) return alert('⚠️ Masukkan GitHub Token Anda!');

  const content = jsonOutput.textContent;
  if (!content || content === '[ Kosong ]') return alert('⚠️ JSON kosong, tidak bisa diupload.');

  const btn = uploadBtn;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Mengunggah...';

  const owner = 'NAMA_USER_ORG';          // ganti sesuai akun GitHub
  const repo = 'NAMA_REPO';               // ganti sesuai repo
  const path = 'data/produk-warung-emung.json';
  const branch = 'main';

  try {
    let sha = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' }
      });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }
    } catch(e) { console.warn('File belum ada, akan dibuat baru.'); }

    const resUpload = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        Authorization: 'token ' + token,
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: sha ? 'Update produk JSON' : 'Add produk JSON',
        content: btoa(unescape(encodeURIComponent(content))),
        branch: branch,
        sha: sha || undefined
      })
    });

    if (!resUpload.ok) throw new Error('HTTP ' + resUpload.status);
    btn.textContent = '✅ Berhasil!';
    setTimeout(() => btn.textContent = originalText, 2000);
    alert('🎉 JSON berhasil diupload ke GitHub!');
  } catch (err) {
    console.error(err);
    btn.textContent = '❌ Gagal Upload';
    setTimeout(() => btn.textContent = originalText, 2000);
    alert('❌ Upload gagal: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ===== INIT RENDER =====
(function init() {
  products = products.map(p => ({ id: p.id || generateId(), ...p }));
  saveLocal();
  renderTable();
})();

// ==========================
// 🔹 UPLOAD GAMBAR MASSAL FIX FINAL
// ==========================
document.addEventListener('DOMContentLoaded', () => {

  const filePicker = document.getElementById('filePicker');
  const previewArea = document.getElementById('previewArea');
  const uploadMassalBtn = document.getElementById('uploadMassalBtn');
  if (!filePicker || !uploadMassalBtn) return; // jika elemen belum ada, hentikan saja (aman)

  let selectedFiles = [];

  // Saat user pilih gambar
  filePicker.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(newFiles);
    updatePreview();
  });

  function updatePreview() {
    previewArea.innerHTML = '';
    if (selectedFiles.length === 0) {
      previewArea.innerHTML = '<small class="muted">Belum ada gambar dipilih.</small>';
      return;
    }
    selectedFiles.forEach((file, index) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `
        <img src="${URL.createObjectURL(file)}" class="thumb">
        <span>${file.name}</span>
        <button onclick="removeFile(${index})" class="remove-btn">❌</button>
      `;
      previewArea.appendChild(div);
    });
  }

  window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    updatePreview();
  };

  uploadMassalBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return alert('⚠️ Belum ada gambar yang dipilih!');
    const token = document.getElementById('githubToken').value.trim();
    if (!token) return alert('❌ Masukkan GitHub Token dulu.');

    const repoOwner = 'WarungEmung26'; // ubah sesuai username GitHub kamu
    const repoName = 'WarungEmung';    // ubah sesuai repository kamu
    const imagePath = 'images';        // folder tujuan upload

    uploadMassalBtn.disabled = true;
    uploadMassalBtn.textContent = '⏳ Mengupload...';

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const content = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const safeName = file.name.replace(/[:\/\\?%*|"<>]/g, '');
      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${imagePath}/${safeName}`;
      const message = `Upload ${safeName} via Admin WarungEmung`;

      try {
        const res = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message, content })
        });

        if (res.ok) {
          console.log(`✅ ${safeName} berhasil diupload`);
        } else {
          const errorText = await res.text();
          console.error(`❌ Gagal upload ${safeName}`, errorText);
          alert(`Gagal upload ${safeName}\n${errorText}`);
        }
      } catch (err) {
        console.error('Error upload', err);
        alert(`Terjadi error saat upload ${file.name}`);
      }

      // progress sederhana
      uploadMassalBtn.textContent = `📤 ${i + 1}/${selectedFiles.length} diupload...`;
    }

    alert('✅ Semua gambar berhasil diupload!');
    selectedFiles = [];
    updatePreview();

    uploadMassalBtn.disabled = false;
    uploadMassalBtn.textContent = '🚀 Upload Gambar Massal';
  });

  // tampil awal
  updatePreview();
});
