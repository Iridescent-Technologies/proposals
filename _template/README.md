# Shared deck template

The canonical starting point for every new Zavmo proposal or walkthrough. Copy it, fill it in, link it. This is the **single source of truth for look & feel**. It reconciles the hub and the older decks onto one design system, so the whole suite reads as one thing.

## Design system (do not deviate)

The look is the one zavmo.ai and learn.zavmo.ai share. It lives in one file,
`_brand/zavmo.css`, which every page links **after** its own `<style>`. Change
the brand there and every page follows.

| Token | Value | Use |
|---|---|---|
| `--z-bg` / `--z-bg-2` | `#ffffff` / `#f5f7fa` | Page and quiet panels. White, always |
| `--z-navy` | `#0a1628` | Text, the primary button, the footer band |
| `--z-teal` | `#00d9c0` | Fills, rules and icons. **Never text** |
| `--z-teal-ink` | `#0e7b62` | Teal you can read: links, eyebrows, highlighted words |
| `--z-text-2` / `--z-text-3` | `#4b5563` / `#5d6875` | Body and muted text |
| `--z-border` | `#e5e7eb` | Card and divider hairlines |
| Headings | **Figtree** 600 | h1 to h4, stat numbers |
| Body | **DM Sans** 400 | Everything else |

Both fonts are self-hosted in `_brand/fonts/`, the same files zavmo.ai serves.
The logo is `_brand/zavmo-logo-mono-navy.svg` (white version for the navy
footer).

**Rules:** white page, navy text, navy primary button with a 10px radius,
teal ink for anything teal you read. No dark backgrounds except the navy footer
band. No other colours or fonts. The older names in each page's `:root`
(`--navy-0`, `--ink`, `--surface` and the rest) are kept and given light
values by `_brand/zavmo.css`, so pages built on them still work.

The source of truth is zavmo-web `src/styles/global.css` on `main`. The print
collateral (`zavmo-branded-collateral/_source/brand.css`) agrees on every
colour but names Inter and Space Grotesk; the live sites use DM Sans and
Figtree, and the live sites win.

Every page carries "© 2026 Zavmo.ai. All rights reserved." in its footer.

## How the copy should read

Plain, point first, honest, unshowy. No em dashes: if a line leans on one, it is
two sentences trying to be one. Sentence case headings, British spelling, no
puffery, no unsourced numbers. Most sentences under fifteen words, but do not
make it staccato. The placeholders in `index.html` are written to that standard,
so use them as the pattern rather than writing over it. Full guide:
`JULIETTE-VOICE.md` in the juliettedenny-site repo.

## Components included

Nav (Zavmo logo + back-to-hub + CTA) · hero (eyebrow / h1 / lede / CTAs) · stat bar · text + pull-quote · numbered feature rows · glass card grid · callout · footer · scroll-reveal. All keyboard-accessible and reduced-motion aware.

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

Each deck stays a folder of its own, with its layout in its own `<style>`. The one shared file is `_brand/zavmo.css`, which holds the brand, so a brand change is made once rather than in every deck.
