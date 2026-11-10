/* ================= 1. PASSWORD-ONLY ADMIN ACCESS ================= */
const ADMIN_PASSWORD = '080980';

/* Remove older credentials and session once so the new password is required. */
if (localStorage.getItem('mbakana_admin_password_version') !== '080980') {
  localStorage.removeItem('admin_mbakana');
  localStorage.removeItem('mbakana_admin_user');
  localStorage.removeItem('mbakana_admin_pass');
  localStorage.removeItem('mbakana_remembered_user');
  localStorage.setItem('mbakana_admin_password_version', '080980');
}

/* DOM Elements */
const adminWrap = document.getElementById('adminWrap');
const loginBackdrop = document.getElementById('loginBackdrop');
const adminPass = document.getElementById('adminPass');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const togglePassBtn = document.getElementById('togglePassBtn');
const loginError = document.getElementById('loginError');
const loginErrorText = document.getElementById('loginErrorText');
const displayAdminUser = document.getElementById('displayAdminUser');
const logoutBtnTop = document.getElementById('logoutBtnTop');
const sidebarLogout = document.getElementById('sidebarLogout');
const sidebarToggle = document.getElementById('sidebarToggle');
const adminSidebar = document.getElementById('adminSidebar');

const navLinks = document.querySelectorAll('.admin-nav a[data-section]');
const sections = document.querySelectorAll('.admin-section');

function updateAdminIdentity() {
  if (displayAdminUser) displayAdminUser.textContent = 'Administrator';
}

/* ================= 2. CHECK AUTH STATUS ================= */
function checkAuth() {
  const isAuth = localStorage.getItem('admin_mbakana') === '1';
  if (isAuth) {
    adminWrap.classList.add('open');
    loginBackdrop.classList.remove('open');
    updateAdminIdentity();
    renderAllDashboardData();
  } else {
    adminWrap.classList.remove('open');
    loginBackdrop.classList.add('open');
    adminPass?.focus();
  }
}

/* ================= 3. LOGIN ACTION ================= */
function doLogin() {
  if (!loginError || !adminPass) return;
  loginError.classList.remove('shake');
  loginError.style.display = 'none';

  const enteredPass = adminPass.value;
  if (!enteredPass) {
    if (loginErrorText) loginErrorText.textContent = 'Harap isi password!';
    loginError.style.display = 'flex';
    loginError.classList.add('shake');
    return;
  }

  if (enteredPass === ADMIN_PASSWORD) {
    localStorage.setItem('admin_mbakana', '1');
    adminPass.value = '';
    showToast('Login berhasil! Selamat datang.', 'success');
    checkAuth();
  } else {
    if (loginErrorText) loginErrorText.textContent = 'Password salah! Silakan coba lagi.';
    loginError.style.display = 'flex';
    loginError.classList.add('shake');
    adminPass.value = '';
    adminPass.focus();
  }
}

adminLoginBtn?.addEventListener('click', doLogin);
adminPass?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doLogin();
});

// Toggle password eye
togglePassBtn?.addEventListener('click', () => {
  if (!adminPass) return;
  const type = adminPass.type === 'password' ? 'text' : 'password';
  adminPass.type = type;
  togglePassBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

/* ================= 4. LOGOUT ================= */
function doLogout(e) {
  if (e) e.preventDefault();
  if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
    localStorage.removeItem('admin_mbakana');
    showToast('Anda telah keluar dari panel admin.', 'success');
    checkAuth();
  }
}

logoutBtnTop?.addEventListener('click', doLogout);
sidebarLogout?.addEventListener('click', doLogout);

// Mobile sidebar toggle
sidebarToggle?.addEventListener('click', () => {
  adminSidebar?.classList.toggle('mobile-open');
});

/* ================= 5. TAB NAVIGATION ================= */
function switchSection(sectionId) {
  navLinks.forEach(l => {
    if (l.dataset.section === sectionId) l.classList.add('active');
    else l.classList.remove('active');
  });

  sections.forEach(s => {
    if (s.id === sectionId + 'View') s.classList.add('active');
    else s.classList.remove('active');
  });

  if (adminSidebar?.classList.contains('mobile-open')) {
    adminSidebar.classList.remove('mobile-open');
  }

  if (sectionId === 'pesanan' || sectionId === 'ringkasan') {
    renderOrders();
  }
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = link.dataset.section;
    switchSection(sec);
  });
});

