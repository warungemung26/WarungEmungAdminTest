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
function renderProductCards() {
  const grid = document.getElementById('productCards');
  if(!grid) return;
  grid.innerHTML = '';
  buildFilteredView();
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div class="name" contenteditable="true" onblur="updateField('${p.id}','name',this.textContent)">${p.name}</div>
      <div class="price" contenteditable="true" onblur="updateField('${p.id}','price',this.textContent)">${p.price}</div>
      <div class="category" contenteditable="true" onblur="updateField('${p.id}','category',this.textContent)">${p.category}</div>
      <div class="actions">
        <button onclick="triggerFilePicker('${p.id}')">📁 Ganti Gambar</button>
        <button onclick="deleteById('${p.id}')">🗑️ Hapus</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateField(id, field, value) {
  const idx = products.findIndex(p=>p.id===id); 
  if(idx===-1) return;
  if(field==='price') { 
    const num=Number(value.replace(/[^0-9]/g,'')); 
    products[idx].price=num||0; 
  } else products[idx][field]=value;
  saveLocal(); 
  renderProductCards();
}


document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target?.classList.contains('editable')) {
    ev.preventDefault(); ev.target.blur();
  }
});

// hapus produk
const deleteAllBtn = document.getElementById('deleteAllBtn');
deleteAllBtn.addEventListener('click', () => {
  if (!products.length) { showToast('Daftar produk kosong'); return; }
  if(confirm('⚠️ Hapus semua produk? Tindakan ini tidak dapat dibatalkan.')) {
    products = [];
    saveLocal();
    renderTable();
    showToast('✅ Semua produk dihapus');
  }
});

// ===== TAMBAH PRODUK MANUAL ANTI-DOBEL + TOAST =====
function addProduct() {
  const n = document.getElementById('name').value.trim();
  const pr = Number(document.getElementById('price').value || 0);

  let c = document.getElementById('categorySelect').value.trim();
  if (c === 'custom') {
    c = document.getElementById('customCategory').value.trim();
  }

  const im = document.getElementById('imageName').value.trim();

  if (!n || !pr || !c || !im) {
    showToast('⚠️ Semua kolom harus diisi!');
    return;
  }

  const imgPath = 'images/' + sanitizeFileName(im);

  // cek produk sama persis (nama + kategori + harga + gambar)
  const idx = products.findIndex(p =>
    p.name.trim() === n &&
    p.category.trim() === c &&
    Number(p.price) === pr &&
    p.img.trim() === imgPath
  );

  if (idx !== -1) {
    // replace produk lama
    products[idx] = { id: products[idx].id, name: n, price: pr, category: c, img: imgPath };
    showToast(`✅ Produk "${n}" diupdate`);
  } else {
    // tambah produk baru
    products.push({ id: generateId(), name: n, price: pr, category: c, img: imgPath });
    showToast(`✅ Produk "${n}" ditambahkan`);
  }

  saveLocal();

  // reset form
  ['name', 'price', 'categorySelect', 'customCategory', 'imageName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('customCategory').style.display = 'none';
  renderTable();
  document.getElementById('name').focus();
}

// ===== TOGGLE CATEGORY CUSTOM =====
function toggleCustomCategory(select) {
  const customInput = document.getElementById('customCategory');
  if (select.value === 'custom') {
    customInput.style.display = 'inline-block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
  }
}

// ===== TAMBAH PRODUK DENGAN TOAST =====
function addProduct() {
  const n = document.getElementById('name').value.trim();
  const pr = Number(document.getElementById('price').value || 0);

  let c = document.getElementById('categorySelect').value.trim();
  if (c === 'custom') {
    c = document.getElementById('customCategory').value.trim();
  }

  const im = document.getElementById('imageName').value.trim();

  if (!n || !pr || !c || !im) {
    alert('⚠️ Semua kolom harus diisi!');
    return;
  }

  products.push({
    id: generateId(),
    name: n,
    price: pr,
    img: 'images/' + sanitizeFileName(im),
    category: c
  });

  saveLocal();

  ['name', 'price', 'categorySelect', 'customCategory', 'imageName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('customCategory').style.display = 'none';
  renderTable();
  document.getElementById('name').focus();

  // ===== NOTIF TOAST =====
  showToast(`✅ Produk "${n}" berhasil ditambahkan!`);
}

// ===== FUNSI TOAST =====
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
  }, 3000); // tampil 3 detik
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
      const name = (p.name || '').trim();
      const price = Number(p.price || 0);
      const category = (p.category || '').trim();
      const img = (p.img && typeof p.img === 'string') 
                  ? (p.img.includes('/') ? p.img : 'images/' + sanitizeFileName(p.img)) 
                  : '';

      if (!name || !price || !category || !img) return; // skip yg tidak lengkap

      // cek produk sama persis
      const idx = products.findIndex(prod =>
        prod.name.trim() === name &&
        prod.category.trim() === category &&
        Number(prod.price) === price &&
        prod.img.trim() === img
      );

      if (idx !== -1) {
        // replace produk lama
        products[idx] = { id: products[idx].id, name, price, category, img };
      } else {
        // tambah produk baru
        products.push({ id: generateId(), name, price, category, img });
      }
    });

    saveLocal();
    ta.value = '';
    renderTable();
    alert('✅ Data JSON berhasil diimport tanpa dobel!');
  } catch (err) {
    alert('❌ JSON tidak valid: ' + err);
  }
}

