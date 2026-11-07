# Dooars Daily Basket - InfinityFree Deployment Guide

Aapke web app ko **InfinityFree** (ya kisi bhi cPanel/Apache web hosting) par host karne ke liye sabhi zaroori configuration files ready kar di gayi hain:

1. **`.htaccess` File Added (`/public/.htaccess` aur `/.htaccess`)**:
   - React Single Page App (SPA) ke liye Apache URL rewrite enable kiya gaya hai.
   - Jab koi bhi user direct `/admin`, `/login`, `/market`, `/delivery` kholega ya page refresh karega, to InfinityFree 404 error nahi dega, balki cleanly React app open karega.
   - Caching aur security headers bhi configured hain.
2. **`vite.config.ts` Base URL**:
   - Production build ke liye `base: '/'` set kar diya gaya hai, taaki InfinityFree ke subdomain ya custom domain par sabhi scripts aur stylesheets seedhe load hon bina kisi path error ke.

---

## Step-by-Step InfinityFree Par Deploy Kaise Karein

### Step 1: Production Build Banayein
Apne computer ke terminal me ye command chalayein:
```bash
npm run build
```
Build complete hone ke baad aapke project me **`dist`** naam ka folder ban jayega.
Is `dist` folder ke andar ye sabhi files hongi:
- `index.html`
- `.htaccess`
- `assets/` (JavaScript aur CSS bundles)
- `logo.png`, `404.html`, etc.

---

### Step 2: InfinityFree File Manager Ya FTP Kholein

**Option A (Sabse Aasan - Online File Manager):**
1. [InfinityFree Client Area](https://dash.infinityfree.com/) me login karein.
2. Apne active account par click karein aur **"File Manager"** (Monsta File Manager) kholein.
3. **`htdocs`** folder ke andar jayein.
4. Agar `htdocs` ke andar pehle se koi default file hai (jaise `default2.html` ya `index2.html`), to use delete kar dein.
5. Apne computer ke **`dist` folder ke andar ki sabhi files aur folders** ko select karke `htdocs` ke andar **Upload** kar dein.
   *(Dhyan dein: `dist` folder upload nahi karna hai, balki `dist` ke ANDAR ki files ko `htdocs` me daalna hai).*
6. Make sure karein ki **`.htaccess`** file bhi `htdocs` me upload ho chuki ho.

**Option B (FileZilla FTP Ke Zariye):**
1. InfinityFree Account se FTP Details lein:
   - **FTP Host**: `ftpupload.net`
   - **FTP Username**: `if0_xxxxxxxx`
   - **FTP Password**: (Aapka InfinityFree vPanel password)
   - **Port**: `21`
2. FileZilla me connect karein aur remote side par `/htdocs` folder me jayein.
3. Left side par apne computer ka `dist/` folder kholein aur sabhi files ko `htdocs` me drag-and-drop kar dein.
4. Agar `.htaccess` nahi dikh rahi ho, to FileZilla me menu par **Server -> Force showing hidden files** tick karein.

---

### Step 3: Site Test Karein

Aapka free domain (e.g. `https://yourname.infinityfreeapp.com` ya custom domain) browser me open karein:
- **Customer Store**: `https://yourdomain/`
- **Super Admin Login**: `https://yourdomain/login`
- **Super Admin Dashboard**: `https://yourdomain/admin/dashboard`
- **Merchant Partner Portal**: `https://yourdomain/market`
- **Rider Fleet Portal**: `https://yourdomain/delivery`

Koi bhi page refresh karne par `.htaccess` ki wajah se 404 error nahi aayega!

---

## Checklist:
- [x] `.htaccess` ready for Apache mod_rewrite
- [x] `vite.config.ts` configured with `base: '/'`
- [x] Tested `npm run build` (Build succeeded with 0 errors)
- [x] TypeScript & Lint passed (0 errors)