// Quick action buttons
document.getElementById('qaViewNewOrders')?.addEventListener('click', () => {
  switchSection('pesanan');
  filterBtns.forEach(b => {
    if (b.dataset.filter === 'baru') b.classList.add('active');
    else b.classList.remove('active');
  });
  currentFilter = 'baru';
  renderOrders();
});

document.getElementById('qaEditPrices')?.addEventListener('click', () => switchSection('harga'));
document.getElementById('qaUpdateQris')?.addEventListener('click', () => switchSection('qr'));

/* ================= 6. ORDERS MANAGEMENT ================= */
const ordersList = document.getElementById('ordersList');
const recentOrdersContainer = document.getElementById('recentOrdersContainer');
const filterBtns = document.querySelectorAll('.filter-btn');
const orderSearchInput = document.getElementById('orderSearchInput');
let currentFilter = 'all';
let searchQuery = '';

orderSearchInput?.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderOrders();
});

function getOrders() {
  return JSON.parse(localStorage.getItem('mbakana_orders') || '[]');
}

function renderAllDashboardData() {
  renderOrders();
  loadPricesIntoInputs();
  loadQrisAdmin();
}

function renderOrders() {
  const orders = getOrders();

  // Metrics
  const totalOrdersCount = orders.length;
  const baruCount = orders.filter(o => o.status === 'baru').length;
  const selesaiCount = orders.filter(o => o.status === 'selesai').length;
  const totalOmset = orders
    .filter(o => o.status === 'selesai' || o.status === 'baru')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Update counters
  const statOmset = document.getElementById('statOmset');
  const statTotal = document.getElementById('statTotalOrders');
  const statBaru = document.getElementById('statBaruOrders');
  const statSelesai = document.getElementById('statSelesaiOrders');
  if (statOmset) statOmset.textContent = 'Rp ' + totalOmset.toLocaleString('id-ID');
  if (statTotal) statTotal.textContent = totalOrdersCount;
  if (statBaru) statBaru.textContent = baruCount;
  if (statSelesai) statSelesai.textContent = selesaiCount;

  const countAll = document.getElementById('countAll');
  const countBaru = document.getElementById('countBaru');
  const countSelesai = document.getElementById('countSelesai');
  if (countAll) countAll.textContent = totalOrdersCount;
  if (countBaru) countBaru.textContent = baruCount;
  if (countSelesai) countSelesai.textContent = selesaiCount;

  const sidebarBadge = document.getElementById('sidebarNewCount');
  if (sidebarBadge) {
    if (baruCount > 0) {
      sidebarBadge.textContent = baruCount;
      sidebarBadge.style.display = 'inline-block';
    } else {
      sidebarBadge.style.display = 'none';
    }
  }

  const qaNewCount = document.getElementById('qaNewCount');
  if (qaNewCount) qaNewCount.textContent = baruCount;

  // Filter & Search
  let filtered = orders.filter(o => {
    if (currentFilter !== 'all' && o.status !== currentFilter) return false;
    if (searchQuery) {
      const matchName = (o.nama || '').toLowerCase().includes(searchQuery);
      const matchHp = (o.hp || '').toLowerCase().includes(searchQuery);
      const matchId = String(o.id || '').includes(searchQuery);
      return matchName || matchHp || matchId;
    }
    return true;
  });

  // Render main order list
  if (ordersList) {
    ordersList.innerHTML = '';
    if (filtered.length === 0) {
      ordersList.innerHTML = `
        <div style="text-align:center; padding:48px 20px; background:#fff; border-radius:16px; border:1px solid var(--admin-border); color:var(--admin-muted);">
          <div style="font-size:3rem; margin-bottom:12px;">📭</div>
          <strong style="font-size:1.1rem; color:var(--admin-brown-dark); display:block; margin-bottom:4px;">Tidak Ada Pesanan Ditemukan</strong>
          <p style="margin:0; font-size:0.9rem;">Belum ada pesanan yang sesuai dengan filter atau kata kunci saat ini.</p>
        </div>
      `;
    } else {
      filtered.slice().reverse().forEach(order => {
        ordersList.appendChild(createOrderCardElement(order));
      });
    }
  }

  // Render recent orders on Ringkasan
  if (recentOrdersContainer) {
    recentOrdersContainer.innerHTML = '';
    const recentSlice = orders.slice().reverse().slice(0, 3);
    if (recentSlice.length === 0) {
      recentOrdersContainer.innerHTML = '<p style="color:var(--admin-muted); font-size:0.9rem; text-align:center; padding:20px;">Belum ada pesanan terbaru.</p>';
    } else {
      recentSlice.forEach(order => {
        recentOrdersContainer.appendChild(createOrderCardElement(order));
      });
    }
  }

  attachOrderCardListeners();
}

