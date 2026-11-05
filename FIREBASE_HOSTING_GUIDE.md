# Dooars Daily Basket - Firebase Hosting Guide

Is project ko **Firebase Hosting** par live host karne ke liye sabhi jaruri configuration files (`firebase.json`, `.firebaserc`, build scripts) set up kar di gayi hain.

---

## 1. Project Details
- **Firebase Project ID**: `dooars-daily-basket-53d8a`
- **Default Live URL**: `https://dooars-daily-basket-53d8a.web.app`
- **Alternative URL**: `https://dooars-daily-basket-53d8a.firebaseapp.com`
- **Output Directory**: `dist` (Vite production build)

---

## 2. Configuration Files Jo Add Kiye Gaye Hain
1. **`firebase.json`**:
   - `public`: `"dist"`
   - `rewrites`: Sabhi URL paths (`/admin`, `/market`, `/delivery`, `/login`) ko `/index.html` par point karta hai taaki single-page app (SPA) me kabhi 404 error na aaye.
   - `headers`: Static assets ke liye fast caching aur `index.html` ke liye fresh updates ensure karta hai.
   - `firestore.rules`: Security rules ko bhi sync karta hai.

2. **`.firebaserc`**:
   - Default Firebase project target `dooars-daily-basket-53d8a` bind karta hai.

3. **`package.json`**:
   - Deployment scripts add kar diye gaye hain:
     - `npm run deploy` -> Pehle build karega fir sirf Hosting deploy karega.
     - `npm run deploy:all` -> Hosting aur Firestore rules dono ek sath deploy karega.
     - `npm run deploy:rules` -> Sirf Firestore rules deploy karega.

---

## 3. Host / Deploy Karne Ka Tarika (Step-by-Step)

### Option A: Terminal / Command Line Se Direct Deploy
Agar aap apne computer (VS Code / Terminal) se deploy kar rahe hain:

```bash
# 1. Firebase CLI install karein (agar pehle se nahi hai)
npm install -g firebase-tools

# 2. Firebase me login karein (Apna Google account rajeebkerketta1986@gmail.com use karein)
firebase login

# 3. Webapp ko build aur host karein (Single Command)
npm run deploy
```

Deploy complete hone par terminal me live URL show hoga:
`✔  Deploy complete! Hosting URL: https://dooars-daily-basket-53d8a.web.app`

---

### Option B: Custom Domain Connect Karna (e.g., www.dooarsdailybasket.com)
1. **Firebase Console** me jayein: [https://console.firebase.google.com/project/dooars-daily-basket-53d8a/hosting/sites](https://console.firebase.google.com/project/dooars-daily-basket-53d8a/hosting/sites)
2. **Hosting** section me **"Add custom domain"** button par click karein.
3. Apna domain dalein (e.g. `dooarsdailybasket.com` ya `www.dooarsdailybasket.com`).
4. Firebase aapko 2 **A Records** ya **TXT Records** dega.
5. Apne domain provider (GoDaddy, Hostinger, Namecheap) ke DNS management me wo records add karein.
6. 15-30 minute me free SSL (HTTPS) automatically activate ho jayega.

---

## 4. Key Features Included in This Build
- **Customer Storefront (`/`)**: Real-time grocery browsing, category filters, PIN code serviceability check, cart management.
- **Super Admin Dashboard (`/admin/dashboard`)**: Full business settings, UPI QR management, 14 product categories, market partner approvals/deletions, delivery fleet management, dispute resolution.
- **Market Partner Portal (`/market`)**: Shop registration, inventory control, product additions with HD images.
- **Delivery Fleet Portal (`/delivery`)**: Order dispatch, delivery tracking, wallet settlements.
- **Instant Firestore Sync**: Zero mock/demo items; live cloud database integration.
