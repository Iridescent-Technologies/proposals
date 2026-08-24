#!/usr/bin/env node
//
// Check anything written AS Juliette against her voice rules.
//
//   node scripts/voice-check.mjs               # check, exit 1 on an error
//   node scripts/voice-check.mjs --warn        # report but never fail
//   node scripts/voice-check.mjs --root ../x   # check a different repo
//
// WHY THIS EXISTS. The voice guide (docs/JULIETTE-VOICE.md) is a document, and
// documents get skimmed. The rules that matter most are mechanical, so they can
// be enforced rather than remembered.
//
// THE ONE THAT MATTERS MOST IS SENTENCE LENGTH. Juliette is dyslexic. Short
// sentences are not a style preference, they are so she can read her own work
// back. A beautiful paragraph she cannot get through has failed, however
// accurate it is. That is why length is an ERROR here and not a suggestion.
//
// Errors block. Warnings are judgement calls that a human should look at but
// which are sometimes right.
//
// ---------------------------------------------------------------------------
// TWO TIERS, AND WHY THE SPLIT IS NOT OPTIONAL
// ---------------------------------------------------------------------------
//
// The voice guide opens by saying it is for "emails, the Friday Diary, LinkedIn
// posts, letters, replies. Not for Zavmo product copy." That line is load
// bearing, and this file used to sidestep it by only ever looking at the diary.
//
// Pointing the whole rule set at everything would be worse than checking
// nothing, because the sentence rules would fail work that is correct. An
// assessment criterion like "Evaluate the risks the recommendation carries for
// the department, and what would be done about each" is sixteen words and every
// one of them is doing a job. Shortening it to satisfy a linter would damage a
// regulated qualification to make a number go down.
//
// So:
//
//   tier "hard"      the mechanical bans only. Em dashes, AI lexicon, American
//                    spellings, emoji. True of anything with her name near it,
//                    including specifications, proposals and product copy.
//
//   tier "juliette"  the bans PLUS sentence length, average length and
//                    exclamations. Only where she is speaking as herself.
//
// Targets come from voice-targets.json in the repo being checked, so one script
// serves several repos without knowing anything about them. If that file is
// absent the defaults below apply, which keeps this repo behaving as it did.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const WARN_ONLY = process.argv.includes('--warn');

const rootFlag = process.argv.indexOf('--root');
const ROOT = rootFlag !== -1 ? process.argv[rootFlag + 1] : '.';

// The field notes are deliberately NOT included, because those are evergreen
// essays with a different register.
const DEFAULT_TARGETS = [
  { dir: 'src/content/friday-diary', tier: 'juliette', match: '\\.mdx?$' },
];