function createOrderCardElement(order) {
  const card = document.createElement('div');
  card.className = `admin-order-card ${order.status}`;

  const itemsHtml = order.items.map(i => {
    const subtotal = i.price * i.qty;
    return `
      <div class="order-item-row">
        <div>
          <strong>${i.name}</strong> ${i.temp ? `<span style="font-size:0.8rem; background:#fed7aa; padding:1px 6px; border-radius:4px; font-weight:700;">${i.temp}</span>` : ''} 
          <span style="color:var(--admin-muted);">x${i.qty}</span>
          ${i.catatan ? `<div style="font-size:0.82rem; color:var(--admin-muted);">Catatan: <em>${i.catatan}</em></div>` : ''}
        </div>
        <div><strong>Rp ${subtotal.toLocaleString('id-ID')}</strong></div>
      </div>
    `;
  }).join('');

  const cleanWa = (order.hp || '').replace(/\D/g, '');
  const waLink = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
  const waGreeting = encodeURIComponent(`Halo ${order.nama}, ini dari Warung Mie Ayam Mbak Ana terkait pesanan #${order.id}.`);

  const statusBadge = order.status === 'baru'
    ? '<span class="status-badge baru">🔔 Pesanan Baru</span>'
    : '<span class="status-badge selesai">✅ Selesai</span>';

  const buktiHtml = order.buktiImage
    ? `
      <div class="order-bukti-wrap">
        <img src="${order.buktiImage}" alt="Bukti Pembayaran" class="order-bukti-thumb" data-full="${order.buktiImage}" title="Klik untuk perbesar" />
        <div style="font-size:0.85rem;">
          <strong style="color:var(--admin-brown-dark); display:block;">Bukti Pembayaran QRIS</strong>
          <span style="color:var(--admin-muted);">Klik gambar untuk melihat dalam ukuran penuh</span>
        </div>
      </div>
    `
    : '';

  card.innerHTML = `
    <div class="order-header">
      <div class="order-id-group">
        <div class="order-id">#${order.id}</div>
        <div class="order-time-tag">📅 ${order.time}</div>
      </div>
      ${statusBadge}
    </div>

    <div class="order-customer-info">
      <div class="customer-item">
        <span style="color:var(--admin-muted); display:block; font-size:0.8rem;">Nama Pelanggan</span>
        <strong>👤 ${order.nama}</strong>
      </div>
      <div class="customer-item">
        <span style="color:var(--admin-muted); display:block; font-size:0.8rem;">Nomor Telepon/WA</span>
        <strong>📞 ${order.hp}</strong>
      </div>
      <div class="customer-item">
        <span style="color:var(--admin-muted); display:block; font-size:0.8rem;">Metode &amp; Pengambilan</span>
        <strong>📦 ${order.jenis} · 💳 ${order.bayar}</strong>
      </div>
      <div class="customer-item" style="grid-column: 1 / -1;">
        <span style="color:var(--admin-muted); display:block; font-size:0.8rem;">Alamat Lengkap</span>
        <span>📍 ${order.alamat}</span>
      </div>
    </div>

    <div class="order-items-box">
      <div class="order-items-title">Detail Pesanan Menu</div>
      ${itemsHtml}
    </div>

    <div class="order-total-bar">
      <span>Total Pembayaran</span>
      <strong>Rp ${order.total.toLocaleString('id-ID')}</strong>
    </div>

    ${buktiHtml}

    <div class="order-actions-bar">
      <button class="btn-action btn-status-toggle" data-id="${order.id}" data-status="${order.status}">
        ${order.status === 'baru' ? '✓ Tandai Selesai' : '↺ Kembalikan ke Baru'}
      </button>
      <a href="https://wa.me/${waLink}?text=${waGreeting}" target="_blank" class="btn-action btn-chat-wa">
        <span>💬</span>
        <span>Chat WhatsApp</span>
      </a>
      <button class="btn-action btn-delete-order" data-id="${order.id}">
        <span>🗑️</span>
        <span>Hapus</span>
      </button>
    </div>
  `;

  return card;
}