function clearJSONInput() {
  const input = document.getElementById('jsonInput');
  if (input) {
    input.value = ''; // kosongkan isi kolom teks
  }
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

  const owner = 'WarungEmung26';
const repo = 'WarungEmung';
  const path = 'data/produk.json';
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

// ===== HAPUS FILE DARI GITHUB REPO =====
async function deleteFileFromGitHub(filePath) {
  const token = document.getElementById('githubToken').value.trim();
  if (!token) return alert('⚠️ Masukkan GitHub Token Anda terlebih dahulu.');

  const owner = 'WarungEmung26'; // ganti dengan username GitHub kamu
  const repo = 'WarungEmung';    // ganti dengan repo kamu
  const branch = 'main';         // biasanya "main" atau "master"

  if (!filePath) return alert('⚠️ Path file belum ditentukan.');
  if (!confirm(`Yakin ingin menghapus file:\n${filePath} ?`)) return;

  try {
    // Ambil SHA file
    const resMeta = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    if (!resMeta.ok) throw new Error('File tidak ditemukan atau token salah');
    const data = await resMeta.json();

    // Hapus file
    const resDel = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `Hapus file ${filePath} via Admin WarungEmung`,
        sha: data.sha,
        branch: branch
      })
    });

    if (resDel.ok) {
      alert(`✅ File berhasil dihapus: ${filePath}`);
    } else {
      const txt = await resDel.text();
      alert(`❌ Gagal menghapus file:\n${txt}`);
    }

  } catch (err) {
    alert('❌ Terjadi error: ' + err.message);
  }
}

function hapusFileRepo() {
  const path = document.getElementById('filePathDelete').value.trim();
  if (!path) return alert('Masukkan path file yang ingin dihapus!');
  deleteFileFromGitHub(path);
}

