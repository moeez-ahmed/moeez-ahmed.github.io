# Moeez Ahmed Shah — Portfolio

A static website: plain HTML, CSS and JavaScript with Three.js bundled locally.
No build step, no npm, nothing to install.

```
index.html
preview.bat         <- double-click to preview on Windows
serve.py            <- local preview server (supports video seeking)
css/style.css
js/data.js          <- ALL your content lives here
js/main.js          <- page logic (no need to edit)
js/three/           <- 3D scenes: hero sand, astrolabe, city
assets/video/       <- films, hero loop, hover previews
assets/img/         <- posters, card images, favicon, share image
assets/cv/          <- your CV PDF
assets/vendor/      <- Three.js (do not edit)
```

---

## 1. Preview on your computer

Double-clicking `index.html` will NOT work (browsers block JavaScript modules from files).
Use one of these instead:

- **Windows, easiest:** double-click `preview.bat`. It starts the preview server and opens
  your browser. (Needs Python: python.org, tick "Add python.exe to PATH" when installing.)
- **Any system with Python:** run `python serve.py` (or `py serve.py`) inside this folder,
  then open http://localhost:8000
- **VS Code:** install the "Live Server" extension, right-click `index.html`, Open with Live Server.
- **Node.js:** run `npx serve` inside this folder.

Do not use `python -m http.server`. It can't send part of a file, so videos can't
jump to a timestamp: chapters and the timeline snap back to 0:00. `serve.py`, Live Server,
`npx serve` and GitHub Pages all handle this correctly.

---

## 2. Deploy free on GitHub Pages (no git needed)

1. Create a free account at github.com.
2. Click **New repository**. Name it `yourusername.github.io` (replace with your
   GitHub username) for the cleanest address. Make it **Public**. Create it.
3. Click **uploading an existing file**. Drag in **everything inside this folder**
   (index.html, css, js, assets, README.md) — the contents, not the folder itself.
   Click **Commit changes**.
4. Go to **Settings → Pages**. Under "Build and deployment" choose
   **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
5. Wait 1–2 minutes. Your site is live at `https://yourusername.github.io`.

Every file is already under GitHub's 25 MB browser-upload limit
(the largest film is about 23 MB).

To update later: open the repo, click a file, edit or re-upload it, commit.
The site refreshes within a minute or two.

**Custom domain (optional):** Settings → Pages → Custom domain, then add the DNS
records GitHub shows you at your domain registrar.

**Share preview image:** once you know your final address, open `index.html` and change
`content="assets/img/og.jpg"` to the full URL, for example
`content="https://yourusername.github.io/assets/img/og.jpg"`. Link previews on
LinkedIn and WhatsApp need a full URL.

---

## 3. Add a project

Open `js/data.js`, find `PROJECTS`, copy any block and edit it:

| Field        | What it does |
|--------------|--------------|
| `id`         | Unique short name, no spaces (`"nayzak"`). Used in links: `/#project/nayzak` |
| `featured`   | `true` = big card in Selected work, `false` = row in Earlier work |
| `wide`       | `true` = card spans two columns on big screens |
| `title`, `native` | Name, plus optional Arabic name shown beside it |
| `category`   | Filter chips are built from these automatically |
| `year`, `status`, `engine`, `platform` | Shown in the card and case study; leave `""` to hide |
| `tagline`    | One line on the card |
| `summary`    | Paragraph in the case study |
| `highlights` | List under "What I built" |
| `tech`       | Tags in the case study |
| `card`       | Card image path, e.g. `"assets/img/nayzak-card.jpg"` (16:10 looks best). Leave it out and a patterned cover is drawn for you |
| `preview`    | Short silent clip that plays when someone hovers the card |
| `film`       | id from `FILMS` to add a "Watch the film" button |
| `accent`     | Colour of the generated cover when there is no image |
| `links`      | Buttons, e.g. `[{ label: "Steam page", url: "https://..." }]` |

Save, upload `data.js` (and any new images) to GitHub, done.

## 4. Add a film

Copy a block in `FILMS`. `chapters` is a list of `{ t: seconds, title: "..." }`.
Add as many films as you like; a tab appears for each one.

## 5. Other content

- `SITE`: name, tagline, about paragraphs, email, LinkedIn, CV path, hero video.
- `SYSTEMS`: the astrolabe rings (4–7 works best). `proof` links rings to project ids.
- `EXPERIENCE`: the Journey timeline, newest first.

---

## 6. Preparing new videos (free, with ffmpeg)

Full film (keeps quality, stays well under 25 MB for 3–5 minutes):
```
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -c:a aac -b:a 112k -movflags +faststart assets/video/name-film.mp4
```
Silent 6-second hover preview starting at 1:30:
```
ffmpeg -ss 90 -t 6 -i input.mp4 -vf scale=640:-2 -an -c:v libx264 -crf 28 -movflags +faststart assets/video/name-preview.mp4
```
Poster / card image from 1:30:
```
ffmpeg -ss 90 -i input.mp4 -frames:v 1 -q:v 3 assets/img/name-poster.jpg
```
Keep `-movflags +faststart`: it lets films start playing before they finish downloading.

---

Notes
- Accessibility: keyboard navigable, visible focus, "Pause background" control,
  and visitors with "reduce motion" turned on get still 3D scenes and no autoplay.
- If a device has no WebGL, the 3D scenes are replaced by images automatically.
- Three.js is MIT licensed (see assets/vendor/THREE-LICENSE.txt).