function attachOrderCardListeners() {
  document.querySelectorAll('.btn-status-toggle').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const current = btn.dataset.status;
      const next = current === 'baru' ? 'selesai' : 'baru';
      updateOrderStatus(id, next);
    };
  });

  document.querySelectorAll('.btn-delete-order').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      if (confirm(`Yakin ingin menghapus pesanan #${id}?`)) {
        deleteOrder(id);
      }
    };
  });

  document.querySelectorAll('.order-bukti-thumb').forEach(img => {
    img.onclick = () => {
      openLightbox(img.dataset.full);
    };
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderOrders();
  });
});

function updateOrderStatus(id, newStatus) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = newStatus;
    localStorage.setItem('mbakana_orders', JSON.stringify(orders));
    showToast(`Status pesanan #${id} diubah ke '${newStatus}'.`, 'success');
    renderOrders();
  }
}

function deleteOrder(id) {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== id);
  localStorage.setItem('mbakana_orders', JSON.stringify(filtered));
  showToast(`Pesanan #${id} berhasil dihapus.`, 'success');
  renderOrders();
}


/* ================= 7. LIGHTBOX ================= */
const lightboxModal = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

function openLightbox(src) {
  if (lightboxImg && lightboxModal) {
    lightboxImg.src = src;
    lightboxModal.classList.add('open');
  }
}

lightboxClose?.addEventListener('click', () => {
  lightboxModal?.classList.remove('open');
});

lightboxModal?.addEventListener('click', (e) => {
  if (e.target === lightboxModal) {
    lightboxModal.classList.remove('open');
  }
});

/* ================= 8. PRICE MANAGEMENT ================= */
const priceMap = {
  'edit-mie-ayam': 'mie-ayam',
  'edit-mieso': 'mieso',
  'edit-bakso': 'bakso',
  'edit-soto': 'soto',
  'edit-teh-jumbo': 'teh-jumbo',
  'edit-es-jeruk': 'es-jeruk',
  'edit-kopi': 'kopi',
  'edit-juice': 'juice',
  'edit-susu': 'susu',
};

const defaultPrices = {
  'mie-ayam': 7000,
  'mieso': 8000,
  'bakso': 10000,
  'soto': 6000,
  'teh-jumbo': 3000,
  'es-jeruk': 3000,
  'kopi': 4000,
  'juice': 7000,
  'susu': 3000,
};

