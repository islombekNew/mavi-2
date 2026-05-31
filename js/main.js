/* ============================================================
   MAVI TRAVERTIN — MAIN.JS  v2.0
   Sayt va admin panel o'rtasidagi ko'prik
   ============================================================ */

/* ---- API bazaviy manzil ----
   Sayt va server bir joyda bo'lgani uchun "/" ishlatamiz.
   Netlify/Vercel da ishlamaydi — Railway/Render/VPS kerak.
   -------------------------------------------------- */
const API_BASE = "/api";

/* ============================================================
   ORDER MODAL
   ============================================================ */
let _prod = null; // hozirgi mahsulot

function openOrderModal(productId) {
  const p = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).find(
    (x) => x.id === productId,
  );
  if (!p) return;
  _prod = p;

  _set(
    "modalProductName",
    p.name + " — " + p.price + " so'm/" + p.unit + " (naqt)",
  );
  _set("qtyUnit", p.unit);

  const qi = _el("qtyInput");
  if (qi) qi.value = 1;

  updateTotal();
  _hide("orderSuccess");

  const form = _el("orderForm");
  if (form) form.reset();

  _openOverlay("orderModal");
}

function closeOrderModal() {
  _closeOverlay("orderModal");
}

function changeQty(d) {
  const qi = _el("qtyInput");
  if (!qi) return;
  qi.value = Math.max(1, (parseInt(qi.value) || 1) + d);
  updateTotal();
}

function updateTotal() {
  const tp = _el("totalPrice");
  if (!tp || !_prod) return;
  const qty = parseInt(_el("qtyInput")?.value) || 1;
  const raw = _prod.price.replace(/\s/g, "").replace(/[^\d]/g, "");
  if (
    raw &&
    !String(_prod.price).includes("–") &&
    !String(_prod.price).includes("-")
  ) {
    tp.textContent = (parseInt(raw) * qty).toLocaleString("uz-UZ") + " so'm";
  } else {
    tp.textContent = _prod.price + " so'm/" + _prod.unit;
  }
}

/* ============================================================
   SUBMIT ORDER — API ga yuborish
   ============================================================ */
async function submitOrder(e) {
  e.preventDefault();
  if (!_prod) return;

  const form = e.target;

  // Telefon tekshirish
  if (!validatePhoneOnSubmit(form)) return;
  const qty = _el("qtyInput")?.value || "1";

  const payload = {
    product_id: _prod.id,
    product_name: _prod.name,
    product_price: _prod.price + " so'm/" + _prod.unit,
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    qty: qty + " " + _prod.unit,
    note: form.note?.value?.trim() || "",
  };

  const btn = form.querySelector("[type=submit]");
  _setBtnState(btn, true, "Yuborilmoqda...");

  const ok = await _postAPI("/orders", payload);

  _setBtnState(btn, false, "✓ Buyurtma berish");

  if (ok) {
    _show("orderSuccess");
    form.reset();
    setTimeout(closeOrderModal, 2500);
  } else {
    alert(
      "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring yoki telefon orqali bog'laning.",
    );
  }
}

/* ============================================================
   SUBMIT CONTACT FORM
   ============================================================ */
async function submitForm(e) {
  e.preventDefault();
  const form = e.target;

  // Telefon tekshirish
  if (!validatePhoneOnSubmit(form)) return;

  const payload = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email?.value?.trim() || "",
    message: form.message.value.trim(),
  };

  const btn = _el("formSubmitBtn");
  _hide("formSuccess");
  _hide("formError");
  _setBtnState(btn, true, "Yuborilmoqda...");

  const ok = await _postAPI("/messages", payload);

  _setBtnState(btn, false, "Xabar yuborish");

  if (ok) {
    _show("formSuccess");
    form.reset();
    setTimeout(() => _hide("formSuccess"), 6000);
  } else {
    _show("formError");
    setTimeout(() => _hide("formError"), 5000);
  }
}

/* ============================================================
   API HELPER
   ============================================================ */
async function _postAPI(endpoint, data) {
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    console.error("API xato:", err.error || res.status);
    return false;
  } catch (e) {
    // Server yo'q — localhost:5500 da ishlayapsiz
    // Yechim: node server.js ishga tushiring va localhost:3000 da oching
    console.warn("Server yo'q yoki CORS xatosi:", e.message);
    console.warn("Yechim: http://localhost:3000 da oching");
    return false;
  }
}

/* ============================================================
   RENDER — MAHSULOT KARTALARI
   ============================================================ */

