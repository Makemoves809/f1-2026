# F1 2026 Season Hub

A Formula 1 fan site tracking the full 2026 season — results, standings, session schedules, and race times displayed in **your local timezone**.

## Live Site
**[makemoves809.github.io/f1-2026](https://makemoves809.github.io/f1-2026)**

## Features

**Results & Standings**
- Driver & Constructor Championship standings with live points
- Driver headshots and team logos throughout the UI
- Points progression chart (interactive, click to highlight a driver)
- Full race classifications with gaps, laps, DNFs, and DNS
- Qualifying grid results per round
- Sprint race results where applicable

**Schedule & Times**
- Full weekend schedule for every round (Practice, Qualifying, Sprint, Race)
- All session times auto-converted to **your local timezone** via browser detection
- Eastern (ET) reference shown when you're outside the Eastern timezone
- Countdown timer to next race start

**UX & Notifications**
- Race reminders — browser notification 10 minutes before race start (saved across reloads)
- Notification state synced across all tabs simultaneously
- **Share button** on every race — copies a direct deep-link URL (e.g. `?race=3`)
- **Add to Google Calendar** on upcoming races — pre-fills race name, time, and circuit
- **Back to top** button appears when scrolling down
- Deep-link support — opening `?race=5` automatically navigates to that round

**Design**
- Dark / Light mode toggle (saved preference)
- English / Spanish language toggle
- Mobile-first responsive layout with bottom navigation
- Smooth card hover animations

## 2026 Season

| Round | Race | Date | Status |
|-------|------|------|--------|
| R1 | 🇦🇺 Australian GP | Mar 8 | Russell 🥇 |
| R2 | 🇨🇳 Chinese GP | Mar 15 | Antonelli 🥇 |
| R3 | 🇯🇵 Japanese GP | Mar 29 | Antonelli 🥇 |
| R4 | 🇧🇭 Bahrain GP | Apr 12 | ❌ Cancelled |
| R5 | 🇸🇦 Saudi Arabian GP | Apr 19 | ❌ Cancelled |
| R6 | 🇺🇸 Miami GP (Sprint) | May 1–3 | Upcoming |
| R7–R22 | Remaining rounds | May–Dec | Upcoming |

> R4 Bahrain and R5 Saudi Arabia were cancelled due to the ongoing Middle East conflict, confirmed March 14, 2026. Season reduced from 24 to 22 Grands Prix.

## Championship Standings (after R3 — Japan)

| Pos | Driver | Team | Pts |
|-----|--------|------|-----|
| 1 | Kimi Antonelli | Mercedes | 72 |
| 2 | George Russell | Mercedes | 63 |
| 3 | Charles Leclerc | Ferrari | 49 |
| 4 | Lewis Hamilton | Ferrari | 41 |
| 5 | Lando Norris | McLaren | 25 |

| Pos | Constructor | Pts |
|-----|-------------|-----|
| 1 | Mercedes | 135 |
| 2 | Ferrari | 90 |
| 3 | McLaren | 46 |
| 4 | Haas | 18 |
| 5 | Alpine | 16 |

## Tech

- Pure HTML, CSS & JavaScript — zero frameworks, zero dependencies
- Single `index.html` file — fully static, works on any device
- Hosted on GitHub Pages
- Driver headshots served from the official Formula 1 media CDN with initials fallback
