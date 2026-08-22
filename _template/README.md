# Shared deck template

The canonical starting point for every new Zavmo proposal or walkthrough. Copy it, fill it in, link it. This is the **single source of truth for look & feel**. It reconciles the hub and the older decks onto one design system, so the whole suite reads as one thing.

## Design system (do not deviate)

| Token | Value | Use |
|---|---|---|
| `--navy-0` / `--navy-1` | `#060e17` / `#0b1a2a` | Page background (deep → base) |
| `--teal` | `#2FCFA8` | Primary accent, links, CTAs |
| `--teal-glow` | `#3FE4BC` | Hover/emphasis |
| `--ink` / `--ink-2` / `--ink-3` | white → 72% → 50% | Text: primary / body / muted |
| `--surface` / `--border` | translucent ink | Cards, dividers |
| `--amber` `#f5b544` / `--blue` `#8fb8ff` | chip accents | Client / concept categories |
| Font | **DM Sans** declared, system-font fallback (not loaded as a webfont, to match the live site) | Everything |

**Rules:** navy background, teal accent, DM Sans only. No new colours, no other fonts, no light backgrounds (the light aesthetic is the *product* brand; the *proposals* suite is navy). Weights lean light. `h1` is 200, `h2` is 300.

> Note: the two teal values in the wild differ. The hub uses `#2FCFA8`. The older `zavmo-overview` deck uses `#00d9c0`. **This template's `#2FCFA8` is canonical.** Older decks can be retrofitted over time.

## How the copy should read

Plain, point first, honest, unshowy. No em dashes: if a line leans on one, it is
two sentences trying to be one. Sentence case headings, British spelling, no
puffery, no unsourced numbers. Most sentences under fifteen words, but do not
make it staccato. The placeholders in `index.html` are written to that standard,
so use them as the pattern rather than writing over it. Full guide:
`JULIETTE-VOICE.md` in the juliettedenny-site repo.

## Components included

Nav (logomark + back-to-hub + CTA) · hero (eyebrow / h1 / lede / CTAs) · stat bar · text + pull-quote · numbered feature rows · glass card grid · callout · footer · scroll-reveal. All keyboard-accessible and reduced-motion aware.

## How to add a new deck

1. `cp -R _template your-deck-name` (kebab-case folder name = the URL).
2. Edit `your-deck-name/index.html`: set `<title>`, the two `og:` tags and `meta description`, then replace the placeholder sections.
3. Delete this `README.md` from the copy. Leaving it does no harm, because nothing links to it.
4. Add a card to the root `index.html` in the right section, matching the existing markup:
   ```html
   <a class="card" href="./your-deck-name/">
     <span class="c-chip walk">Walkthrough</span>
     <h3 class="c-title">Your deck title</h3>
     <p class="c-desc">One-line description.</p>
     <span class="c-foot">Open<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
   </a>
   ```
   Chip class picks the accent: `walk` (teal), `client` (amber), `concept` (blue), or none (grey).
5. Push to `main`. GitHub Pages deploys it automatically.

Each deck stays a **self-contained folder**. No shared stylesheet, per the repo convention. The tradeoff: when the system changes, update this template and let new decks inherit it. Retrofit older decks as needed.
