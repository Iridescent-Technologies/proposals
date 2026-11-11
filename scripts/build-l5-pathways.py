#!/usr/bin/env python3
"""Build the role versions of the Level 5 Diploma in Future Fluency.

    python3 scripts/build-l5-pathways.py           # write every role page
    python3 scripts/build-l5-pathways.py --check   # fail if a page is stale

WHY THIS EXISTS. The Level 5 Diploma is one generic course with a specialised
version for each role (Juliette's decision, 10 Nov 2026). Every version uses
the same five units and the same 136 criteria, word for word. Only the context
differs: the change the role faces, its rules, and worked evidence.

If each role page carried a hand copy of the criteria, the copies would drift
the first time the generic page changed. So the criteria are never typed into
a role page. This script reads them from qualifications-level-5/index.html
every time, and reads the role content from scripts/l5-pathways/<slug>.json.
CI runs --check, so a criterion edited on the generic page and not rebuilt
here fails the PR rather than going live as two different qualifications.

Standard library only, so it runs anywhere Python 3 does.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GENERIC = ROOT / "qualifications-level-5" / "index.html"
DATA = ROOT / "scripts" / "l5-pathways"
OUT = ROOT / "qualifications-level-5"
ORDER = ["hr-and-ld", "finance", "operations-and-service", "sales-and-marketing"]
UNIT_IDS = ["zff-gm-05", "zff-ei-05", "zff-au-05", "zff-da-05", "zff-pj-05"]
DATE = "10 November 2026"
# Sentence case, as every heading in the suite. The JSON "title" is not used for
# display, so a role file cannot reintroduce title case.
HEADING = {"hr-and-ld": "HR and learning and development", "finance": "Finance",
           "operations-and-service": "Operations and service", "sales-and-marketing": "Sales and marketing"}


def esc(s):
    return html.escape(s, quote=False)


def between(s, a, b):
    i = s.index(a) + len(a)
    return s[i:s.index(b, i)]


def read_generic():
    g = GENERIC.read_text(encoding="utf-8")
    styles = re.findall(r"<style>(.*?)</style>", g, re.S)
    script = g[g.rindex("<script>"):g.rindex("</script>") + len("</script>")]
    units = []
    for uid in UNIT_IDS:
        start = g.index(f'<section class="unit" id="{uid}">')
        sec = g[start:g.index("</section>", start)]
        head = between(sec, '<div class="unit-head">', '\n  </div>\n  <div class="unit-body">')
        ref = re.search(r'<div class="unit-ref">(.*?)</div>', head).group(1)
        title = re.search(r'<h2 class="unit-title">(.*?)</h2>', head).group(1)
        meta = re.search(r'<div class="meta">.*?</div>', head, re.S).group(0)
        nums = dict(re.findall(r'<b>(TQT|Credits|GLH)</b>(\d+)', meta))
        los = re.findall(r'    <div class="lo">\n.*?\n    </div>\n(?=    <div class="lo">|    <p class="tally">)', sec, re.S)
        lo_ids = [re.search(r'<span class="lo-badge">(LO\d)</span>', lo).group(1) for lo in los]
        crit = len(re.findall(r'<td class="cref">\d\.\d</td>', sec))
        assert len(los) == 5, (uid, len(los))
        units.append(dict(id=uid, ref=ref, title=title, meta=meta, los=list(zip(lo_ids, los)),
                          crit=crit, tqt=int(nums["TQT"]), cr=int(nums["Credits"]), glh=int(nums["GLH"])))
    total = sum(u["crit"] for u in units)
    assert total == 136, total
    return styles, script, units


def check_refs(role, unit, text):
    """Every criterion ref a role page cites must exist in that unit."""
    have = set(re.findall(r'<td class="cref">(\d\.\d)</td>', "".join(lo for _, lo in unit["los"])))
    # A ref written after another unit's code ("AU-05 4.5") belongs to that unit.
    for ref in re.findall(r'(?<![\d.])(?<!-05 )(\d\.\d)(?![\d.])', text):
        if ref not in have:
            raise SystemExit(f"{role}: {unit['ref']} cites {ref}, which is not a criterion in that unit")


def page(role, styles, script, units, roles):
    name = role["name"]
    title = HEADING[role["slug"]]
    inline = title if title.startswith("HR") else title[0].lower() + title[1:]
    css = styles[0] + """
  /* Role versions: the applied note under each outcome, and the sibling links. */
  .nots{border-left-color:var(--teal)}
  .nots .nh{color:var(--teal)}
  .siblings{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}
  .siblings a{font-size:12.5px;border:1px solid var(--border);border-radius:100px;padding:6px 14px;color:var(--ink-2)}
  .siblings a:hover,.siblings a.on{border-color:var(--teal);color:var(--teal)}