function loadPricesIntoInputs() {
  Object.keys(priceMap).forEach(inputId => {
    const el = document.getElementById(inputId);
    const productId = priceMap[inputId];
    const saved = localStorage.getItem('price_' + productId);
    if (el) {
      el.value = saved ? saved : defaultPrices[productId];
    }
  });
}

document.getElementById('savePrices')?.addEventListener('click', () => {
  Object.keys(priceMap).forEach(inputId => {
    const el = document.getElementById(inputId);
    const productId = priceMap[inputId];
    if (el && el.value) {
      localStorage.setItem('price_' + productId, el.value);
    }
  });
  showToast('Perubahan harga berhasil disimpan dan langsung aktif di web!', 'success');
});

document.getElementById('resetDefaultPrices')?.addEventListener('click', () => {
  if (confirm('Kembalikan semua harga ke harga standar warung?')) {
    Object.keys(priceMap).forEach(inputId => {
      const el = document.getElementById(inputId);
      const productId = priceMap[inputId];
      if (el) {
        el.value = defaultPrices[productId];
        localStorage.removeItem('price_' + productId);
      }
    });
    showToast('Harga telah direset ke nilai standar warung.', 'success');
  }
});

/* ================= 9. QRIS MANAGEMENT ================= */
const qrFile = document.getElementById('qrFile');
const qrUrlInput = document.getElementById('qrUrlInput');
const qrCurrent = document.getElementById('qrCurrent');
const saveQrisBtn = document.getElementById('saveQris');
const removeQrisBtn = document.getElementById('removeQris');
let stagedQrisImage = '';

function loadQrisAdmin() {
  if (!qrCurrent) return;
  const saved = localStorage.getItem('qris_mbakana');
  if (saved) {
    qrCurrent.innerHTML = `<img src="${saved}" alt="QRIS Warung" />`;
  } else {
    qrCurrent.innerHTML = `
      <div class="qris-placeholder">
        <span>📷</span>
        <p>Belum ada foto QRIS yang diunggah.</p>
      </div>
    `;
  }
}

qrFile?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      stagedQrisImage = ev.target.result;
      if (qrCurrent) {
        qrCurrent.innerHTML = `<img src="${stagedQrisImage}" alt="QRIS Baru (Preview)" /><p style="font-size:0.8rem;color:var(--admin-accent);margin-top:6px;">Pratinjau baru. Klik Simpan untuk menerapkan.</p>`;
      }
    };
    reader.readAsDataURL(file);
  }
});

qrUrlInput?.addEventListener('input', () => {
  const val = qrUrlInput.value.trim();
  if (val) {
    stagedQrisImage = val;
    if (qrCurrent) {
      qrCurrent.innerHTML = `<img src="${val}" alt="QRIS Baru (Preview)" onerror="this.onerror=null;this.parentElement.innerHTML='<p style=color:red>Gambar tidak valid</p>';" />`;
    }
  }
});

saveQrisBtn?.addEventListener('click', () => {
  if (stagedQrisImage) {
    localStorage.setItem('qris_mbakana', stagedQrisImage);
    showToast('Foto QRIS berhasil disimpan!', 'success');
    loadQrisAdmin();
  } else {
    showToast('Pilih foto QRIS terlebih dahulu.', 'error');
  }
});

removeQrisBtn?.addEventListener('click', () => {
  if (confirm('Hapus foto QRIS warung?')) {
    localStorage.removeItem('qris_mbakana');
    stagedQrisImage = '';
    if (qrFile) qrFile.value = '';
    if (qrUrlInput) qrUrlInput.value = '';
    loadQrisAdmin();
    showToast('Foto QRIS berhasil dihapus.', 'success');
  }
});


/* ================= 11. TOAST NOTIFICATION ================= */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(120%)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

/* ================= 12. INITIALIZE ================= */
checkAuth();