// ===== AMBIL DATA PRODUK DARI REPO GITHUB (versi aman, integrasi ke products) =====
async function loadProdukFromRepo() {
  const token = document.getElementById('githubToken').value.trim();
  if (!token) return alert('⚠️ Masukkan GitHub Token dulu.');

  const owner = 'WarungEmung26'; // ubah sesuai akunmu
  const repo  = 'WarungEmung';   // ubah sesuai repo
  const branch = 'main';
  const filePath = 'data/produk.json'; // path tetap

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });

    if (!res.ok) {
      // tampilkan error lebih informatif
      const text = await res.text().catch(() => '');
      throw new Error(`Gagal ambil file (HTTP ${res.status}). ${text}`);
    }

    const meta = await res.json();
    if (!meta.content) throw new Error('File kosong atau format tidak valid di GitHub.');

    // decode base64 dan parse JSON
    const decoded = atob(meta.content.replace(/\n/g, ''));
    let jsonData;
    try {
      jsonData = JSON.parse(decoded);
    } catch (err) {
      throw new Error('Isi produk.json bukan JSON valid: ' + err.message);
    }

    if (!Array.isArray(jsonData)) throw new Error('Format produk.json harus array produk ([])');

    // konversi ke format internal products, tambahkan id jika perlu
    products = jsonData.map(p => ({
      id: p.id || generateId(),
      name: p.name || '',
      price: Number(p.price || 0),
      img: (p.img && typeof p.img === 'string') ? p.img : (p.image || ''),
      category: p.category || ''
    }));

    // simpan dan render tabel (pakai fungsi yg sudah ada)
    saveLocal();
    renderTable();

    alert('✅ Data produk berhasil dimuat dari GitHub!');
  } catch (err) {
    console.error('loadProdukFromRepo error:', err);
    alert('❌ Error ambil produk: ' + err.message);
  }
}

const owner = 'WarungEmung26'; // ganti sesuai akun GitHub
const repo  = 'WarungEmung';    // ganti sesuai repo
const branch = 'main';

document.getElementById('loadFolder').addEventListener('click', async () => {
  const token = document.getElementById('githubToken').value.trim();
  const folderPath = document.getElementById('folderPath').value.trim();
  if (!token || !folderPath) return alert('Masukkan token dan folder path');

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();
    const container = document.getElementById('fileList');
    container.innerHTML = '';
    if (files.length === 0) container.innerHTML = '<small>Folder kosong</small>';
    files.forEach(file => {
      const div = document.createElement('div');
      div.innerHTML = `<input type="checkbox" data-sha="${file.sha}" data-path="${file.path}"> ${file.name}`;
      container.appendChild(div);
    });
  } catch (err) {
    alert('❌ Gagal load folder: ' + err.message);
  }
});

document.getElementById('deleteAll').addEventListener('click', async () => {
  const token = document.getElementById('githubToken').value.trim();
  if (!token) return alert('Masukkan token');

  const checkboxes = document.querySelectorAll('#fileList input[type=checkbox]');
  if (checkboxes.length === 0) return alert('Folder kosong atau belum load');
  if (!confirm('⚠️ Hapus semua file di folder ini?')) return;

  for (const cb of checkboxes) {
    const path = cb.dataset.path;
    const sha  = cb.dataset.sha;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'DELETE',
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ message: `Hapus ${path}`, sha, branch })
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error(`❌ Gagal hapus ${path}`, txt);
      }
    } catch (err) {
      console.error(`❌ Error hapus ${path}`, err);
    }
  }

  alert('✅ Semua file di folder dihapus');
  document.getElementById('fileList').innerHTML = '<small>Folder kosong</small>';
});

/* ---------------------------
  Token helper: simpan & muat token
  - Menggunakan Web Crypto (AES-GCM) bila passphrase diberikan
  - Fallback menyimpan plain jika passphrase kosong dan user pilih simpan plain
----------------------------*/

// util: base64 <-> ArrayBuffer
function abToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}
function base64ToAb(b64) {
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf.buffer;
}

// derive key from passphrase using PBKDF2
async function deriveKeyFromPassword(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), {name: 'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 200000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// encrypt token with passphrase -> returns object {ct, iv, salt} all base64
async function encryptTokenWithPassphrase(token, passphrase) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(passphrase, salt);
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token));
  return { ct: abToBase64(ctBuf), iv: abToBase64(iv), salt: abToBase64(salt) };
}

