# Working in iridescent-proposals

## Future Fluency is a real qualification, and these are its units

Two specifications, written in full, unit by unit, with every learning outcome and
assessment criterion. Both are **draft for review** and neither is submitted.
Never describe either as approved or accredited.

- **Level 3** — an Award of two units and a Diploma of six. 390 hours, 39 credits,
  145 assessment criteria.
  <https://iridescent-technologies.github.io/proposals/qualifications-level-3/>
  Units: ZFF-AI-03, ZFF-GM-03, ZFF-DA-03, ZFF-GV-03, ZFF-AU-03, ZFF-PJ-03
- **Level 5 Diploma** — five mandatory units. 410 hours, 41 credits, 136
  assessment criteria.
  <https://iridescent-technologies.github.io/proposals/qualifications-level-5/>
  Units: ZFF-GM-05, ZFF-EI-05, ZFF-AU-05, ZFF-DA-05, ZFF-PJ-05

**It is applied to the learner's own role, and that is the whole point.** At
Level 3 the learner changes their own daily work: uses AI tools on real tasks,
checks what comes back, automates something they repeat, reviews what changed. At
Level 5 they lead a department through the same shift. Their own job is the
evidence, not a case study about somebody else's. The level rises through the
complexity of the problem, not the difficulty of the tool.

### The graph does not use these codes

Neo4j `FutureFluencyUnit` nodes carry an older, parallel set. Measured
3 September 2026:

- `ZFF-DF-05` "Data Fluency" is the specification's **`ZFF-DA-05`** "Using Data to
  Direct a Department's Priorities" (6 credits in the graph, 7 in the spec).
- `ZFF-AU-06` "Automation Fluency" is the specification's **`ZFF-AU-05`**
  "Planning Automation Across a Department".
- Only `ZFF-GM-05` and `ZFF-EI-05` match by reference.
- `ZFF-PJ-05`, the applied project and the largest unit at 14 credits, is **not in
  the graph at all**, and neither is anything at Level 3.
- Nine graph units are in no qualification: AI, Sustainability, Systems, Frontier,
  Change, AI Governance and others.

So a `BUILDS_FLUENCY` edge is a **demand signal**, telling you which fluency a role
needs. It is not a thing anybody can buy. Never quote a graph unit as a
purchasable unit, and never quote a credit value off one.

**If the graph and the specification disagree, the specification pages win.**
