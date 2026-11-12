# مطعم جدو عز – GEDO EZZ (landing page)

A static, mobile-first Arabic (RTL) landing page for the restaurant. Customers scan one QR code and land on this page: logo, link cards (Facebook, Instagram, TikTok, Google Maps), and the full menu with a zoomable viewer.

No backend, no database, no build step, no paid services. Plain HTML + CSS + JavaScript.

## Project structure

```
gedo-ezz/
├── index.html              ← the page
├── css/style.css           ← all styling
├── js/main.js              ← menu lightbox (zoom / pan / pinch)
├── assets/
│   ├── logo.jpg            ← original logo (unmodified)
│   ├── menu-1.jpg          ← original menu image 1 (unmodified)
│   ├── menu-2.jpg          ← original menu image 2 (unmodified)
│   ├── favicon.ico, favicon-32.png, apple-touch-icon.png   ← resized from the logo
├── .nojekyll               ← tells GitHub Pages to serve the files as they are
└── README.md
```

All paths are **relative** (`assets/...`, `css/...`, `js/...`), so the site works at the root of a domain and inside a repository subfolder such as `https://USERNAME.github.io/REPO/`.

## Run it locally

Just double-click `index.html`, or for a more realistic test:

```bash
cd gedo-ezz
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages (step by step)

1. **Create a GitHub account** (free) at https://github.com if you don't have one.
2. Click **+ → New repository**.
   - Name: for example `gedo-ezz` (use simple lowercase letters, no spaces).
   - Visibility: **Public** (GitHub Pages is free for public repositories).
   - Do not tick "Add a README" (the project already has one).
   - Click **Create repository**.
3. On the empty repository page click **uploading an existing file**.
4. **Unzip** the project on your computer, open the `gedo-ezz` folder, select **everything inside it** (`index.html`, `css`, `js`, `assets`, `.nojekyll`, `README.md`) and drag it into the GitHub upload area.
   - `index.html` must end up at the **top level** of the repository, not inside an extra folder.
   - If your computer hides files starting with a dot, `.nojekyll` can be left out; the site still works.
5. Scroll down and click **Commit changes**.
6. Go to the repository **Settings → Pages**.
   - Source: **Deploy from a branch**.
   - Branch: **main**, folder: **/ (root)** → **Save**.
7. Wait 1–3 minutes and refresh the Pages settings. GitHub shows: *"Your site is live at https://USERNAME.github.io/gedo-ezz/"*.
8. Open that address on your phone and check: logo, the four cards, both menu images, tap-to-zoom.

## Make the QR code (after step 8)

The QR code must contain **only** your final site address, for example `https://USERNAME.github.io/gedo-ezz/`, and nothing else. Do not make it from a Facebook/Instagram/TikTok/Maps link. Generate it only after the site is live, then scan it with a phone to confirm it opens the page. Print it black on white with a clear white margin around it.

**Important:** the address contains your GitHub username and repository name. If you rename either one, the old address stops working and the printed QR code breaks. Choose the names once and keep them.

## Update the site later without changing the QR code

The QR code points to the site address, not to the files, so you can change anything inside the repository and the address stays the same.

**Replace a menu image**
1. Prepare the new image and name it exactly `menu-1.jpg` or `menu-2.jpg` (JPG recommended; keep the same proportions to avoid layout changes).
2. In the repository open `assets/`, click the old file, then **… → Delete**, or simply use **Add file → Upload files** inside `assets/` and upload the new file with the same name (it replaces the old one).
3. Because phones remember images, open `index.html` in the repository, click the pencil icon and change the version number in the two image lines, for example `assets/menu-1.jpg?v=1` → `assets/menu-1.jpg?v=2` (same for `menu-2.jpg`). Commit. This forces every phone to fetch the new image.
4. Wait 1–3 minutes and reload the live page.

**Use a different file type or name** (for example PNG): upload the file to `assets/` and edit the `src="assets/menu-1.jpg?v=1"` line in `index.html` to the new name. Also update `width` and `height` on that `<img>` to the new image's pixel size.

**Add a third menu image**: copy one `<figure class="menu__item"> … </figure>` block in `index.html`, change `data-index="1"` to `data-index="2"`, the image name and the alt text. The viewer picks it up automatically.

**Change a link** (Facebook, Instagram, TikTok, Maps): edit `index.html`; each link appears twice, once in a card and once in the footer. Search for the old address and replace both.

## Fonts

The page uses the free **Cairo** font from Google Fonts. If it can't load (offline or blocked), the page falls back to the phone's own Arabic font and stays fully usable. To avoid any external request, download Cairo, put the `.woff2` files in `assets/fonts/`, add `@font-face` rules to `css/style.css`, and delete the three Google Fonts `<link>` lines in `index.html`.

## Notes

- The two menu images are used exactly as supplied. The page never re-encodes, crops or resizes the files; it only scales them for display. Any text on them (including the phone numbers and the address printed at the bottom of the first menu) comes from the images themselves, not from the page.
- The favicon and home-screen icon are resized copies of the logo; the logo itself is untouched.
- Social-media link previews (WhatsApp/Facebook) show the title and description only; a preview image requires a full absolute URL, which is only known after deployment.
