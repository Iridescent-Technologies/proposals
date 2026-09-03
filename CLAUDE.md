# Working in iridescent-proposals

## Future Fluency is a real qualification, and these are its units

Two specifications, written in full, unit by unit, with every learning outcome and
assessment criterion. Both are **draft for review** and neither is submitted.
Never describe either as approved or accredited.

- **Level 3** — an Award of two units and a Diploma of six. 390 hours, 39 credits.
  <https://iridescent-technologies.github.io/proposals/qualifications-level-3/>
  Units: ZFF-AI-03, ZFF-GM-03, ZFF-DA-03, ZFF-GV-03, ZFF-AU-03, ZFF-PJ-03
- **Level 5 Diploma** — five mandatory units. 410 hours, 41 credits.
  <https://iridescent-technologies.github.io/proposals/qualifications-level-5/>
  Units: ZFF-GM-05, ZFF-EI-05, ZFF-AU-05, ZFF-DA-05, ZFF-PJ-05

**It is applied to the learner's own role, and that is the whole point.** At
Level 3 the learner changes their own daily work: uses AI tools on real tasks,
checks what comes back, automates something they repeat, reviews what changed. At
Level 5 they lead a department through the same shift. Their own job is the
evidence, not a case study about somebody else's. The level rises through the
complexity of the problem, not the difficulty of the tool.

### The graph holds TWO parallel sets, and only one of them is connected

Probed whole-graph on 3 September 2026. 40 `FutureFluencyUnit` nodes, in two
families, and the difference decides what you may claim.

**The curriculum.** The 11 units above, `qualification` = "Zavmo Future Fluency,
Level 3" or "... Level 5". **Nine of the eleven have ZERO `BUILDS_FLUENCY` edges.**
Only `ZFF-GM-05` (697 edges) and `ZFF-EI-05` (1,023) reach any role at all.
`ZFF-PJ-05`, the largest unit at 14 credits, has none. No Level 3 unit has any.

**The taxonomy.** `qualification` = "Zavmo Future Fluency", families like Data
Fluency, AI Fluency, AI Governance Fluency, at levels 2 to 7. These carry **all
93,798 edges** and reach 56,800 of 59,277 roles.

So there are two very different coverage numbers, and they must never be swapped:

| | Roles covered |
|---|---|
| Any unit in the taxonomy | 82% to 99% by sector |
| A unit that is IN one of the two qualifications | **1% to 8% by sector** |

**They are not the same units under drifted codes.** `ZFF-DF-05` and `ZFF-DA-05`
are two nodes with different aims: DF-05 is "interrogate data and judge its
quality", DA-05 is "use the data their department already produces to decide where
its effort should go". Same domain, different scope. Same for `ZFF-AU-06` against
`ZFF-AU-05`.

**How to apply.** A `BUILDS_FLUENCY` edge is a demand signal. Before calling it a
unit somebody can enrol on, check the `unit_uid` is one of the eleven above. Never
quote the taxonomy coverage figure as coverage of the qualification. If the graph
and the specification disagree, the specification wins.