function loadTargets() {
  const file = join(ROOT, 'voice-targets.json');
  if (!existsSync(file)) return DEFAULT_TARGETS;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed.targets)) throw new Error('needs a "targets" array');
    return parsed.targets;
  } catch (err) {
    // Loud rather than silent. A malformed config that quietly fell back to the
    // defaults would stop checking the very files it was added to cover.
    console.error(`voice-check: cannot read voice-targets.json - ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

// Hard bans, from the Zavmo tone guide and shared with Juliette's own voice.
// The em dash is first because it is the single most reliable tell that a line
// was generated rather than written.
const BANNED = [
  { re: /—/g, msg: 'em dash. Two sentences trying to be one. Split it.' },
  { re: /\b(delve|delving)\b/gi, msg: 'AI lexicon: "delve"' },
  { re: /\b(crucial|pivotal)\b/gi, msg: 'AI lexicon: use "important", or say why it matters' },
  { re: /\b(landscape|realm|tapestry)\b/gi, msg: 'AI lexicon: metaphor doing no work' },
  { re: /\b(multifaceted|nuanced|robust|holistic|seamless|cutting-edge)\b/gi, msg: 'AI lexicon' },
  { re: /\b(leverage|foster|streamline)\b/gi, msg: 'AI lexicon: say "use", "build", "simplify"' },
  { re: /\bempower\b/gi, msg: 'AI lexicon: say what actually changes for the person' },
  { re: /it'?s important to note/gi, msg: 'If it is important, just say it' },
  { re: /\b(recognize|organiz(e|ed|ation)|color|behavior|analyze)\b/gi, msg: 'American spelling. British English throughout.' },
  { re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, msg: 'emoji. Fine in chat, not in published writing.' },
];

// Real judgement calls. Flagged, never blocking.
const WARNINGS = [
  { re: /\b(unleash|revolution)\w*/gi, msg: 'allowed when she says it in the first person about her own mission, never as a slogan or a headline' },
  { re: /\b(competency|pedagogy|triangulation|cognitive profile)\b/gi, msg: 'L&D jargon: fine for an L&D audience, not for anyone else' },
  { re: /\b(paradigm shift|thought leadership|best.in.class)\b/gi, msg: 'corporate filler' },
];

// The ten-year-old rule, in numbers. Derived from what she actually writes when
// it reads right, not picked arbitrarily. Tier "juliette" only.
const MAX_SENTENCE_WORDS = 34;   // one long sentence is fine, a 40-word one is not
const MAX_AVERAGE_WORDS = 14;    // her entries land around 10-11
const MAX_EXCLAMATIONS = 3;      // she uses them, sparingly

// ---------------------------------------------------------------------------

// schema.org vocabulary is a fixed identifier, not a spelling choice.
// '@type': 'Organization' is spelled that way by Google, and "correcting" it to
// Organisation breaks the structured data. Applied to BOTH readings below: the
// prose body AND the raw frontmatter, because an .astro file's `---` fence is
// JavaScript rather than prose and that is where the JSON-LD lives.
const SCHEMA_VOCAB = /['"]@(type|context)['"]\s*:\s*['"][^'"]*['"]/g;

// ---------------------------------------------------------------------------
// SCRIPTS
// ---------------------------------------------------------------------------
//
// A .js file is not a document, and the rest of this file assumes documents.
// Pointing prose() at one would measure class names, log lines and selectors as
// English. So scripts are not stripped down to prose. The prose is pulled OUT
// of them.
//
// WHY THIS EXISTS. tracker.js writes a large share of the language Juliette
// actually reads on her board: every empty state, every count, every briefing
// sentence. None of it appears in any built page, because it is composed at
// runtime, so checking dist/**/*.html proves nothing about it. Two em dashes
// sat on that board while the site verified clean.
//
// WHAT COUNTS AS PROSE HERE. Only two things:
//
//   1. A string literal in a position that reaches a person.
//   2. The STATIC parts of a template literal in one of those positions.
//
// Everything else is data. `text: label` is a variable and carries whatever the
// board holds; the authored English is the bit around it. That distinction is
// the whole design: in `${m.ref}: ${m.from} to ${m.to} — ` the interpolations
// are data and ": ", " to " and " — " are the writing. That em dash is exactly
// what used to be invisible.

// Where a string becomes something a person reads. Property names rather than a
// hardcoded `el(...)`, so this keeps working if the DOM helper is renamed.
// \b matters: it stops `context:` matching `text:` and `subtitle:` matching
// `title:`.
const SCRIPT_SINKS = [
  /\btext\s*:\s*/,                  // el(tag, { text: ... }), the main one
  /\.textContent\s*=\s*/,
  /\.innerHTML\s*=\s*/,
  /\btitle\s*:\s*/,                 // hover titles on chips and buttons
  /\bplaceholder\s*:\s*/,
  /['"]aria-label['"]\s*:\s*/,
  /\balt\s*:\s*/,
  /\btoast\s*\(\s*/,                // the board's own notifications
  /\bconfirm\s*\(\s*/,
  // The same names as VARIABLES, because the DOM helper takes shorthand:
  // `const title = ...` then `el('a', { href, title })`. There is no `title:`
  // to match at the point the words are written. `(?![=>])` keeps `===` and
  // `=>` out; the quote check below would reject them anyway, but being wrong
  // for a cheaper reason is worth a character.
  /\b(?:text|title|label|message|placeholder)\s*=\s*(?![=>])/,
];

/**
 * Read one string literal starting at `src[i]`, which must be a quote.
 *
 * Returns the AUTHORED text and where the literal ends, or null if this was not
 * a literal after all. For a template literal the interpolations are skipped,
 * because they are data: each one becomes a single space so the static chunks
 * either side stay separate words rather than being run together.
 */
function readLiteral(src, i) {
  const quote = src[i];
  let out = '';
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === quote) return { text: out, end: j + 1 };
    if (quote === '`' && c === '$' && src[j + 1] === '{') {
      // Step over the interpolation. Depth-tracked, because one can hold an
      // object or another template literal, and a naive scan to the next `}`
      // would end the literal early and spill code into the prose.
      //
      // Its nested literals are KEPT, not discarded. That looks wrong for a
      // moment (an interpolation is data) and is not: authored English hides in
      // there constantly, because a conditional is how a sentence gets its
      // optional half. The real example this was written against:
      //
      //   `${pr.repo}#${pr.number}${live.stale ? ' (last known state)' : ''}` +
      //   `${live.reason ? ` — ${live.reason}` : ''}`
      //
      // " (last known state)" is writing a person reads, and the em dash was
      // inside a nested template inside a ternary inside an interpolation.
      // Discarding nested literals would have kept it invisible.
      let depth = 1;
      j += 2;
      while (j < src.length && depth > 0) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '"' || d === "'" || d === '`') {
          const nested = readLiteral(src, j);
          if (!nested) return null;
          if (nested.text.trim()) out += ` ${nested.text} `;
          j = nested.end;
          continue;
        }
        if (d === '{') depth++;
        else if (d === '}') depth--;
        j++;
      }
      out += ' ';
      continue;
    }
    // A quoted string cannot span a line. Hitting one means the opening quote
    // was an apostrophe in a comment, not a literal, so this is not prose.
    if (quote !== '`' && c === '\n') return null;
    out += c;
    j++;
  }
  return null;
}

