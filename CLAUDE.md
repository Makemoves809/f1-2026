# CLAUDE.md — F1 2026 site update playbook

This file tells Claude how to keep `index.html` accurate when a race weekend
finishes. **Read it in full** before touching race data. The biggest risk on
this site is publishing wrong positions; the playbook is built to eliminate
that risk through redundant verification.

---

## One-word trigger: `finalize`

When the user types **`finalize`** (alone, or `finalize R<n>`), execute the
full **Race-Completion Protocol** below. No abbreviated version. The word
means: "treat the most-recently-finished race as a deliverable I want
locked in — research, edit, validate, deploy."

If the user types `update` (without `finalize`), default to the same
protocol but ask first whether they want full lock-in or just a quick
results bump.

---

## Project layout (single source of truth)

- `index.html` — entire app (HTML + inline CSS + inline JS + i18n)
- `sw.js` — service worker (bump `CACHE_VERSION` every deploy)
- `README.md` — summary table; keep top 7 drivers / top 7 constructors in sync
- `manifest.json`, `*.svg` — assets (don't touch during race updates)

Data sections inside `index.html` (line numbers drift; use grep, not absolutes):

| Section | Purpose |
|---|---|
| `SCHEDULE` | Round list. Flip `done:false → true` for the finished round. |
| `DRIVER_STANDINGS` | 22 drivers, sorted by pts desc, then tie-break. `pos` must equal array index + 1. |
| `CONSTRUCTOR_STANDINGS` | 11 teams. `pts` must equal sum of its two drivers. |
| `POINTS_HISTORY` | Top 6 championship drivers. Each array has one entry per **session** (sprints count separately). Last value must equal `DRIVER_STANDINGS[driver].pts`. |
| `CHART_LABELS` | Display labels for `POINTS_HISTORY` x-axis. Already pre-populated through R24 — don't edit. |
| `DRIVER_RESULTS` | All 22 drivers × all sessions. **Every** driver needs an entry for every race they participated in, including finishes outside points and DNS/DNF. |
| `RACE_RESULTS[round]` | Full race classification (22 entries). |
| `SPRINT_RESULTS[round]` | Full sprint classification (22 entries). |
| `QUALIFYING_GRID[round]` | Quali grid (optional, but populate when known). |
| `i18n.en` / `i18n.es` | Highlight strings `hl_r<round>_1..6`. Both languages required. |

---

## Race-Completion Protocol (`finalize`)

Eight phases. **Do them in order.** Don't skip phase 0 even when "you
already know" — every regression in this project came from skipping
verification.

### Phase 0 — Decide what to research

Identify the round. Confirm: was there a sprint that weekend? `SCHEDULE[round].sprint`
tells you. Sprint adds a second classification block and another
`POINTS_HISTORY` entry per driver.

### Phase 1 — Fan-out research

Run **at least four parallel `WebSearch` calls**, mixing query angles:

1. `"<year> <track> Grand Prix" official final classification race result`
2. `"<year> <track>" "post-race penalty" OR "stewards" full results adjusted`
3. `"<year> <track>" fastest lap driver time lap number`
4. `"<year> <track>" DNF retirement lap reason all drivers`

Why four queries: web-search snippets are model-synthesized and routinely
hallucinate positions, swap drivers, or quote pre-penalty classifications.
A single query is not enough.

Prefer these sources (high signal):
- `formula1.com/en/results/...` (official; sometimes 403s WebFetch)
- `racefans.net`, `the-race.com`, `racingnews365.com`, `gpfans.com`
- `motorsport.com`, `crash.net`, `skysports.com/f1`
- Team sites (e.g. `cadillacf1team.com`) for their own driver narratives

Avoid: pre-race previews, qualifying-only pages, archive pages from
prior seasons. The synthesizer mixes seasons if you're not specific.

### Phase 2 — Reconcile to the FINAL classification (post-penalty)

This is the step that has burned us twice. After a chaotic race the
on-track order ≠ the official classification. Penalties may not be
announced until 1–4 hours post-race.

For each finishing position, demand **two independent corroborations**:
- Position number
- Team (catches name-swap hallucinations)
- Gap or status

If two sources disagree on a position, search for a third. If still
ambiguous, **flag it in the commit message** and use the safer default
(e.g. omit the gap rather than fabricate one).

Cross-validation arithmetic (always do this before editing):

- Sum the new championship leader's points and verify against any
  "<leader> now has X" or "<leader> leads by Y" quote in the coverage.
  If the math doesn't match, the data is wrong. Investigate.
- Total points awarded in a non-sprint race = 25+18+15+12+10+8+6+4+2+1 = **101**
- Total points awarded in a sprint = 8+7+6+5+4+3+2+1 = **36**
- Driver standings deltas must sum to the race points awarded (101 + 36 if sprint).

### Phase 3 — Edit `index.html`

Order matters because the validator depends on consistency:

1. **`SCHEDULE`**: flip the finished round to `done:true`.
2. **`RACE_RESULTS[round]`**: add the full classification. Required keys per
   row: `pos, name, team, color, gap, laps, pts, status` (`fin`/`dnf`/`dns`).
   Use `pos:"DSQ"` for disqualifications.
   Pole line uses format `"<Driver> — <m:ss.xxx>"`; fastest lap uses
   `"<Driver> — <m:ss.xxx> (Lap N)"`. If a value is genuinely unknown,
   write `"Not yet confirmed"` — do NOT invent times.
3. **`SPRINT_RESULTS[round]`** (if applicable): same format, sprint points (8…1).
4. **`DRIVER_RESULTS`**: append the new round to **every** driver. Use these
   exact race-name strings (the validator and chart match on them):
   `"Australia"`, `"China Sprint"`, `"China"`, `"Japan"`, `"Miami Sprint"`,
   `"Miami"`, `"Canada Sprint"`, `"Canada"`, `"Monaco"`, etc.
   - For DNS/DNF: `pos:"DNS"` or `pos:"DNF"`, `pts:0`.
   - Position string format: always prefix with `P` for finishes (`"P9"`),
     never for status codes (`"DNF"`, `"DNS"`, `"DSQ"`).
5. **`DRIVER_STANDINGS`**: recalculate every driver's `pts` from their
   `DRIVER_RESULTS` array, re-sort, renumber `pos` 1…22. Update `wins`
   (count of `P1` finishes in non-sprint races) for the winner.
6. **`CONSTRUCTOR_STANDINGS`**: recompute each team's pts as the sum of
   its two drivers, re-sort, renumber. Update the `drivers:` string.
7. **`POINTS_HISTORY`**: append one entry per driver (current cumulative
   total) — **add one element for the sprint AND one for the race** if it
   was a sprint weekend.
8. **`i18n.en` and `i18n.es`**: add `hl_r<round>_1..6` strings. Six
   highlights, each starts with `<strong>…</strong>` then an em-dash and
   one sentence. Match icons in the `RACE_RESULTS[round].highlights`
   array.
9. **`README.md`**: update the schedule table row and the championship
   summary table (top 7 drivers, top 7 constructors).
10. **`sw.js`**: bump `CACHE_VERSION = "f1-2026-v<N+1>"`. Required —
    returning visitors won't see new data otherwise.

### Phase 4 — Tie-breakers

Drivers tied on points sort by **best result** (count of P1s, then P2s,
then P3s, etc., then P4s … all the way down). If still tied, use earlier
in season. Constructors use the same logic.

Common patterns: after Monaco we had Lawson 26 / Gasly 26 — Lawson took
the higher slot because his best was P5 (Monaco) vs Gasly's P6 (China).

### Phase 5 — Validate

Run the validator below. It catches the failure modes that bit us in
past updates. **All checks must pass before commit.**

```bash
# 1. JS syntax check
END=$(grep -n "</script>" index.html | head -1 | cut -d: -f1)
START=$(grep -n "<script>" index.html | head -1 | cut -d: -f1)
sed -n "$((START+1)),$((END-1))p" index.html > /tmp/s.js
node --check /tmp/s.js

# 2. Full data consistency (drop into /tmp/check.js, then `node /tmp/check.js`)
```

```javascript
// /tmp/check.js
const fs=require('fs');
let src=fs.readFileSync('/home/user/f1-2026/index.html','utf8');
const driverPhoto=()=>'';
function grab(s,e){const i=src.indexOf(s);const j=src.indexOf(e,i);return src.slice(i,j+e.length);}
const code=`${grab('const DRIVER_STANDINGS = [','];')}
${grab('const CONSTRUCTOR_STANDINGS = [','];')}
${grab('const POINTS_HISTORY = [','];')}
${grab('const DRIVER_RESULTS = {','\n};')}
${grab('const RACE_RESULTS = {','\n};')}
${grab('const SPRINT_RESULTS = {','\n};')}
${grab('const QUALIFYING_GRID = {','\n};')}
return {DRIVER_STANDINGS,CONSTRUCTOR_STANDINGS,POINTS_HISTORY,DRIVER_RESULTS,RACE_RESULTS,SPRINT_RESULTS,QUALIFYING_GRID};`;
const d=new Function('driverPhoto',code)(driverPhoto);
let p=[];
const norm=s=>String(s||'').replace(/^P/,'');
const RPTS=[25,18,15,12,10,8,6,4,2,1], SPTS=[8,7,6,5,4,3,2,1];
const COMPLETED_RACES=[1,2,3,6,7,8]; // update as season progresses
const COMPLETED_SPRINTS=[2,6,7];     // update as season progresses

// A) Driver totals
d.DRIVER_STANDINGS.forEach(x=>{const s=(d.DRIVER_RESULTS[x.name]||[]).reduce((a,r)=>a+(r.pts||0),0);if(s!==x.pts)p.push(`pts ${x.name} ${x.pts}!=${s}`);});
// B) Constructor totals
const bt={};d.DRIVER_STANDINGS.forEach(x=>bt[x.team]=(bt[x.team]||0)+x.pts);
d.CONSTRUCTOR_STANDINGS.forEach(c=>{if(bt[c.name]!==c.pts)p.push(`cons ${c.name} ${c.pts}!=${bt[c.name]}`);});
// C) Pos sequences
d.DRIVER_STANDINGS.forEach((x,i)=>{if(x.pos!==i+1)p.push(`pos seq ${x.name}:${x.pos}`);});
d.CONSTRUCTOR_STANDINGS.forEach((c,i)=>{if(c.pos!==i+1)p.push(`cs pos seq ${c.name}:${c.pos}`);});
// D) Sort order
for(let i=1;i<d.DRIVER_STANDINGS.length;i++)if(d.DRIVER_STANDINGS[i].pts>d.DRIVER_STANDINGS[i-1].pts)p.push(`order ${d.DRIVER_STANDINGS[i].name}>${d.DRIVER_STANDINGS[i-1].name}`);
for(let i=1;i<d.CONSTRUCTOR_STANDINGS.length;i++)if(d.CONSTRUCTOR_STANDINGS[i].pts>d.CONSTRUCTOR_STANDINGS[i-1].pts)p.push(`cs order ${d.CONSTRUCTOR_STANDINGS[i].name}>${d.CONSTRUCTOR_STANDINGS[i-1].name}`);
// E) Race classifications complete + points correct
COMPLETED_RACES.forEach(r=>{const rr=d.RACE_RESULTS[r];if(!rr){p.push(`No RACE ${r}`);return;}if(rr.results.length!==22)p.push(`R${r} count ${rr.results.length}`);if(new Set(rr.results.map(x=>x.name)).size!==22)p.push(`R${r} dup names`);rr.results.forEach(x=>{const pos=parseInt(x.pos);const e=(!isNaN(pos)&&RPTS[pos-1]!=null)?RPTS[pos-1]:0;if((x.pts||0)!==e)p.push(`R${r} pts ${x.name} pos${x.pos} ${x.pts}!=${e}`);});});
COMPLETED_SPRINTS.forEach(r=>{const sr=d.SPRINT_RESULTS[r];if(!sr){p.push(`No SPRINT ${r}`);return;}if(sr.results.length!==22)p.push(`S${r} count ${sr.results.length}`);if(new Set(sr.results.map(x=>x.name)).size!==22)p.push(`S${r} dup names`);sr.results.forEach(x=>{const pos=parseInt(x.pos);const e=(!isNaN(pos)&&SPTS[pos-1]!=null)?SPTS[pos-1]:0;if((x.pts||0)!==e)p.push(`S${r} pts ${x.name} pos${x.pos} ${x.pts}!=${e}`);});});
// F) Wins
d.DRIVER_STANDINGS.forEach(x=>{const w=(d.DRIVER_RESULTS[x.name]||[]).filter(r=>!/Sprint/.test(r.race)&&r.pos==='P1').length;if(w!==x.wins)p.push(`wins ${x.name} ${x.wins}!=${w}`);});
// G) Points history finals match standings
d.POINTS_HISTORY.forEach(([nn,,arr])=>{const dr=d.DRIVER_STANDINGS.find(x=>x.name===nn);if(!dr){p.push(`ph ${nn}`);return;}if(arr[arr.length-1]!==dr.pts)p.push(`ph final ${nn}: ${arr[arr.length-1]}!=${dr.pts}`);});
// H) Cross-store position consistency
COMPLETED_RACES.forEach(r=>{const rr=d.RACE_RESULTS[r];if(!rr)return;rr.results.forEach(x=>{const dr=d.DRIVER_RESULTS[x.name];if(!dr)return;const m=dr.find(e=>e.round===r&&!/Sprint/.test(e.race));if(!m){p.push(`R${r} no DR entry for ${x.name}`);return;}if(norm(m.pos)!==norm(x.pos))p.push(`R${r} pos mismatch ${x.name}: RR=${x.pos} DR=${m.pos}`);});});
COMPLETED_SPRINTS.forEach(r=>{const sr=d.SPRINT_RESULTS[r];if(!sr)return;sr.results.forEach(x=>{const dr=d.DRIVER_RESULTS[x.name];if(!dr)return;const m=dr.find(e=>e.round===r&&/Sprint/.test(e.race));if(!m){p.push(`S${r} no DR entry for ${x.name}`);return;}if(norm(m.pos)!==norm(x.pos))p.push(`S${r} pos mismatch ${x.name}: SR=${x.pos} DR=${m.pos}`);});});
console.log(p.length?('PROBLEMS:\n'+p.join('\n')):'FULL DATA CONSISTENT ✓');
```

```bash
# 3. Render smoke test — confirms the new round renders
cat > /tmp/smoke.js <<'EOF'
const fs=require('fs');
let src=fs.readFileSync('/home/user/f1-2026/index.html','utf8');
const script=src.slice(src.indexOf('<script>')+8, src.lastIndexOf('</script>'));
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const noop=()=>{};
globalThis.document={addEventListener:noop,body:{classList:{add:noop,remove:noop}},documentElement:{},
  getElementById:()=>({classList:{add:noop,remove:noop},style:{},textContent:'',addEventListener:noop}),
  querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{},classList:{add:noop}})};
globalThis.window={addEventListener:noop,matchMedia:()=>({matches:false,addEventListener:noop})};
globalThis.navigator={language:'en-US'};
globalThis.location={search:''};
const exp=new Function(script+';return {buildResultPanel,buildUpcomingPanel,SCHEDULE,RACE_RESULTS};')();
const RND = /* the round number you just added */ 0;
const r=exp.SCHEDULE.find(x=>x.round===RND);
console.log('Panel chars:', exp.buildResultPanel(r,exp.RACE_RESULTS[RND]).length, '— SMOKE PASSED');
EOF
node /tmp/smoke.js
```

### Phase 6 — Commit, push, deploy

Branch convention: develop on the feature branch listed in the session
prompt (look for `claude/update-*`). Then fast-forward `main` and push
both. **GitHub Pages serves `main`**, so `main` is the deploy.

```bash
git add index.html sw.js README.md CLAUDE.md
git commit -m "<descriptive subject>

<2-3 lines on what changed and why>"
git push -u origin <feature-branch>
git checkout main
git merge --ff-only <feature-branch>
git push origin main
git checkout <feature-branch>
```

Bumping `sw.js` is what triggers the cache refresh on returning visitors.
Forget this and the site appears unchanged for a day.

### Phase 7 — Report back to user

End-of-turn message: 1–2 lines on what changed (top-line standings move,
winner, anything historic), then a confidence note flagging any data
that came from only one source. Don't dump tables unless asked.

---

## Pitfalls (every one of these has happened on this project)

1. **Synthesized search snippets hallucinate.** A single search will
   confidently claim "Hülkenberg P9" while the FIA timesheet has him
   P13. Always corroborate from at least two independent sources.
   Validate against championship-leader's quoted total.
2. **Pre-penalty vs post-penalty classifications.** Live coverage and
   the first wave of articles use on-track order. The FIA only
   confirms the official classification 1–4 hours later. If a key
   penalty is reported (drive-through, false-start, 5/10/20s post-race),
   wait for the post-penalty version or explicitly model the shuffle.
3. **DNF vs classified-but-damaged.** A car involved in a collision is
   not automatically DNF — verify whether they continued. We had
   Colapinto wrong on Monaco for one commit.
4. **Sprint vs race counting.** Sprints award 8 pts max, races 25.
   `POINTS_HISTORY` arrays grow by **one element per session**.
   `DRIVER_RESULTS` distinguishes via the `race:` string ("China
   Sprint" vs "China") — the validator uses that regex.
5. **Every driver needs a DRIVER_RESULTS entry per race they entered.**
   Even outside-points finishers and DNS drivers. Missing entries make
   the chart and per-driver pages incomplete.
6. **Lower-order positions are not "free."** P11-P22 may carry zero
   points, but they affect tie-breakers (best-result countback).
   Don't fabricate them — leave gap as `"—"` if unknown.
7. **Service worker cache version.** If you don't bump `CACHE_VERSION`
   in `sw.js`, the new data is invisible to PWA users. Always bump.
8. **Region locks / 403s.** `formula1.com/en/results/...` returns 403
   to `WebFetch` from this environment. Use WebSearch instead, or
   fetch from secondary aggregators.
9. **Race naming.** R9 is "Barcelona-Catalunya GP" (not "Spanish GP");
   R16 Madrid is the "Spanish GP" in 2026. Get the official names
   right — F1 sometimes rebrands events between seasons.
10. **Driver numbers change.** Champions take #1; the previous #1
    reverts to their old number (Verstappen ran #1 when champion,
    then #3 in 2026 — *not* #33). Always verify after a title change.

---

## Quick reference

- Points: race 25-18-15-12-10-8-6-4-2-1; sprint 8-7-6-5-4-3-2-1
- 22 drivers / 11 teams (2026 adds Cadillac as #11)
- 2026 calendar: 22 rounds (Bahrain R4 + Saudi R5 cancelled March 2026)
- Current branch convention: `claude/update-*` (check session prompt)
- Deploy target: `main` (GitHub Pages)
- Languages: EN + ES, both must be updated together

## When in doubt

Ask. Pushing fabricated data to a public site is worse than admitting a
gap. Mark "Not yet confirmed" or "—" in places where corroboration is
weak and explain in the commit message what's pending.