// decrypt token using passphrase + stored {ct, iv, salt}
async function decryptTokenWithPassphrase(obj, passphrase) {
  try {
    const iv = base64ToAb(obj.iv);
    const salt = base64ToAb(obj.salt);
    const key = await deriveKeyFromPassword(passphrase, new Uint8Array(salt));
    const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, base64ToAb(obj.ct));
    return new TextDecoder().decode(ptBuf);
  } catch (e) {
    throw new Error('Gagal dekripsi — passphrase mungkin salah');
  }
}

// storage keys
const TOKEN_STORE_KEY = 'we_token_store_v1';
const TOKEN_STORE_PLAIN_KEY = 'we_token_plain_v1';

// UI elements
const btnPaste = document.getElementById('btnPaste');
const btnSave = document.getElementById('btnSave');
const btnSavePlain = document.getElementById('btnSavePlain');
const btnUseStored = document.getElementById('btnUseStored');
const btnClearStored = document.getElementById('btnClearStored');
const tokenInput = document.getElementById('githubToken');
const passInput = document.getElementById('passphrase');

btnPaste?.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      tokenInput.value = text.trim();
      showToast('📋 Token dipaste dari clipboard');
    } else {
      alert('Clipboard kosong atau izin ditolak');
    }
  } catch (err) {
    alert('Gagal baca clipboard: ' + err.message);
  }
});

btnSave?.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  const pass = passInput.value;
  if (!token) return alert('Masukkan token dulu!');
  if (!pass) return alert('Masukkan passphrase untuk enkripsi (atau gunakan tombol simpan plain)');
  try {
    const obj = await encryptTokenWithPassphrase(token, pass);
    localStorage.setItem(TOKEN_STORE_KEY, JSON.stringify(obj));
    // remove plain if any
    localStorage.removeItem(TOKEN_STORE_PLAIN_KEY);
    showToast('🔒 Token disimpan terenkripsi');
  } catch (err) {
    alert('Gagal simpan: ' + err.message);
  }
});

btnSavePlain?.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) return alert('Masukkan token dulu!');
  if (!confirm('Token akan disimpan tanpa enkripsi di browser. Lanjutkan?')) return;
  localStorage.setItem(TOKEN_STORE_PLAIN_KEY, token);
  localStorage.removeItem(TOKEN_STORE_KEY);
  showToast('⚠️ Token disimpan plain (kurang aman)');
});

btnUseStored?.addEventListener('click', async () => {
  // prioritas: jika ada encrypted store, pakai itu, minta passphrase
  const encObjRaw = localStorage.getItem(TOKEN_STORE_KEY);
  const plain = localStorage.getItem(TOKEN_STORE_PLAIN_KEY);
  if (encObjRaw) {
    const pass = passInput.value;
    if (!pass) return alert('Masukkan passphrase untuk dekripsi token tersimpan.');
    try {
      const obj = JSON.parse(encObjRaw);
      const token = await decryptTokenWithPassphrase(obj, pass);
      tokenInput.value = token;
      showToast('🔓 Token didekripsi dan dimasukkan');
    } catch (err) {
      alert(err.message || 'Gagal dekripsi token. Pastikan passphrase benar.');
    }
  } else if (plain) {
    tokenInput.value = plain;
    showToast('🔑 Token plain dimasukkan');
  } else {
    alert('Belum ada token tersimpan.');
  }
});

btnClearStored?.addEventListener('click', () => {
  if (!confirm('Hapus token tersimpan dari browser?')) return;
  localStorage.removeItem(TOKEN_STORE_KEY);
  localStorage.removeItem(TOKEN_STORE_PLAIN_KEY);
  passInput.value = '';
  showToast('✅ Token tersimpan dihapus');
});

/* optional: auto-fill token input on load if plain store present (but not encrypted) */
window.addEventListener('load', () => {
  const plain = localStorage.getItem(TOKEN_STORE_PLAIN_KEY);
  if (plain) {
    // jangan auto-paste encrypted token without passphrase
    tokenInput.value = plain;
  }
});