/** Pull the human-readable strings out of a script, in source order. */
function scriptProse(raw) {
  const found = [];
  for (const sink of SCRIPT_SINKS) {
    const re = new RegExp(sink.source, 'g');
    let m;
    while ((m = re.exec(raw)) !== null) {
      const start = m.index + m[0].length;
      const c = raw[start];
      if (c !== '"' && c !== "'" && c !== '`') continue;  // a variable, not prose
      const lit = readLiteral(raw, start);
      if (lit && lit.text.trim()) found.push([start, lit.text]);
    }
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, t]) => t).join('\n');
}

const isScript = (path) => /\.(m|c)?js$/i.test(path);

/**
 * Strip frontmatter, code, markup and links so PROSE is measured, not markup.
 *
 * Script and style bodies go first, and whole. Without that a page's own
 * JavaScript gets measured as English, and one minified line becomes a
 * four-hundred-word sentence failing a rule it was never subject to.
 *
 * `dropFragments` removes headings and list items. They ARE fragments by
 * design, so measuring them for sentence length would fail correct writing.
 *
 * But that exemption used to apply to the mechanical bans too, and it should
 * never have. An em dash inside a bullet is exactly as banned as one in a
 * paragraph, and it was invisible: week-one.mdx reported clean on the strictest
 * tier while carrying two, both inside list items. So the bans now read a body
 * that KEEPS the fragments, and only the length rules read one without them.
 */
