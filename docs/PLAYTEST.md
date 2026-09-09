# Tidehold play and balance checks

The overhaul tests both isolated rules and strategy outcomes. Scripts and fixed seeds make failures reproducible. No test inserts resources or buildings into a real new kingdom.

## Opening economy

Run `node tools/playtest.mjs --openings`. Six runs cover seeds 42 and 707 on Normal, Hard and Nightmare, each for 700 simulation seconds. The policy spends the actual starting reserve, places sites through normal validation, lets workers build and gather, queues recruitment, adds housing and sends defenders toward threats. It builds lumber, food and stone production before military infrastructure.

All six runs establish the economy and reach wave 4 with the Keep intact. The Normal runs finish four waves, with 15 and 17 losses replenished through paid training. Larger islands introduce longer, multiple approaches; Hard and Nightmare are still fighting wave 4 at the checkpoint. This checks a viable opening, not optimal play.

## Boss encounters

Run `node tools/playtest.mjs --encounters`. The established-kingdom fixture intentionally uses flat terrain, a known army, housing, upgrades and defenses. It isolates combat decisions from economic buildup and random terrain. A separate reactive policy attempts to leave warned attack zones; gates preserve escape routes.

Hard waves 10, 30 and 50 demonstrate that walls, tower investment and positioning outperform an exposed army. Nightmare wave 55 requires heavier preparation and loses substantial troops. A 140-unit force can fail against the Demon Lord even with fortifications. A larger 220-unit citadel with upgraded ballistas survives both phases, taking Keep damage and losing many defenders. The final boss is beatable without altering his HP or bypassing his healing transition.

These runs do not prove a fully organic 60-wave campaign or that every play style is equally viable. The strategy policy is deliberately simple. Difficulty, warning timings, army losses and resource pacing should continue to be reviewed with player feedback.

## Browser and performance evidence

Run `node tools/playtest.mjs --finale` to create the battle snapshots, then `node tools/battle-browser.mjs`. This restores a real encounter checkpoint and advances the normal browser loop with roughly 200 surviving defenders, enemy reinforcements and 80 structures. It checks desktop, portrait and landscape, then saves and reloads wave 60.

A development run produced about 60 frames/sec on desktop, 32 on portrait and 51 on landscape with 4× Chromium CPU throttling for the touch layouts. Emulation is useful stress coverage but is not equivalent to measured phone hardware. Timings depend on workstation load and browser scheduling.

The routing comparison checks cached results against an uncached search at every query, including destruction within a combat frame. The 148-second finale produced 4,606 identical route results and the same victory, kills, casualties and Keep HP. Avoiding distant occupancy checks during summoning reduced large spikes. Raw local results are stored under ignored artifacts/playtest and artifacts/battle.

## Reproduce the release checks

`npm test` and `npm run build` require Node 20+. With `npm start` running, execute the browser scripts listed in OVERHAUL-STATUS.md. Supply PLAYWRIGHT_PATH and CHROME_PATH for a different workstation. The release suite opens the bundled HTML with networking disabled.
