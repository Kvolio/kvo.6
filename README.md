# Tidehold — The Last Coast

A dependency-free HTML5 kingdom survival game for **desktop and touch screens**, built for [Kvolio/kvo.6](https://github.com/Kvolio/kvo.6).

Start with one Keep, five workers, and a small resource reserve. Build an economy, recruit defenders, fortify your coast, and survive a 50-wave campaign. The project is a playable first implementation of the design brief, not a finished commercial release.

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
| Cancel building | Escape, right click, or ✕ | ✕ |
| Pause / speed | Space or on-screen buttons | On-screen buttons |

Touch camera gestures do not place buildings or issue orders. The layout supports portrait and landscape without requiring fullscreen or orientation lock. Scroll the command panel if necessary; on portrait phones, swipe the building cards sideways.

## First steps

1. Place a Lumber Camp near trees and a Farm near the Keep. Two idle workers automatically build each and remain assigned to production.
2. Build a House and train additional workers at the Keep. Assign them to production sites or leave some idle for construction and repairs.
3. Establish a Quarry. Build a Barracks or Archery Range and recruit defenders. Towers attack automatically.
4. Fortify approaches with walls and leave gates for friendly units. Enemies route around obstacles or attack a blocking structure when enclosed.
5. Upgrade the Keep for iron/gold mines, advanced troops, and ballista towers. Blacksmith research improves weapons and armor.

Buildings do not generate resources without workers. Workers gather, carry resources, and drop them at the Keep or a Warehouse. Food is consumed slowly by the population; at zero food, friendly movement slows. Pause remains available while planning and building.

## Implemented

- Seeded coastal terrain and resource deposits; no starting village.
- Grid placement, validity previews, construction, worker assignment, capacity, food upkeep, storage, repair, demolition refunds, and upgrades.
- Six recruitable unit types, selection/group orders, hold/defend/attack move/patrol, gates, roads, towers, and grid pathfinding.
- Ship arrivals, varied enemy compositions, multiple landing areas, 50 waves, ten boss milestones, dragon → Conqueror phase transition, victory/defeat, and endless continuation.
- Normal/easy/hard settings, pause and 2× speed, optional synthesized cues, local saves, autosaves, and sound preference persistence.
- Responsive touch controls, capped rendering resolution, visible-region rendering, a minimap, and one-file packaging.
- Provider-neutral platform interface. Ad/cloud/score adapters report unavailable until an actual platform integration is supplied.

## Scope and remaining work

The broad design brief is preserved in `docs/DESIGN-BRIEF.md`. This release uses original procedural canvas artwork and simplified boss abilities. It does **not** yet implement the full proposed soundtrack, every suggested troop/building, formation tactics, experience ranks, random events, elaborate destruction cinematics, cloud saves, or advertising.

All 50 wave definitions and the final phase transition are tested, but a complete human-played 50-wave balance pass remains necessary. Real iOS Safari and Android hardware testing and endgame performance certification remain release gates. Browser touch emulation does not substitute for physical-device validation.

## Source layout

- `src/data.js`: building, unit, enemy, and wave definitions.
- `src/world.js`: seeded grid, placement validation, routing.
- `src/game.js`: economy, construction, units, combat, waves, progression.
- `src/renderer.js`: procedural artwork, camera, map and minimap rendering.
- `src/input.js`: pointer gestures, selection, commands, keyboard controls.
- `src/ui.js`: responsive command panels and dialogs.
- `src/save.js`: save, audio and platform adapters.
- `src/main.js`: lifecycle and browser integration.
- `tests/game.test.mjs`: deterministic simulation regression tests.
- `tools/browser-test.mjs`: Chromium mouse/touch and viewport smoke tests.

To run browser tests, provide `PLAYWRIGHT_PATH` (installed Playwright package path) and `CHROME_PATH` (Chrome executable path), start the local server, then run `node tools/browser-test.mjs`. The script's defaults match the development workstation. Test hooks are available only on localhost with `?test`; they are absent on public hosts.
