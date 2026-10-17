# kashanamjad.com — how to update your site

All the words, links, covers and videos live in two files:

- `content/projects.json`: every project
- `content/profile.json`: your intro, About page, experience and contact details

You never need to touch the code. Use the **admin panel** (Pages CMS). Every change you save goes live on kashanamjad.com in about a minute.

---

## 1. Open the admin panel

1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. The first time only: approve the Pages CMS app and give it access to **just this repository** (`kashanamjad.github.io`).
3. Open the repository and pick the **main** branch.
4. You'll see two sections in the sidebar: **Projects** and **About me & contact**.

## 2. Common tasks

| I want to… | Do this |
|---|---|
| **Change a cover** | Projects → open the project → *Cover image* → upload your new 1920×1080 JPG → Save |
| **Add a film** | Export an MP4 (H.264, 1080p, under ~50 MB) → Projects → project → *Films* → *Add* → upload it as *Video file*, add a *Poster* still → Save. It plays in the carousel with sound and fullscreen, and its exact shape is detected automatically |
| **Add a new project** | Projects → *Add* at the bottom of the list → fill in Title, Page address (e.g. `dsme-brand-film`), Role, Agency, Cover, Films → Save |
| **Put a project in the home carousel** | Tick *Featured in home carousel* and set *Order* (1 = first) |
| **Show several films for one project** | Add them all under *Films*. The first plays in the carousel, and small windows under the card let visitors switch |
| **Show photos in the carousel** | Tick *Show stills on Photography page*. The project then gets a **Films / Photos** switch under its carousel card. Thumbnails are made automatically by Claude; new uploads still work without one, they just load the full image |
| **Show a project's photos on the Photography page** | Tick *Show stills on Photography page* |
| **Add photos to a project** | *Stills / photos* → add images (export around 1600 px wide, JPG ~80%) |
| **Edit your intro, title or contact details** | About me & contact → edit → Save |
| **Add a new job** | About me & contact → *Experience* → *Add* → drag it to the top |

### Cover rules
- **Horizontal projects:** 1920×1080 JPG. **Vertical projects:** 1080×1920 JPG.
- Keep faces, product and any title inside the **centre safe zone** (template: `cover-template-1920x1080.svg`). The site crops covers for phones and grid windows automatically.
- If a crop still looks wrong, set *Cover focus point* (e.g. `left`, `top`, or `30% 40%`).

### Updating the CV PDF
The CV page (**kashanamjad.com/cv/**) always shows your latest details automatically. The downloadable PDF is a saved copy, so after changing your experience:
1. Open **kashanamjad.com/cv/** in Chrome → **Print** → *Save as PDF* (Margins: None, untick Headers and footers).
2. Admin panel → About me & contact → *CV PDF* → upload it → Save.

Or ask Claude to "regenerate my CV PDF".

## 3. Bigger changes
For new sections, layout or design changes, open a Claude session and describe what you want. The site is plain HTML, CSS and JavaScript (`index.html`, `work/`, `about/`, `photography/`, `cv/`, `assets/`), with no build step.

---

## Films on the site
All your films are already on the site as web-sized MP4s in `assets/media/films/` (1080p, 3–19 MB each; the LG documentary is 60 MB). Nothing needs uploading to YouTube. Use the *YouTube link* field only if you ever add a very long film (over ~100 MB).

## Covers still to design
DI National Day, DI 30 years, LG Shaker, Capital.com (The Uncle), Cars Now, Coursinity and The Fitout currently use frames cropped by Claude to hide burned-in logos and subtitles. Replace them with your own covers whenever they're ready.
