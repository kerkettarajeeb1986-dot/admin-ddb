# Dooars Daily Basket - GitHub Deployment Guide

Is project ko **GitHub** par push aur live deploy karne ke liye sabhi jaruri configurations kar di gayi hain:
1. `.gitignore` set kar diya gaya hai (taaki `node_modules`, `dist`, local files ignore ho sakein).
2. GitHub Pages automated workflow (`.github/workflows/deploy.yml`) create kar diya gaya hai.
3. Firebase Hosting automated workflow (`.github/workflows/firebase-hosting.yml`) create kar diya gaya hai.
4. Single Page Routing (SPA) fix: `dist/404.html` automatically build me generate hota hai taaki `/admin`, `/market`, `/delivery` paths par 404 error na aaye.

---

## Step 1: Code Ko GitHub Par Push Karna

Apne computer (VS Code / Terminal) me project folder ke andar ye commands chalayein:

```bash
# 1. Git repository initialize karein (agar pehle se nahi hai)
git init

# 2. Sabhi files ko stage karein
git add .

# 3. Commit karein
git commit -m "Dooars Daily Basket - Full Production App"

# 4. Branch ka naam 'main' karein
git branch -M main

# 5. Apna GitHub repository URL link karein (Apna username aur repo name dalein)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. GitHub par push karein
git push -u origin main
```

---

## Step 2: GitHub Pages Par Free Hosting Enable Karna

Jab aap code push kar denge:
1. Apne GitHub repository me jayein: `https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>`
2. Upar **Settings** tab par click karein.
3. Left sidebar me **Pages** par click karein.
4. **Build and deployment** section me:
   - **Source**: Dropdown me **"GitHub Actions"** select karein.
5. Bas! Ab har baar jab aap `git push` karenge, GitHub automatically webapp build karke live host kar dega.
6. 1-2 minute me aapko aapka live link mil jayega:
   `https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/`

---

## Step 3: GitHub Se Firebase Hosting Par Auto-Deploy Karna (Optional)

Agar aap chahte hain ki GitHub par code push hote hi automatically **Firebase Hosting** par bhi deploy ho jaye:
1. Terminal me run karein:
   ```bash
   firebase init hosting:github
   ```
2. Ye aapke GitHub repository ko authorize karke ek secret token add kar dega.
3. `.github/workflows/firebase-hosting.yml` file pehle se ready hai, har push par automatically Firebase par live deploy ho jayega.

---

## Step 4: Vercel / Netlify Par GitHub Se 1-Click Deploy (Alternative)

Agar aap Vercel ya Netlify use karna chahte hain:
1. [Vercel.com](https://vercel.com) ya [Netlify.com](https://netlify.com) par jayein.
2. **"Add New Project"** > **"Import from GitHub"** karein.
3. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Deploy** dabayein! 1 minute me website live ho jayegi.

---

## Project Status:
- **Build**: `npm run build` -> Passed (Clean `dist/` bundle with `index.html` & `404.html`).
- **TypeScript & Lint**: `tsc --noEmit` -> Passed (0 errors).
- **SPA Routing**: Configured for GitHub Pages, Firebase Hosting, and Vercel.