function prose(raw, isHtml, { dropFragments = true } = {}) {
  let s = raw;
  if (isHtml) {
    s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  }
  s = s
    .replace(/^---[\s\S]*?\n---\n/, '')        // frontmatter
    .replace(/```[\s\S]*?```/g, '')            // fenced code
    .replace(/<[^>]+>/g, ' ')                  // html/jsx tags incl. figures
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')         // entities, once the tags are gone
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // links, keep the text
    .replace(SCHEMA_VOCAB, ' ');
  if (dropFragments) {
    s = s
      .replace(/^#{1,6}\s.*$/gm, '')           // headings: fragments by design
      .replace(/^[-*]\s.*$/gm, '');            // list items: also fragments
  }
  return s.replace(/[*_`>]/g, '');
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length > 1);
}

function checkFile(path, tier) {
  const raw = readFileSync(path, 'utf8');
  const isHtml = /\.(html?|astro)$/i.test(path);
  // A script is inverted: prose is pulled OUT of it rather than markup being
  // stripped off it. See SCRIPT_SINKS above for why.
  const script = isScript(path);

  // Two readings of the same file. `body` keeps headings and list items, so a
  // banned character cannot hide in a bullet. `measurable` drops them, because
  // a fragment is not a sentence and must not be measured as one.
  const body = script ? scriptProse(raw) : prose(raw, isHtml, { dropFragments: false });
  const measurable = script ? '' : prose(raw, isHtml);
  const errors = [];
  const warnings = [];
  let stats = null;

  for (const { re, msg } of BANNED) {
    const hits = [...body.matchAll(re)];
    // The frontmatter is checked separately for bans that matter there too.
    // The frontmatter is read raw because prose() strips it, and for an .astro
    // file that fence carries real page copy (BaseLayout builds every page's
    // <title> in there). It also carries JSON-LD, hence the vocabulary strip.
    // A script has no frontmatter, and a `---` in one is a horizontal rule in a
    // string, not a fence.
    const frontmatter = script
      ? ''
      : (raw.match(/^---[\s\S]*?\n---\n/)?.[0] ?? '').replace(SCHEMA_VOCAB, ' ');
    const fmHits = [...frontmatter.matchAll(re)];
    const all = [...hits, ...fmHits];
    if (all.length) {
      const sample = all.slice(0, 3).map((m) => `"${m[0]}"`).join(', ');
      errors.push(`${all.length}x ${msg}  ${sample}`);
    }
  }

  for (const { re, msg } of WARNINGS) {
    const hits = [...body.matchAll(re)];
    if (hits.length) warnings.push(`${hits.length}x ${hits[0][0]} - ${msg}`);
  }

  // Everything below is the "speaking as herself" tier. Applying it to a
  // specification would fail correct writing, which is the whole reason the
  // tiers exist. See the note at the top of this file.
  // Scripts are bans-only, whatever the target says. UI microcopy is fragments
  // by nature ("Save", "Search", "13 more in Next up") and measuring it for
  // sentence length would be measuring the wrong thing entirely.
  if (tier === 'juliette' && !script) {
    const sents = sentences(measurable);
    if (sents.length) {
      const lengths = sents.map((s) => s.split(/\s+/).filter(Boolean).length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const longest = Math.max(...lengths);

      if (avg > MAX_AVERAGE_WORDS) {
        errors.push(`average sentence ${avg.toFixed(1)} words, limit ${MAX_AVERAGE_WORDS}. This is the accessibility rule, not a style one.`);
      }
      const tooLong = sents.filter((s) => s.split(/\s+/).filter(Boolean).length > MAX_SENTENCE_WORDS);
      for (const s of tooLong) {
        errors.push(`${s.split(/\s+/).length}-word sentence, limit ${MAX_SENTENCE_WORDS}: "${s.slice(0, 80)}…"`);
      }
      stats = { count: sents.length, avg: avg.toFixed(1), longest };
    }

    const bangs = (body.match(/!/g) ?? []).length;
    if (bangs > MAX_EXCLAMATIONS) warnings.push(`${bangs} exclamation marks. She uses them, but sparingly.`);
  }

  return { errors, warnings, stats };
}

/** Every file under `dir` matching `re`, recursively. */
function walk(dir, re, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, re, found);
    else if (re.test(entry)) found.push(full);
  }
  return found;
}

// ---------------------------------------------------------------------------

const targets = loadTargets();
const jobs = [];

for (const t of targets) {
  const dir = join(ROOT, t.dir);
  const re = new RegExp(t.match ?? '\\.mdx?$');
  // `warn: true` reports without blocking. This is how a rule gets introduced
  // to writing that predates it: new work is held to the standard from the
  // first day, and the backlog is counted in the open rather than either
  // failing the build on day one or being quietly exempted forever.
  //
  // FIRST MATCHING TARGET WINS, so config order is precedence. This matters:
  // a broad, warn-only entry listed after a narrow, blocking one must not
  // reclaim its files and quietly downgrade them. Putting src/content before
  // src/content/friday-diary would otherwise turn the strictest check in the
  // repo into a non-blocking note, which is the failure that check exists to
  // prevent and would look exactly like everything passing.
  for (const file of walk(dir, re)) {
    if (jobs.some((j) => j.file === file)) continue;
    jobs.push({ file, tier: t.tier ?? 'hard', warn: t.warn === true });
  }
}

// Drafts are skipped. A draft is work in progress, and a half-written entry
// must not block a build of something unrelated. The check that matters happens
// when the draft flag comes off, because that is when it publishes.
const drafts = jobs.filter(({ file }) => /^draft:\s*true\s*$/m.test(readFileSync(file, 'utf8')));
const files = jobs.filter((j) => !drafts.includes(j));

if (!files.length) {
  console.error('voice-check: no files found. Did the content move, or is voice-targets.json wrong?');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SELF-TEST
// ---------------------------------------------------------------------------
//
// `node scripts/voice-check.mjs --self-test`
//
// The extractor is the one part of this file whose behaviour is not obvious
// from reading it, and the repo has no test runner, so it carries its own. The
// cases are not invented: 1 and 3 are the two em dashes that were live on the
// board in tracker.js, and 3 is the shape that made one of them invisible for
// months. Case 4 is the line above it in the same file, which must stay quiet.
const SELF_TESTS = [
  {
    name: 'a literal in a plain sink is prose',
    src: `toast('Saved — nothing else to do.');`,
    expect: 1,
  },
  {
    name: 'the static parts of a template are prose, the interpolations are not',
    src: "el('span', { text: `${m.ref}: ${m.from} to ${m.to} — ` })",
    expect: 1,
  },
  {
    name: 'a nested literal inside an interpolation is still prose',
    src: "const title = `${pr.n}${live.reason ? ` — ${live.reason}` : ''}`;",
    expect: 1,
  },
  {
    name: 'a code comment is not prose',
    src: '// "14 Aug 06:17" — for anything that runs more than once a day.',
    expect: 0,
  },
  {
    name: 'a variable in a sink carries data, not writing',
    src: "el('span', { text: someLabel })",
    expect: 0,
  },
  {
    name: 'a non-sink string is left alone',
    src: "const cls = 'tk-btn — modifier';",
    expect: 0,
  },
];

if (process.argv.includes('--self-test')) {
  const emDash = /—/g;
  let bad = 0;
  console.log('Voice check self-test\n');
  for (const t of SELF_TESTS) {
    const got = (scriptProse(t.src).match(emDash) ?? []).length;
    const ok = got === t.expect;
    if (!ok) bad++;
    console.log(`  ${ok ? 'pass' : 'FAIL'}  ${t.name}  (expected ${t.expect}, got ${got})`);
  }
  if (bad) {
    console.error(`\n${bad} self-test failure(s). The extractor no longer does what it says.`);
    process.exit(1);
  }
  console.log('\nAll self-tests pass.');
  process.exit(0);
}

let failed = 0;
let backlog = 0;
console.log('Voice check\n');
if (drafts.length) {
  console.log(`  (skipping ${drafts.length} draft(s): ${drafts.map((d) => d.file.split('/').pop()).join(', ')})\n`);
}

for (const { file, tier, warn } of files) {
  const { errors, warnings, stats } = checkFile(file, tier);
  const head = stats ? `${stats.count} sentences, avg ${stats.avg}, longest ${stats.longest}` : `[${tier}]`;
  console.log(`  ${relative(ROOT, file)}  ${head}${warn ? '  (backlog)' : ''}`);
  for (const e of errors) {
    console.log(`    ${warn ? 'BACKLOG' : 'ERROR  '}  ${e}`);
    if (warn) backlog++; else failed++;
  }
  for (const w of warnings) console.log(`    note   ${w}`);
  if (!errors.length && !warnings.length) console.log('    clean');
}

// Counted every run, so it cannot quietly grow. If this number is going up,
// somebody is adding to writing that was already exempt.
if (backlog) console.log(`\n${backlog} backlog error(s) in writing that predates this check. Not blocking.`);

if (failed && !WARN_ONLY) {
  console.error(`\n${failed} error(s). See docs/JULIETTE-VOICE.md.`);
  process.exit(1);
}
console.log(failed ? `\n${failed} error(s), not failing (--warn).` : '\nAll clean.');
