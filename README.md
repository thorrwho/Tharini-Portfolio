# Tharini Naveen Portfolio (combined build)

ChatGPT's V3 site as the base, with Gemini's hero and work grid, rebuilt around the Buttermax-style interactions.

## Run it

Plain HTML, CSS and JavaScript. No build step and no packages.

- **Locally:** from this folder run `python -m http.server 8000`, then open http://localhost:8000.
- **Hosting:** upload the whole folder to Vercel, Netlify or GitHub Pages. Keep the folder structure as it is.

## What's where

| File | What it does |
| --- | --- |
| `index.html` | Page structure and all text content |
| `css/base.css` | ChatGPT's design system and the sections kept unchanged (header, More than code, The things I work with, Let's make it happen, footer) |
| `css/site.css` | Intro, hero, consoles, work grid, pinned sections, liquid cursor layers |
| `js/data.js` | **The 9 projects**: titles, years, colours, descriptions, tech stack, GitHub repo names |
| `js/fluid.js` | Liquid ink cursor (WebGL fluid simulation that swaps cream and plum underneath it) |
| `js/hero.js` | Intro animation, the "Tharini / naveen" title with its liquid smear, the three switchable rigs |
| `js/consoles.js` | Builds the CSS 3D consoles |
| `js/screens.js` | The animated pixel screen for each project |
| `js/main.js` | Theme toggle, smooth scrolling, pinned sections, work grid |
| `js/viewer.js` | Project view: the clicked console flies forward with the glass mosaic, shows the project on its screen, and its A/B buttons open GitHub or close |
| `assets/Tharini_Naveen_Resume.pdf` | Résumé behind the download button |

## Common edits

- **Add or change a project:** edit `js/data.js`. A project with a `sites` list (like Vibe Coded Websites) shows those sites on the console screen, each with LIVE and CODE links. Each project's `id` must match an animation in `js/screens.js` (`ANIM`); copy the closest one for a new project.
- **Hero rigs:** the `RIGS` list in `js/hero.js` decides which projects each of the three consoles cycles through.
- **Colours:** the cream/plum palette lives in `css/base.css` (`:root`). The cursor's colour swap reads the same values from `PAL` in `js/fluid.js`; update both together.
- **Handwriting:** the "naveen" stroke is the `NAVEEN_D` path in `js/hero.js`.

Everything respects `prefers-reduced-motion`: the intro, the cursor and the pinning switch off for people who ask for less motion. The liquid cursor only runs on devices with a mouse or trackpad.
