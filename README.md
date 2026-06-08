# F1 2026 Season Hub

A fan-built Formula 1 hub for the 2026 season — race results, standings, session times, and a live countdown to lights-out — all displayed in **your local timezone**.

## 🏁 Live site

**[makemoves809.github.io/f1-2026](https://makemoves809.github.io/f1-2026)**

Single static page, works on any device, no login required.

---

## Features

### Results & standings
- Driver and Constructor championship tables, kept in sync after every round
- Driver portraits and team logos served from the official F1 media CDN (with initials fallback if a request fails)
- Animated points-progression chart — click any driver dot to open their full season
- Full race classifications with gaps, laps, DNFs, DNSs and DSQs
- Saturday Sprint results and main-race qualifying grid for every applicable round
- Driver profile modal — one tap on any name shows their nationality, car number, age, and round-by-round results

### Schedule & timing
- Every Practice / Qualifying / Sprint / Race session, with times **auto-converted to your local browser timezone**
- Live countdown to the next race start — switches to a pulsing "LIVE" state once the race is running
- Eastern Time card shown alongside local time when they differ
- Race weekend pills: ⚡ Sprint, ⚡ Sat Race, ★ New 2026

### Notifications & sharing
- 🔔 Race reminders — browser notification 10 min before lights-out, persists across reloads
- 📅 Add-to-calendar — Apple Calendar (`.ics` download) on iOS / macOS, Google Calendar on everything else
- 🔗 Share button — copies a deep link like `?race=6` straight to clipboard

### UX
- Dark / Light theme toggle (preference saved)
- English / Spanish language toggle (every label, every highlight)
- Mobile-first layout with sticky bottom nav and iOS safe-area support
- Keyboard shortcuts: `←` / `→` cycle race tabs, `Esc` closes the driver modal
- Visible focus rings, `prefers-reduced-motion` honoured, print stylesheet for clean PDF exports

---

## 2026 calendar at a glance

| Rd | Race | Date | Status | Winner |
|----|------|------|--------|--------|
| R1 | 🇦🇺 Australian GP | Mar 8 | ✓ Done | George Russell |
| R2 | 🇨🇳 Chinese GP *(Sprint)* | Mar 13–15 | ✓ Done | Kimi Antonelli |
| R3 | 🇯🇵 Japanese GP | Mar 29 | ✓ Done | Kimi Antonelli |
| R4 | 🇧🇭 Bahrain GP | Apr 12 | ❌ Cancelled | — |
| R5 | 🇸🇦 Saudi Arabian GP | Apr 19 | ❌ Cancelled | — |
| R6 | 🇺🇸 Miami GP *(Sprint)* | May 1–3 | ✓ Done | Kimi Antonelli |
| R7 | 🇨🇦 Canadian GP *(Sprint)* | May 22–24 | ✓ Done | Kimi Antonelli |
| R8 | 🇲🇨 Monaco GP | Jun 7 | ✓ Done | Kimi Antonelli |
| R9 | 🇪🇸 Spanish GP (Barcelona) | Jun 14 | ⚡ Next |  |
| R10–R24 | Remaining rounds | Jun – Dec | Upcoming |  |

> **R4 Bahrain and R5 Saudi were officially cancelled** by F1 and the FIA due to the Middle East conflict, reducing the 2026 calendar from 24 to 22 Grands Prix. ([Sky Sports](https://www.skysports.com/f1/news/12433/13519453/f1-confirms-cancellation-of-bahrain-and-saudi-arabian-grands-prix-due-to-war-in-middle-east-as-2026-calendar-reduced-to-22-races))

---

## Championship — after R8 Monaco

### Drivers

| Pos | Driver | Team | Wins | Pts |
|-----|--------|------|------|-----|
| 1 | Kimi Antonelli | Mercedes | 5 | 156 |
| 2 | Lewis Hamilton | Ferrari | 0 | 90 |
| 3 | George Russell | Mercedes | 1 | 88 |
| 4 | Charles Leclerc | Ferrari | 0 | 75 |
| 5 | Oscar Piastri | McLaren | 0 | 60 |
| 6 | Lando Norris | McLaren | 0 | 58 |
| 7 | Max Verstappen | Red Bull | 0 | 43 |

### Constructors

| Pos | Constructor | Pts |
|-----|-------------|-----|
| 1 | Mercedes | 244 |
| 2 | Ferrari | 165 |
| 3 | McLaren | 118 |
| 4 | Red Bull | 72 |
| 5 | Alpine | 41 |
| 6 | Racing Bulls | 39 |
| 7 | Haas | 21 |

---

## Tech

- Pure HTML / CSS / JavaScript — zero frameworks, zero build step, zero npm dependencies
- One `index.html` file (~2.3k lines, ~160 KB) — entirely static, deployable to anything that serves files
- Driver photos pulled from `media.formula1.com` (2026 CDN path) with graceful fallback to initials
- Hosted on **GitHub Pages**

### Run locally

```bash
git clone https://github.com/Makemoves809/f1-2026.git
cd f1-2026
# any static server works — pick one:
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

### Updating after a race

After each Grand Prix, update the data blocks near the top of the `<script>` section in `index.html`:

1. `DRIVER_STANDINGS` — `pts` / `wins` / position
2. `CONSTRUCTOR_STANDINGS` — `pts` / position
3. `POINTS_HISTORY` — append the new cumulative totals
4. `DRIVER_RESULTS` — append the new round per driver
5. `RACE_RESULTS[round]` — full classification + highlights
6. `SPRINT_RESULTS[round]` and `QUALIFYING_GRID[round]` if applicable
7. Set `done:true` on that round in `SCHEDULE`
8. Add EN + ES highlight strings (`hl_rN_*`, `hl_sN_*`) to `T`

`COMPLETED_ROUNDS`, `TOTAL_ROUNDS`, and `REMAINING_ROUNDS` derive themselves from `SCHEDULE` automatically.

---

## Disclaimer

This is an unofficial **fan project**. Not affiliated with, endorsed by, or sponsored by Formula 1, the FIA, or any team. All trademarks, logos, and driver photos are the property of their respective owners. Stats are curated from public reporting and verified against [formula1.com](https://www.formula1.com), [Wikipedia](https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship), and major motorsport outlets — corrections welcome via issues.