/* Products page (dark bg) */
function prodCardHtml(p) {
  const img = p.img
    ? `<img src="${p.img}" alt="${esc(p.name)}"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
           onerror="this.style.display='none'"/>`
    : "";
  return `
  <div class="prod-card reveal" data-cat="${p.cat}">
    <div class="prod-img" style="position:relative;">
      ${img}
      <div class="prod-ph" style="${p.img ? "display:none;" : ""}position:absolute;inset:0;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
        <strong>${esc(p.imgLabel || "380×285px")}</strong>
        <span style="font-size:9px;opacity:0.5;">images/ ga rasm qo'ying</span>
      </div>
      ${p.badge ? `<div class="prod-badge">${esc(p.badge)}</div>` : ""}
    </div>
    <div class="prod-body">
      <div class="prod-cat">${esc(catLabel(p.cat))}</div>
      <div class="prod-name">${esc(p.name)}</div>
      <div class="prod-desc">${esc(p.desc)}</div>
      <div class="prod-price">${esc(p.price)} <small>so'm/${esc(p.unit)}</small></div>
      ${
        p.price2
          ? `<div style="font-size:11px;color:rgba(245,240,235,0.3);margin-top:2px;">
        Shot: <span style="color:rgba(218,120,89,0.7);">${esc(p.price2)}</span> so'm
      </div>`
          : ""
      }
      <button class="prod-btn" onclick="openOrderModal(${p.id})">Buyurtma berish</button>
    </div>
  </div>`;
}

/* Shop page (light bg) */
function shopCardHtml(p) {
  const img = p.img
    ? `<img src="${p.img}" alt="${esc(p.name)}"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 0.4s;"
           onerror="this.style.display='none'"/>`
    : "";
  return `
  <div class="shop-card reveal" data-cat="${p.cat}">
    <div class="shop-img" style="position:relative;overflow:hidden;">
      ${img}
      <div class="shop-img-ph">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
        <strong>${esc(p.name)}</strong>
        <span>${esc(p.imgLabel || "380×285px")}</span>
      </div>
      ${p.badge ? `<div class="prod-badge">${esc(p.badge)}</div>` : ""}
    </div>
    <div class="shop-body">
      <div class="shop-cat">${esc(catLabel(p.cat))}</div>
      <div class="shop-name">${esc(p.name)}</div>
      <div class="shop-desc">${esc(p.desc)}</div>
      <div class="shop-price">${esc(p.price)} <small>so'm/${esc(p.unit)}</small></div>
      ${
        p.price2
          ? `<div style="font-size:11px;color:var(--sand);margin-bottom:10px;">
        Shot: <strong style="color:var(--rust-deep);">${esc(p.price2)}</strong> so'm
      </div>`
          : '<div style="margin-bottom:10px;"></div>'
      }
      <button class="shop-add-btn" onclick="openOrderModal(${p.id})">Buyurtma →</button>
    </div>
  </div>`;
}

function renderShopGrid(gridId, products) {
  const g = _el(gridId);
  if (!g) return;
  g.innerHTML = products.length
    ? products.map(shopCardHtml).join("")
    : '<p style="color:var(--sand);padding:20px;grid-column:1/-1;">Mahsulot topilmadi</p>';
}

/* ============================================================
   VIDEO
   ============================================================ */
function playVideo(btn, src) {
  const thumb = btn.closest(".video-thumb") || btn.parentNode;
  if (!src || src === "" || src.startsWith("images/video")) {
    thumb.style.background = "#111";
    btn.innerHTML = `<span style="color:rgba(255,255,255,0.35);font-size:11px;
      font-family:sans-serif;padding:12px;text-align:center;display:block;">
      Video qo'shilmagan.<br/>src='video.mp4' qo'ying</span>`;
    btn.style.cursor = "default";
    return;
  }
  const v = document.createElement("video");
  v.src = src;
  v.controls = true;
  v.autoplay = true;
  v.playsinline = true;
  v.style.cssText =
    "width:100%;height:100%;object-fit:cover;position:absolute;inset:0;";
  thumb.appendChild(v);
  btn.remove();
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initReveal() {
  if (!("IntersectionObserver" in window)) {
    document
      .querySelectorAll(".reveal")
      .forEach((el) => el.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -16px 0px" },
  );
  document
    .querySelectorAll(".reveal:not(.visible)")
    .forEach((el) => obs.observe(el));
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function _openOverlay(id) {
  const m = _el(id);
  if (m) {
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
function _closeOverlay(id) {
  const m = _el(id);
  if (m) {
    m.classList.remove("open");
    document.body.style.overflow = "";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeOrderModal();
    ["orderModal"].forEach((id) => _closeOverlay(id));
  }
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    _closeOverlay(e.target.id);
    document.body.style.overflow = "";
  }
});

/* ============================================================
   DOM HELPERS
   ============================================================ */
const _el = (id) => document.getElementById(id);
const _set = (id, v) => {
  const e = _el(id);
  if (e) e.textContent = v;
};
const _show = (id) => {
  const e = _el(id);
  if (e) e.style.display = "block";
};
const _hide = (id) => {
  const e = _el(id);
  if (e) e.style.display = "none";
};
const _setBtnState = (btn, disabled, text) => {
  if (!btn) return;
  btn.disabled = disabled;
  btn.textContent = text;
};
function esc(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      })[c],
  );
}

