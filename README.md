# Tidehold — The Last Coast

A dependency-free HTML5 kingdom survival game for **desktop and touch screens**, built for [Kvolio/kvo.6](https://github.com/Kvolio/kvo.6). Features illustrated overhead roofs, a map-first HUD, ore-rich mountains, larger islands, timed progression, and a 60-wave Nightmare campaign.

Start with one Keep, five workers, and a small resource reserve. Build an economy, recruit defenders, fortify your coast, and survive 40 waves on Easy, 50 on Normal and Hard, or 60 on Nightmare. The project is a playable first implementation of the design brief, not a finished commercial release.

## Play locally

Requires Node.js 20 or newer. No package installation is needed.

```sh
npm start
```

Open http://127.0.0.1:4173 in a browser. The development server binds to loopback only.

```sh
npm test
npm run build
```

The build produces **`dist/index.html`**, a self-contained game with inline code and styles, no external fonts, and no network dependencies. It can be opened directly or served by any static HTML5 host. Save behavior for `file://` URLs depends on the browser; static hosting is recommended for durable saves.

## Controls

| Action | PC | Phone / tablet |
| --- | --- | --- |
| Select | Left click; Shift adds to selection | Tap |
| Select a group | Left-drag box, or Army → Select army | Army → Select army/workers; Inspect → Box select |
| Pan | WASD, arrows, right/middle drag | One-finger drag or two-finger pan |
| Zoom | Mouse wheel or + / − | Pinch or + / − |
| Move | Select units, right click a destination | Inspect → Move, then tap a destination |
| Attack move / patrol | Select units, choose order, click destination | Select units, choose order, tap destination |
| Build | Choose a building, click valid land | Choose a building, tap a site, then **Place here** |
| Rotate / upgrade | R rotates placement; E upgrades selection | Rotate or Upgrade buttons |
| Walls and roads | Drag to draw connected runs | Drag a preview, then confirm |
| Mount walls | Select archers/crossbows, right-click a completed wall | Inspector → Mount wall, then tap the wall |
| Cancel building | Escape, right click, or ✕ | ✕ |
| Pause / speed | Space or on-screen buttons | On-screen buttons |

Touch camera gestures do not place buildings or issue orders. The layout supports portrait and landscape without requiring fullscreen or orientation lock. Scroll the command panel if necessary; on portrait phones, swipe the building cards sideways.

## First steps

1. Place a Lumber Camp near trees and a Farm near the Keep. Two idle workers automatically build each and remain assigned to production.
2. Build a House and train additional workers at the Keep. Assign them to production sites or leave some idle for construction and repairs.
3. Establish a Quarry. Build a Barracks or Archery Range and recruit defenders. Towers attack automatically.
4. Fortify approaches with walls and leave gates for friendly units. Enemies route around obstacles or attack a blocking structure when enclosed.
5. Upgrade the Keep for iron/gold mines, advanced troops, and ballista towers. Blacksmith research improves weapons and armor.

## Mountains and the new interface

New kingdoms generate two or three connected mountain ranges. Peaks block construction and ground movement; two-tile passes and traversable foothills preserve routes to the coast. Flying enemies can cross peaks. The starting eight-tile area stays clear of mountains, with guaranteed nearby wood and stone.

Foothill tiles roll a 20% stone, 8% iron, and 4% gold deposit chance. Mineral deposits there hold **2,100 resources**, compared with **1,400** in the lowlands. Select a deposit to see its remaining reserve. Mines and workers require reachable deposits within the existing eight-tile collection radius. Blocked or exhausted mines report their status; workers carry partial loads back when a vein runs out.

Existing saves load their original maps unchanged and receive the new graphics and interface. **Start a new kingdom for the new terrain.** Easy and Normal retain a northern coast; Hard and Nightmare use larger islands surrounded by ocean.

The title screen offers Continue, New Kingdom, Settings, and How to Play. Build and Army open trays from the bottom dock; selecting buildings, units, or deposits opens their inspector. Choosing a building closes the tray for placement. The pause menu saves before returning to the title and keeps the current kingdom open if saving fails. Nested menus preserve your previous pause state.

See [walls, troop classes, Temple and Keep perks](docs/EXPANSION.md), [beginner guidance, difficulty tuning and boss HUD](docs/USABILITY.md), [Nightmare, upgrades and screenshots](docs/NIGHTMARE.md), [implementation coverage](docs/OVERHAUL-STATUS.md), and [playtest scope](docs/PLAYTEST.md).

Buildings do not generate resources without workers. Workers gather, carry resources, and drop them at the Keep or a Warehouse. Food is consumed slowly by the population; at zero food, friendly movement slows. Pause remains available while planning and building.

The Keep fires defensive arrows automatically. New kingdoms wait for a building, recruitment or unit order before counting down to the first invasion. Easy and Normal offer a skippable in-game tutorial. Approaching ships appear as cream arrows on the minimap. Buildings can replace deposits and move units safely out of their footprint.

## Implemented

- Seeded coastal terrain and resource deposits; no starting village.
- Grid placement, validity previews, construction, worker assignment, capacity, food upkeep, storage, repair, demolition refunds, and upgrades.
- Nine recruitable unit types, selection/group orders, hold/defend/attack move/patrol, gates, roads, towers, and grid pathfinding.
- Visible ship crews, multiple coasts, mixed enemy roles, stronger bosses, direct flying arrivals, wall garrisons, and optional five-second auto waves.
- 40-wave Easy campaign and 50-wave Normal/Hard campaigns; Nightmare adds demon portals, 12 regular demon classes, the ArchDemon, the two-phase Demon Lord and extra abilities at every earlier milestone. Endless continuation repeats demon bosses.
- Worker-built timed upgrades, persistent/drag construction, timed training and Blacksmith and Temple technology trees. Five illustrated building levels and four named Keep designs with distinct perks.
- Easy/Normal/Hard/Nightmare, pause and 2× speed, original procedural music, atmosphere and combat effects, three audio sliders, local saves and autosaves. Audio starts after interaction and can be muted in Settings.
- Responsive touch controls, capped rendering resolution, visible-region rendering, a minimap, and one-file packaging.
- Connected wall/tower travel and cover, time-aware road routing, group-order fixes, cancelable resource coverage, Cleric healing and buffs, and a persistent Nightmare Keep reward.
- Provider-neutral platform interface. Ad/cloud/score adapters report unavailable until an actual platform integration is supplied.

## Scope

The broad original brief is preserved in docs/DESIGN-BRIEF.md and the requested overhaul in docs/OVERHAUL-OBJECTIVE.md. This game uses original local Canvas and Web Audio artwork. Optional ideas from the original brief, such as additional troop classes, experience ranks, random events, cinematics, cloud saves and advertising, are not claimed as implemented.

105 simulation tests, eight organic openings, established boss encounters, offline audio renders and desktop/touch browser suites support this update. Browser emulation and CPU throttling do not certify physical iOS/Android hardware. Automated balance probes also do not replace long-term player feedback.

## Source layout

- `src/data.js`: building, unit, enemy, and wave definitions.
- `src/world.js`: seeded grid, placement validation, routing.
- `src/game.js`: economy, simulation lifecycle and save compatibility.
- `src/construction.js`, `src/progression.js`: worker tasks, upgrades, training and research.
- `src/invasions.js`, `src/nightmare.js`, `src/combat.js`, `src/garrison.js`: fleets, demons, abilities, targeting and walls.
- `src/art.js`, `src/building-upgrades.js`, `src/unit-art.js`: cached overhead artwork and progression.
- `src/renderer.js`: textured terrain, mountains, camera, map and minimap rendering.
- `src/input.js`: pointer gestures, selection, commands, keyboard controls.
- `src/ui.js`: responsive command panels and dialogs.
- `src/save.js`: save and platform adapters.
- `src/audio.js`: original score, synthesized effects and persistent mixing controls.
- `src/main.js`: lifecycle and browser integration.
- `tests/game.test.mjs`: deterministic simulation regression tests.
- `tests/mountains.test.mjs`: 100-seed generation, movement, mining and save compatibility checks.
- `tools/browser-test.mjs`: Chromium mouse/touch and viewport smoke tests.
- `tools/design-test.mjs`: menu state, save failures, deposit inspection, orientation checks and deterministic visual fixtures.

To run browser tests, provide `PLAYWRIGHT_PATH` (installed Playwright package path) and `CHROME_PATH` (Chrome executable path), start the local server, then run `node tools/browser-test.mjs`. The script's defaults match the development workstation. Test hooks are available only on localhost with `?test`; they are absent on public hosts.

## CrazyGames upload

Run `npm run build:crazygames` for the dedicated SDK v3 upload ZIP at `dist/tidehold-crazygames.zip`. Kingdoms, unlocks, tutorial progress and settings use the CrazyGames Data module. Gameplay events and platform audio muting are integrated. Standard offline/GitHub Pages builds remain independent. See [the submission guide](docs/CRAZYGAMES.md) for portal settings, cover/video generation and final account-sync QA.
