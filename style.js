/* Reset dan font */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
body {
  background: #f5f5f5;
  padding: 20px;
  color: #333;
}

/* Judul utama */
h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.6em;
}

/* Card umum */
.card {
  background: #fff;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

/* Label dan input */
label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}
input[type="text"],
input[type="number"],
select,
textarea {
  width: 100%;
  padding: 6px 10px;
  margin-top: 4px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.95em;
}

/* Textarea JSON */
textarea {
  height: 100px;
  resize: vertical;
  font-family: monospace;
}

/* Kontrol tombol */
.controls {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Tombol */
button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.9em;
  transition: 0.2s;
}
button:hover {
  opacity: 0.85;
}

/* Warna tombol khusus */
.btn-add { background: #28a745; color: #fff; }
.btn-clear { background: #dc3545; color: #fff; }
.btn-generate { background: #007bff; color: #fff; }
.btn-copy { background: #17a2b8; color: #fff; }
.btn-upload { background: #6f42c1; color: #fff; }
.btn-backup { background: #ffc107; color: #333; }

/* Tabel */
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  padding: 8px 10px;
  border: 1px solid #ccc;
  text-align: left;
  min-width: 80px;
}
th {
  background: #007bff;
  color: #fff;
}
td[contenteditable] {
  background: #f9f9f9;
}
tr:nth-child(even) td {
  background: #f2f2f2;
}

/* JSON output */
pre {
  background: #f1f1f1;
  padding: 10px;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
}

/* Flex helpers */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Tombol Floating */
.fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: #28a745;
  color: #fff;
  font-size: 1.5em;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 6px rgba(0,0,0,0.2);
}

/* Navigasi bawah */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #ccc;
  padding: 5px 0;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.1);
}
.bottom-nav {
  position: fixed;   /* tetap menempel di layar */
  bottom: 0;         /* di bagian bawah viewport */
  left: 0;
  width: 100%;
  background: #fff;
  border-top: 1px solid #ccc;
  display: flex;
  justify-content: space-around;
  padding: 6px 0;
  z-index: 1000;     /* agar selalu di atas konten */
  box-shadow: 0 -2px 6px rgba(0,0,0,0.1);
}
.bottom-nav button {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #333;
}
.bottom-nav button .icon {
  font-size: 18px;
}


/* Responsive */
@media (max-width: 600px) {
  .flex-between {
    flex-direction: column;
    gap: 10px;
  }
  .controls {
    flex-direction: column;
  }
}