document.addEventListener("DOMContentLoaded", initReveal);

/* ============================================================
   TELEFON INPUT — avtomatik +998 va format
   Qoidalar:
   - Yozish boshlanganda +998 avtomatik qo'yiladi
   - Foydalanuvchi faqat 9 ta raqam yozadi (+998 dan keyin)
   - Jami max: +998XXXXXXXXX = 13 belgi
   - Kamroq yozilsa ham yuborishga yo'l qo'yilmaydi
   ============================================================ */
function initPhoneInputs() {
  document.querySelectorAll('input[name="phone"]').forEach(setupPhone);
}

function setupPhone(inp) {
  // Placeholder
  inp.placeholder = "+998 XX XXX XX XX";
  inp.maxLength = 13;
  inp.inputMode = "numeric";

  // Focus — +998 qo'yish
  inp.addEventListener("focus", () => {
    if (!inp.value) inp.value = "+998";
  });

  // Blur — bo'sh bo'lsa tozalash
  inp.addEventListener("blur", () => {
    if (inp.value === "+998") inp.value = "";
    validatePhone(inp);
  });

  // Input — faqat raqam, +998 dan keyin max 9 ta
  inp.addEventListener("input", () => {
    let raw = inp.value;

    // Har doim +998 bilan boshlansin
    if (!raw.startsWith("+998")) {
      // Faqat raqamlarni olib +998 ga qo'shamiz
      const digits = raw.replace(/\D/g, "");
      if (digits.startsWith("998")) {
        raw = "+" + digits;
      } else if (digits.startsWith("8") || digits.startsWith("9")) {
        raw = "+998" + digits.replace(/^[89]/, "");
      } else {
        raw = "+998" + digits;
      }
    }

    // +998 dan keyingi qism — faqat raqam, max 9 ta
    const prefix = "+998";
    let rest = raw.slice(prefix.length).replace(/\D/g, "").slice(0, 9);
    inp.value = prefix + rest;

    validatePhone(inp);
  });

  // Backspace — +998 ni o'chirmaydi
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && inp.value === "+998") {
      e.preventDefault();
    }
  });
}

function validatePhone(inp) {
  // +998 + 9 ta raqam = 13 belgi bo'lsa to'g'ri
  const valid = /^\+998\d{9}$/.test(inp.value);
  if (inp.value.length > 4 && !valid) {
    inp.style.borderColor = "var(--rust)";
    inp.style.boxShadow = "0 0 0 2px rgba(218,120,89,0.2)";
  } else {
    inp.style.borderColor = "";
    inp.style.boxShadow = "";
  }
  return valid;
}

// Modal ochilganda ham phone inputni sozlash
const _origOpenOrder = window.openOrderModal;
window.openOrderModal = function (id) {
  _origOpenOrder && _origOpenOrder(id);
  // Kichik delay — modal DOM ga qo'shilguncha
  setTimeout(() => {
    document
      .querySelectorAll('#orderModal input[name="phone"]')
      .forEach(setupPhone);
  }, 50);
};

// Form submit oldidan telefon tekshirish
function validatePhoneOnSubmit(form) {
  const phoneInp = form.querySelector('input[name="phone"]');
  if (!phoneInp) return true;
  if (!validatePhone(phoneInp)) {
    phoneInp.focus();
    phoneInp.style.borderColor = "var(--rust)";
    // Xato xabari
    let errMsg = phoneInp.parentNode.querySelector(".phone-err");
    if (!errMsg) {
      errMsg = document.createElement("div");
      errMsg.className = "phone-err";
      errMsg.style.cssText =
        "font-size:11px;color:var(--rust);margin-top:4px;font-weight:600;";
      phoneInp.parentNode.appendChild(errMsg);
    }
    errMsg.textContent = "+998 dan keyin 9 ta raqam yozing";
    setTimeout(() => {
      if (errMsg) errMsg.textContent = "";
    }, 3000);
    return false;
  }
  // Xato xabarini tozalash
  const errMsg = form.querySelector(".phone-err");
  if (errMsg) errMsg.textContent = "";
  return true;
}

document.addEventListener("DOMContentLoaded", initPhoneInputs);

// Dinamik modallar uchun — observer
const _phoneObserver = new MutationObserver(() => {
  document
    .querySelectorAll('input[name="phone"]:not([data-phone-init])')
    .forEach((inp) => {
      inp.setAttribute("data-phone-init", "1");
      setupPhone(inp);
    });
});
_phoneObserver.observe(document.body, { childList: true, subtree: true });
