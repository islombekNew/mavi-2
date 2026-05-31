// ============================================================
// SHARED LAYOUT — header va footer barcha sahifalarda
// ============================================================
const PHONE1 = '+998932111000';
const PHONE1_DISPLAY = '+998 93 211 10 00';
const PHONE2 = '+998339661111';
const PHONE2_DISPLAY = '+998 33 966 11 11';
const WORK_HOURS = '7:30 dan 21:30 gacha';
const ADDRESS = 'Namangan tuman, Sho\'rqo\'rg\'on';
const BRAND_NAME = 'Mavi'; // Telefon saqlanganda shu nom chiqadi
const BRAND_FULL = 'Mavi Travertin';

function getHeaderHTML(activePage) {
    const pages = [
        { href: 'index.html', label: 'Bosh sahifa' },
        { href: 'about.html', label: 'Biz haqimizda' },
        { href: 'products.html', label: 'Mahsulotlar' },
        // { href:'shop.html',     label:'Do\'kon' },
        { href: 'videos.html', label: 'Videolar' },
        { href: 'contact.html', label: 'Bog\'lanish' },
    ];
    return `
  <header class="header" id="mainHeader">
    <div class="nav-inner">
      <a href="index.html" class="logo">
        <div class="logo-img-wrap">
          <img src="logo.jpg" alt="Mavi Travertin" class="logo-img" onerror="this.style.opacity='0'"/>
        </div>
        <div class="logo-text-wrap">
          <span class="logo-main">MAVI</span>
          <span class="logo-sub">TRAVERTIN</span>
        </div>
      </a>
      <nav class="nav-links" id="navLinks">
        ${pages.map(p=>`<a href="${p.href}" class="${p.href===activePage?'active':''}">${p.label}</a>`).join('')}
      </nav>
      <button class="hamburger" id="hamburger" onclick="toggleMenu()">
        <span></span><span></span><span></span>
      </button>
    </div>
    <nav class="mobile-menu" id="mobileMenu">
      ${pages.map(p=>`<a href="${p.href}" class="${p.href===activePage?'active':''}">${p.label}</a>`).join('')}
    </nav>
  </header>`;
}

function getFooterHTML() {
  return `
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="logo.jpg" alt="Mavi Travertin" class="footer-logo-img" onerror="this.style.opacity='0'"/>
          <div class="logo-text-wrap"><span class="logo-main">MAVI</span><span class="logo-sub">TRAVERTIN</span></div>
        </div>
        <p class="footer-desc">Sifat kafolat kaliti!<br/>${ADDRESS}</p>
        <div class="footer-hours">⏰ Ish vaqti: ${WORK_HOURS}</div>
      </div>
      <div>
        <div class="footer-h">Sahifalar</div>
        <div class="footer-links">
          <a href="index.html">Bosh sahifa</a>
          <a href="about.html">Biz haqimizda</a>
          <a href="products.html">Mahsulotlar</a>
          <a href="shop.html">Do'kon</a>
          <a href="videos.html">Videolar</a>
          <a href="contact.html">Bog'lanish</a>
        </div>
      </div>
      <div>
        <div class="footer-h">Bog'lanish</div>
        <div class="footer-links">
          <a href="tel:${PHONE1}">📞 ${PHONE1_DISPLAY}</a>
          <a href="tel:${PHONE2}">📞 ${PHONE2_DISPLAY}</a>
          <a href="https://www.instagram.com/mavi__zavod?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank">📸 Instagram</a>
          <a href="https://t.me/grandmixx" target="_blank">📢 Telegram Kanal</a>
          <a href="https://t.me/mavi_travertin" target="_blank">💬 Telegram LIC</a>
          <a href="https://yandex.uz/maps/?text=${encodeURIComponent(ADDRESS)}" target="_blank">📍 Yandex Maps</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <div class="footer-copy">© 2024 Mavi Travertin. Barcha huquqlar himoyalangan.</div>
        <div class="footer-motto">Sifat kafolat kaliti!</div>
      </div>
    </div>
  </footer>`;
}

// Header scroll + mobile menu
document.addEventListener('DOMContentLoaded', () => {
  // Inject header and footer if placeholders exist
  const hEl = document.getElementById('site-header');
  const fEl = document.getElementById('site-footer');
  if (hEl) hEl.outerHTML = hEl.getAttribute('data-page') ? getHeaderHTML(hEl.getAttribute('data-page')) : getHeaderHTML('');
  if (fEl) fEl.outerHTML = getFooterHTML();

  window.addEventListener('scroll', () => {
    const h = document.getElementById('mainHeader');
    if (h) h.classList.toggle('scrolled', window.scrollY > 40);
  });
});

function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('mobileMenu').classList.toggle('open');
}
document.addEventListener('click', e => {
  const mm = document.getElementById('mobileMenu');
  const hb = document.getElementById('hamburger');
  if (mm && mm.classList.contains('open') && hb && !hb.contains(e.target) && !mm.contains(e.target)) {
    mm.classList.remove('open');
    hb.classList.remove('open');
  }
});