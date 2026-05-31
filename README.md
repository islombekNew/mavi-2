# MAVI TRAVERTIN — Veb-sayt va Admin Panel

## 📁 Fayl tuzilishi
```
mavi-v2/
├── index.html          ← Bosh sahifa
├── about.html          ← Biz haqimizda
├── products.html       ← Barcha mahsulotlar
├── shop.html           ← Do'kon (buyurtma)
├── videos.html         ← Videolar
├── contact.html        ← Bog'lanish
├── logo.jpg            ← Logo
├── server.js           ← Backend (Node.js)
├── package.json
├── .env.example        ← .env ga nusxa oling
├── css/style.css       ← Barcha sahifalar CSS
├── js/
│   ├── products.js     ← 20 ta mahsulot + narxlar
│   ├── layout.js       ← Header/Footer
│   └── main.js         ← Buyurtma, forma, animatsiya
├── admin/
│   ├── index.html      ← Admin panel
│   ├── admin.css
│   └── admin.js
├── db/                 ← Ma'lumotlar (server yaratadi)
│   ├── orders.json
│   └── messages.json
└── images/             ← RASMLARINGIZNI SHU YERGA
```

## 🚀 Ishga tushirish

```bash
# 1. Kutubxonalar o'rnatish
npm install

# 2. .env fayl yaratish
cp .env.example .env
# .env faylni oching va parolni o'zgartiring!

# 3. Serverni ishga tushirish
node server.js

# Sayt:  http://localhost:3000
# Admin: http://localhost:3000/admin
```

## 🌐 Railway.app ga deploy (bepul)

1. github.com ga kod yuklang (.env yuklamang!)
2. railway.app → "New Project → Deploy from GitHub"
3. Variables qo'shing: ADMIN_PASS, JWT_SECRET, ALLOWED_ORIGINS
4. Tayyor!

## 🔐 Admin panel
- URL: `/admin`
- Login/Parol: `.env` fayldagi ADMIN_USER / ADMIN_PASS
- Standart: `admin` / `Mavi@2024#Secure`

## 🖼️ Rasmlar
`images/` papkasiga qo'ying, keyin `js/products.js` da:
```js
img: 'images/travertin-classic.jpg',
```

## 💰 Domen olish
- `.uz` domen: isoc.uz (~50 000 so'm/yil)
- `.com` domen: namecheap.com (~$10/yil)
