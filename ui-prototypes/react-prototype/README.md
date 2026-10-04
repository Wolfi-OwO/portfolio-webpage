# UI prototype (React)

The working prototype of the redesign: same pages, same copy and data as the HTML mockup in `../prototype`, now as a small
React app where the flows actually run. Fake data, real behaviour.

```sh
cd ui-prototypes/react-prototype
npm install
npm run dev        # http://localhost:5174
npm run build      # static copy in dist/, opens from disk too (hash routing, relative base)
```

Append `?noboot` to skip the boot screen, `?static` to show everything without scroll animations (used for screenshots).

## What works

| Area | Behaviour |
|---|---|
| Sign in | Lock icon, any username and password. Lands on the home page, the icon becomes logout with a small menu |
| Inline editing | Pencil and trash on every entry, `New entry` in section headings, forms open in place, delete asks first. Edits change the page right away (in memory, a reload resets them) |
| Music | `On repeat` with cover art. Add a track, paste a YouTube Music link: the cover is that video's thumbnail, title and artist fill in when YouTube's oEmbed answers |
| Images | Every picture opens a dialog with the whole image, prev/next, arrow keys, Esc |
| Secret | Type `I L O V E U` at a human pace (250–1000 ms between letters) outside any input: `Another new Secret?!` appears in the header. Uses the app's own `useSecretCombo` hook, copied unchanged |
| Appearance | Floating button above the footer: 31 palettes in dark and light, five contrast steps, fine-tune sliders, copy settings as JSON or CSS |
| Heatmap | All/GitHub/GitLab filter, scrolls back through three years, tooltip with the per-source split |
| Admin | Messages inbox (mark read, delete), monitors, private AI check |
| Tooltips | One shared component (`src/lib/tooltip.js` + `styles/tooltip.css`), driven by `data-tip` attributes |

## Layout

- `src/data/content.js`: all seed content, taken from the repo's seed data and `de.js` copy
- `src/store.jsx`: app state (content, sign-in, editing, appearance, toasts)
- `src/lib/appearance.js`: palettes, contrast steps, fine-tune maths
- `src/components/`: shell (header, footer, drawer, dialog), `blocks.jsx` (icons, inline form), `cards.jsx` (content cards)
- `src/pages/`: one file per group of pages
- `screens/`: a screenshot of every page and state

## Not real yet

Detector scores, contribution counts, uptime figures, messages and track names are sample data.
No backend: nothing is saved across reloads. The next stage is wiring this to the real API.
