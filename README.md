# Zavmo demos & walkthroughs

Buyer-facing product demos and walkthroughs, hosted via GitHub Pages.
Each one is a self-contained folder served at
`https://iridescent-technologies.github.io/proposals/<folder>/`.

> **This repo is PUBLIC and every page is readable by anyone with the link.**
> Client-specific proposals must NOT live here. a buyer sent to one walkthrough
> can navigate to the root and read everything else. Client work belongs in a
> private repo or behind an access-gated host.

## Index

| Page | What it is | Live link |
|----------|------------|-----------|
| **Little Zav. Proactive Chatbot** | Interactive deck: a playable Little Zav widget, the admin panel, and white-label deployment for Growth Engineering LMS clients | [Open](https://iridescent-technologies.github.io/proposals/little-zav/) |
| **Little Zav. try it yourself** | Play the real learner widget, then run the admin console. both live, both on sample data | [Open](https://iridescent-technologies.github.io/proposals/little-zav-demo/) |
| **The Learner Journey** | Click-through walkthrough of the live learner experience | [Open](https://iridescent-technologies.github.io/proposals/learner-journey/) |
| **The Admin Console** | Click-through walkthrough of the live admin console and its reporting | [Open](https://iridescent-technologies.github.io/proposals/admin-journey/) |
| **Making learning as unique as you are** | The personalisation story. 2 Sigma, xAPI, and three-persona adaptation | [Open](https://iridescent-technologies.github.io/proposals/making-learning-unique/) |
| **A class of one** | Eleven ways a lesson adapts to the learner, shown on the live product, with expert tester feedback | [Open](https://iridescent-technologies.github.io/proposals/a-class-of-one/) |
| **Why Zavmo** | The learning efficiency flywheel. the business case | [Open](https://iridescent-technologies.github.io/proposals/why-zavmo/) |
| **Zavmo. Where Neuroscience Meets Learning** | Overview of the Zavmo platform and its approach | [Open](https://iridescent-technologies.github.io/proposals/zavmo-overview/) |
| **How Zavmo Is Built** | Architecture, model and trust story. for technical, security and L&D buyers | [Open](https://iridescent-technologies.github.io/proposals/how-zavmo-is-built/) |
| **Grounded, Not Guessing** | How OFQUAL, NOS and job descriptions keep the AI teaching to the standard | [Open](https://iridescent-technologies.github.io/proposals/grounded-not-guessing/) |

## Adding a page

1. Check it is **buyer-facing and non-confidential**. If it names a client, it does not go here.
2. Create a top-level folder with an `index.html` (self-contained. inline CSS/JS,
   embed assets as data URIs).
3. Commit and push to `main`; GitHub Pages deploys automatically (~1-2 min).
4. Add a row to the index above and a card to `index.html`.

> A `.nojekyll` file at the repo root disables Jekyll so pages are served as
> static files unchanged. needed because some decks contain `{% %}` / `{{ }}`
> sequences in their inline CSS/JS that Jekyll would otherwise try to parse.
