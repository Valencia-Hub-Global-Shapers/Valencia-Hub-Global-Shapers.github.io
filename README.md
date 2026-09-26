# Global Shapers Valencia Hub — website

A static, framework-free site (HTML/CSS/vanilla JS) for the Global Shapers
Valencia Hub: what it is, its official link to the World Economic Forum,
the team, and the projects it has driven. Content is fully data-driven and
available in Spanish, English, and Valencian.

## Run it locally

Because the page loads `data/*.json` and `i18n/*.json` with `fetch()`,
opening `index.html` directly from disk (`file://`) will fail in most
browsers due to CORS. Serve the folder instead:

```bash
# any of these work
npx serve .
python3 -m http.server 8080
```

Then visit `http://localhost:8080` (or whatever port your tool prints).

## Deploying

Plain static site, no build step. Any static host works (drag the folder
onto Netlify or Vercel), but this repo is set up for **GitHub Pages** at
the Valencia Hub org.

### GitHub Pages (current setup)

The site is served as the organization site, so the repo **must be named
exactly** `Valencia-Hub-Global-Shapers.github.io`. Once it is:

1. Repo → **Settings** → **Pages** → *Build and deployment* →
   Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)**.
2. Push to `main`. Pages redeploys automatically within a minute or two.
3. Live at <https://valencia-hub-global-shapers.github.io/>.

All asset paths in the HTML are relative, so the site also works
unchanged as a project site (`…github.io/<repo>/`) if the repo is ever
renamed. No `.nojekyll` is needed — no folders start with an underscore.

## Structure

```
index.html               Hero, ticker, stats, about, WEF, social, teasers, CTA
team.html                 Full team grid + bio modal
projects.html             Full filterable projects grid
assets/css/style.css     Design tokens + layout + animation
assets/js/i18n.js         Loads i18n/*.json, applies data-i18n text
assets/js/main.js         Renders team/projects, modal, filter, ticker, nav
assets/img/favicon.svg
data/team.json           Team roster (edit this to add/remove people)
data/projects.json       Projects (edit this to add/remove projects)
i18n/es.json              Spanish interface strings
i18n/en.json              English interface strings
i18n/val.json              Valencian interface strings
public/team/              Real team photos go here (see its README.md)
```

The homepage no longer renders the full team/project grids. It shows a
short teaser for each (copy + a CTA button) and links out to `team.html`
and `projects.html`, which own the full grid, the bio modal, and the
status filter respectively. `assets/js/main.js` is shared across all
three pages: it only fetches `team.json` / `projects.json` and wires up
the modal / filter on the page that actually has those elements, so
nothing extra loads on the homepage.

Nav and footer markup is duplicated across the three HTML files (no
build step, no templating) — if you add or rename a nav link, update it
in all three.

## Brand colors

Official Global Shapers blues, plus one Valencia orange for local
warmth. Defined as CSS variables at the top of `assets/css/style.css`:

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#232222` | Charcoal — dark sections, body text |
| `--blue-deep` | `#1c30a5` | Primary brand blue — buttons, links, stat numbers |
| `--blue-mid` | `#054b96` | Secondary blue — gradients, accents |
| `--blue-bright` | `#2c41e1` | Vivid blue — hover states, "ongoing" badge |
| `--orange` | `#f0632a` | Valencia accent — primary CTA, "you are here" |
| `--gold` | `#f8e074` | Brand yellow — small highlights, "upcoming" badge |

## Editing content

- **Team**: edit `data/team.json`. `role` and `bio` are per-language
  objects (`es` / `en` / `val`); `name` and `photo` are shared across
  languages. Add a photo at the referenced path in `public/team/`, or
  leave it — the card falls back to an initials avatar automatically.
- **Projects**: edit `data/projects.json`. `name` and `description` are
  per-language; `status` must be `"completed"`, `"ongoing"`, or
  `"upcoming"` to match the filter and badge colour. `peopleImpacted` is
  a plain number.
- **Interface copy** (nav, hero, stats labels, section titles, footer,
  etc.): edit the matching key in `i18n/es.json`, `i18n/en.json`, and
  `i18n/val.json`. Keep the same key structure across all three files.
- **Stats band numbers**: the four counters live in `index.html` as
  `data-count="42"` attributes on `.stat-number` elements — update those
  directly (the founding year is marked `data-no-anim` so it doesn't
  count up).

## A note on the Valencian copy

The `val.json` strings and the `val` fields in the data files were
machine-drafted to be clear and grammatically reasonable Valencian, but
they haven't been reviewed by a native speaker. Worth a quick pass from
someone on the team before this goes live, especially for the more
idiomatic lines (hero headline, CTA band).

## On the "taste-skill" repo

I looked at `github.com/Leonxlnx/taste-skill` before building this. I
can't actually install it — it ships as a `npx skills add` package, and
this environment has no outbound network access for `npm`/`git`, nor
write access to add new permanent skills. What I did instead was read
what its default skill optimises for (deliberate layout asymmetry, a
real typographic system, motion used sparingly and on purpose, no
filler "01 / 02 / 03" labels unless order is meaningful, no generic
cream-background-plus-serif template) and applied that thinking directly
to this build: the ink/teal/ember palette, the recurring arc motif drawn
from the Ciutat de les Arts i les Ciències, the asymmetric hero, and the
chain diagram are all choices made for this brief rather than a stock
template.
