# Zavmo proposals

Client-facing proposals and product walkthroughs, hosted via GitHub Pages.
Each proposal is a self-contained folder served at
`https://iridescent-technologies.github.io/proposals/<folder>/`.

## Index

| Proposal | What it is | Live link |
|----------|------------|-----------|
| **Little Zav — Proactive Chatbot** | Interactive deck: a playable Little Zav widget, the admin panel, and white-label deployment for Growth Engineering LMS clients | [Open](https://iridescent-technologies.github.io/proposals/little-zav/) |
| **The Learner Journey** | Click-through walkthrough of the live learner experience | [Open](https://iridescent-technologies.github.io/proposals/learner-journey/) |
| **The Admin Console** | Click-through walkthrough of the live admin console | [Open](https://iridescent-technologies.github.io/proposals/admin-journey/) |
| **Making learning as unique as you are** | The personalisation story — 2 Sigma, xAPI, and three-persona adaptation | [Open](https://iridescent-technologies.github.io/proposals/making-learning-unique/) |
| **Zavmo — Where Neuroscience Meets Learning** | Overview of the Zavmo platform and its approach | [Open](https://iridescent-technologies.github.io/proposals/zavmo-overview/) |
| **L'Oréal Travel Retail Asia Pacific** | Zavmo Knowledge Companion proposal for L'Oréal | [Open](https://iridescent-technologies.github.io/proposals/loreal-travel-retail/) |
| **Global Hubs US × Zavmo** | Three-stream pilot proposal (UM6P) | [Open](https://iridescent-technologies.github.io/proposals/UM6P/) |
| **UM6P — New Learner Welcome** | Learner onboarding click-through: how Zavmo works, the 4D journey, and how xAPI captures active learning against learning outcomes & assessment criteria (styled in the live UM6P app theme) | [Open](https://iridescent-technologies.github.io/proposals/um6p-learner-welcome/) |
| **Zavmo for Armenia** | A briefing for Artashes Khurshudyan | [Open](https://iridescent-technologies.github.io/proposals/armenia/) |

## Adding a proposal

1. Create a top-level folder with an `index.html` (self-contained — inline CSS/JS,
   embed assets as data URIs).
2. Commit and push to `main`; GitHub Pages deploys automatically (~1–2 min).
3. Add a row to the index above.

> A `.nojekyll` file at the repo root disables Jekyll so pages are served as
> static files unchanged — needed because some decks contain `{% %}` / `{{ }}`
> sequences in their inline CSS/JS that Jekyll would otherwise try to parse.