"""
    tail_css = styles[1] if len(styles) > 1 else ""
    nav_units = "".join(f'<a href="#{u["id"]}"><b>{u["ref"]}</b><span>{u["title"]}</span></a>' for u in units)
    rows = "\n".join(
        f'        <tr><td class="cref"><a href="#{u["id"]}">{u["ref"]}</a></td><td>{u["title"]}</td>'
        f'<td>{u["tqt"]}</td><td>{u["cr"]}</td><td>{u["glh"]}</td><td>5</td><td>{u["crit"]}</td></tr>' for u in units)
    tot = dict(tqt=sum(u["tqt"] for u in units), cr=sum(u["cr"] for u in units),
               glh=sum(u["glh"] for u in units), crit=sum(u["crit"] for u in units))
    on = ' class="on" aria-current="page"'
    siblings = "".join(
        f'<a href="../{r["slug"]}/"{on if r["slug"] == role["slug"] else ""}>{esc(r["name"])}</a>'
        for r in roles)
    rules = "\n".join(f'    <p><strong>{esc(r["name"])}.</strong> {esc(r["why"])}</p>' for r in role["rules"])

    unit_html = []
    for u in units:
        ru = role["units"][u["ref"]]
        out = [f'<section class="unit" id="{u["id"]}">', '  <div class="unit-head">',
               f'    <div class="unit-ref">{u["ref"]}</div>', f'    <h2 class="unit-title">{u["title"]}</h2>',
               f'    {u["meta"]}', '  </div>', '  <div class="unit-body">',
               f'    <h3 class="sub">In {esc(name)}</h3>', f'    <p>{esc(ru["context"])}</p>',
               '    <h3 class="sub">Learning outcomes and assessment criteria</h3>']
        for lo_id, lo in u["los"]:
            note = ru["los"][lo_id]
            check_refs(role["slug"], u, note)
            body = lo.rstrip("\n")
            assert body.endswith("    </div>"), lo_id
            out.append(body[:-len("    </div>")].rstrip("\n"))
            out.append(f'      <div class="nots"><p class="nh">Applied in {esc(name)}</p><p>{esc(note)}</p></div>')
            out.append("    </div>")
        out.append(f'    <p class="tally"><strong>5 learning outcomes, {u["crit"]} assessment criteria.</strong> The same criteria as the generic Diploma, word for word.</p>')
        out.append(f'    <h3 class="sub">Evidence from {esc(name)} work</h3>')
        out.append('    <ul class="bul">')
        for e in ru["evidence"]:
            check_refs(role["slug"], u, e.split(":", 1)[0])
            ref, _, rest = e.partition(":")
            rest = rest.strip()
            rest = rest[:1].upper() + rest[1:]
            out.append(f'      <li><strong>{esc(ref.strip())}.</strong> {esc(rest)}</li>')
        out.append('    </ul>')
        out.append('    <h3 class="sub">Keeping it at Level 5</h3>')
        out.append(f'    <p>{esc(ru["level_watch"])}</p>')
        out.append(f'    <p class="srcnote">The unit aim, level check, boundaries, assessment guidance and evidence trail are in <a href="../#{u["id"]}">{u["ref"]} on the generic Diploma</a>, and apply here unchanged.</p>')
        out.append('    <p class="backtop"><a href="#units">Back to the unit index</a></p>')
        out += ['  </div>', '</section>', '']
        unit_html.append("\n".join(out))

    opens = role["open"] + [
        'Everything open on the generic Diploma applies here too. See <a href="../#open">its open items</a>.']
    open_rows = "\n".join(
        f'      <div class="hrow"><div class="hnum">{i}</div><p>{o if o.startswith("Everything open") else esc(o)}</p></div>'
        for i, o in enumerate(opens, 1))
    shift = "\n".join(f"    <p>{esc(p)}</p>" for p in role["shift"])

    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
    <!-- NOINDEX, DELIBERATE, as on the generic Level 5 page: an unsubmitted
         specification whose title names a qualification. See robots.txt. -->
    <meta name="robots" content="noindex, nofollow">
<script>
  if ('IntersectionObserver' in window) {{ document.documentElement.className += ' js'; }}
</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- GENERATED by scripts/build-l5-pathways.py from qualifications-level-5/index.html
     and scripts/l5-pathways/{role["slug"]}.json. Do not edit this file by hand:
     edit those two and rebuild. CI fails if this page is stale. -->
<title>Level 5 Diploma in Future Fluency: {esc(title)} · specification · Zavmo</title>
<meta name="description" content="The Level 5 Diploma in Future Fluency applied to {esc(inline)}: the same five units and 136 assessment criteria as the generic Diploma, with the change, rules and evidence this function brings to each.">
<meta property="og:title" content="Level 5 Diploma in Future Fluency: {esc(title)} · specification">
<meta property="og:description" content="Five units, 410 TQT, 41 credits, applied to {esc(inline)}. Draft for review, not submitted.">
<style>{css}</style>
<link rel="stylesheet" href="../../_brand/zavmo.css">
<style>{tail_css}</style>
</head>
<body>
<a class="skip" href="#start">Skip to content</a>

<nav>
  <a class="z-logo-link" href="https://zavmo.ai" aria-label="Zavmo"><img class="z-logo" src="../../_brand/zavmo-logo-mono-navy.svg" alt="Zavmo" width="130" height="28"><span class="z-logo-tag">Unit specifications</span></a>
  <span class="nav-spacer"></span>
  <a class="nav-link" href="../">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H6M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Generic Diploma
  </a>
</nav>

<div class="unitnav" role="navigation" aria-label="Jump to a unit">
  <div class="unitnav-in">
    <a href="#units"><b>Index</b><span>All 5 units</span></a>
    {nav_units}
    <a href="#rules"><b>Rules</b><span>What this function works within</span></a>
    <a href="#open"><b>Open items</b><span>What is not yet right</span></a>
  </div>
</div>

<div class="wrap">

  <header class="hero">
    <div class="eyebrow">Draft specification · levelled to RQF Level 5 · not submitted</div>
    <h1>Level 5 Diploma in <em>Future Fluency</em>: {esc(title)}.</h1>
    <p class="lede">The generic Level 5 Diploma, applied to {esc(inline)}. The same five units and the same 136 assessment criteria, word for word. This page adds what this function brings to each unit: the change it faces, the rules it works within, and the evidence a learner would bring.</p>
    <div class="status-line">
      <span class="sbit"><b>For</b>Internal review, then awarding organisation review</span>
      <span class="sbit"><b>Built on</b><a href="../">The generic Level 5 Diploma</a></span>
      <span class="sbit"><b>Status</b>Draft for review. Not submitted</span>
      <span class="sbit"><b>Date</b>{DATE}</span>
    </div>
    <div class="hero-ctas">
      <a class="btn btn-primary" href="#units">Go to the unit index</a>
      <a class="btn btn-ghost" href="../">Read the generic Diploma</a>
    </div>
  </header>

  <section id="start">
    <div class="stats reveal">
      <div class="stat"><div class="stat-num">5</div><div class="stat-label">Mandatory units, the same as the generic Diploma</div></div>
      <div class="stat"><div class="stat-num">25</div><div class="stat-label">Learning outcomes</div></div>
      <div class="stat"><div class="stat-num">{tot["crit"]}</div><div class="stat-label">Assessment criteria, word for word</div></div>
      <div class="stat"><div class="stat-num">{tot["tqt"]}</div><div class="stat-label">Total Qualification Time, in hours</div></div>
      <div class="stat"><div class="stat-num">{tot["cr"]}</div><div class="stat-label">Credits, at 1 per 10 hours of TQT</div></div>
    </div>
  </section>

  <section id="what">
    <div class="section-label">Section 1</div>
    <h2>What changes in {esc(inline)} at Level 5</h2>
    <p><strong>Who it is for.</strong> {esc(role["for"])}</p>
{shift}
    <p><strong>The same qualification.</strong> A learner on this version is assessed against the same criteria, to the same assessment model, as a learner on the generic Diploma. Only the context differs. Their own department is the evidence.</p>
    <p class="muted" style="font-size:13.5px">Other versions of the same Diploma:</p>
    <div class="siblings">{siblings}</div>
  </section>

  <section id="structure">
    <div class="section-label">Section 2</div>
    <h2>Structure and size</h2>
    <p>Credit is shown at the Ofqual convention of 1 credit per 10 hours of Total Qualification Time. Guided learning hours are indicative. Where the hours go, and the level rule every criterion is written to, are set out on <a href="../#structure" style="color:var(--teal)">the generic Diploma</a>.</p>
    <h3 style="margin-top:30px" id="units">2.1 The unit index</h3>
    <p class="muted" style="font-size:13.5px">Level 5 · 5 mandatory units · {tot["tqt"]} TQT. Select a reference to open that unit.</p>
    <div class="tw"><table class="tbl idx">
      <thead><tr><th scope="col">Ref</th><th scope="col">Unit</th><th scope="col">TQT</th><th scope="col">Credits</th><th scope="col">GLH</th><th scope="col">LOs</th><th scope="col">Criteria</th></tr></thead>
      <tbody>
{rows}
      </tbody>
      <tfoot><tr><td></td><td>Total</td><td>{tot["tqt"]}</td><td>{tot["cr"]}</td><td>{tot["glh"]}</td><td>25</td><td>{tot["crit"]}</td></tr></tfoot>
    </table></div>
  </section>

  <section id="rules">
    <div class="section-label">Section 3</div>
    <h2>The rules {esc(inline)} works within</h2>
    <p>A department changing its work stays inside these. The learner records each one where the units ask for constraints and obligations, and works within it.</p>
{rules}
  </section>

  <section id="unitlist">
    <div class="section-label">Section 4</div>
    <h2>The units, applied</h2>
    <p>Each unit shows every learning outcome and assessment criterion exactly as the generic Diploma states them, with a note on how each outcome is met in {esc(inline)}, the evidence a learner would bring, and how the unit stays at Level 5.</p>
  </section>

{"".join(unit_html)}
  <section id="assessment">
    <div class="section-label">Section 5</div>
    <h2>Assessment</h2>
    <p>This version is assessed exactly as the generic Diploma: by portfolio from real work, decided by a human assessor, with a recorded professional discussion for every unit. See <a href="../#assessment" style="color:var(--teal)">assessment and quality assurance</a> and <a href="../#xapi" style="color:var(--teal)">the evidence trail</a> on the generic Diploma.</p>
  </section>

  <section id="open">
    <div class="section-label">Section 6</div>
    <h2>What we know is not yet right</h2>
    <p>Listed plainly, so that a reviewer has this list before finding any of it.</p>
    <div class="honest">
{open_rows}
    </div>
    <p class="backtop"><a href="#units">Back to the unit index</a></p>
  </section>

  <section>
    <div class="callout reveal">
      <h2 style="margin-bottom:10px">What this page is for.</h2>
      <p style="margin-bottom:0">It is the review copy of the Level 5 Diploma in Future Fluency as it applies to {esc(inline)}. Every criterion a learner would be judged against is on this page, in the wording it would be judged in.</p>
    </div>
  </section>

  <footer>
    Level 5 Diploma in Future Fluency: {esc(title)}. Draft for review, {DATE}. Not submitted.<br>
    Levelled against the Ofqual RQF Level 5 descriptor. Not a regulated qualification. Credit calculated at the Ofqual convention of 1 credit per 10 hours of Total Qualification Time. Guided learning hours are indicative.<br>
    <span class="noprint">Hosted on GitHub Pages · <a href="https://github.com/Iridescent-Technologies/proposals">Iridescent-Technologies/proposals</a> · generated from the generic Diploma.</span>
    <span class="z-copyright">© 2026 Zavmo.ai. All rights reserved.</span>
  </footer>

</div>

{script}
</body>
</html>
'''


def main():
    check = "--check" in sys.argv
    styles, script, units = read_generic()
    roles = [json.loads((DATA / f"{slug}.json").read_text(encoding="utf-8")) for slug in ORDER
             if (DATA / f"{slug}.json").exists()]
    stale = []
    for role in roles:
        assert set(role["units"]) == {u["ref"] for u in units}, role["slug"]
        target = OUT / role["slug"] / "index.html"
        text = page(role, styles, script, units, roles)
        if check:
            if not target.exists() or target.read_text(encoding="utf-8") != text:
                stale.append(str(target.relative_to(ROOT)))
        else:
            target.parent.mkdir(exist_ok=True)
            target.write_text(text, encoding="utf-8")
            print("wrote", target.relative_to(ROOT))
    if stale:
        print("::error::These role pages are out of date with the generic Level 5 Diploma. "
              "Run: python3 scripts/build-l5-pathways.py")
        for s in stale:
            print("  " + s)
        sys.exit(1)
    if check:
        print(f"{len(roles)} role pages match the generic Diploma.")


if __name__ == "__main__":
    main()
