# Gameplay overhaul — implementation and verification

The requested scope is preserved in [OVERHAUL-OBJECTIVE.md](OVERHAUL-OBJECTIVE.md). This ledger describes source behavior and local evidence. Publication and remote CI are checked separately against the GitHub branch.

| Requirement | Implementation and evidence |
| --- | --- |
| Rotation, connected walls/roads, drag placement | Quarter-turn saved orientation; connected cardinal artwork; atomic line costs/validation; desktop drag release and touch confirmation. Construction simulation and browser suites. |
| Automatic builders and persistent placement | Two workers per site; idle workers or gatherers between deliveries; previous jobs restored. Every building remains selected until cancellation. |
| Resource clearing | Building footprints can replace live resources and safely relocate occupants. Explicit clearing remains available to recover deposits before construction; inaccessible clearing waits. Collection and full-storage conservation tests. |
| Timed upgrades and E shortcut | Worker-built upgrades, saved progress, cancellation, delayed level benefits. All 18 building types have five illustrated levels; three Keep styles also progress. |
| Independent tower stats | Four range and damage upgrades; inspector exposes actual targeting range and damage; combat tests verify effects. |
| Timed training and technology | Per-building FIFO training, five queued orders, reserved housing, blocked exits, refunds and saves. Eleven Blacksmith technologies and seven Temple technologies across five branches, gated by building tier. |
| Islands and mountains | Hard/Nightmare: 96×72 ocean-surrounded islands. Easy/Normal: 64×48 north coast. Separate 100-seed suites verify mountains, protected starts, coastal access and mineral density. Legacy tiles are never regenerated. |
| Mining and mineral scarcity | Foothill rolls: 20% stone, 8% iron, 4% gold, 2,100 per deposit. Lowlands: 0.6%, 0.1%, 0.05%, 1,400; starting guarantees remain. Workers skip unreachable/depleted deposits. |
| Fleets and flight | Multiple coastal approaches, visible troops, shoreline breaches and departures. Flying enemies arrive directly from the sea. All airborne enemies reject melee; ranged units, Keep arrows and towers work. Landing restores melee vulnerability. |
| Wall garrisons | Two archers/crossbows per completed wall/gate, four per tower; connected platform travel and 55% cover reduction; reserved positions, physical approach, range bonus, dismounting, fall damage, save compatibility. |
| Wave pacing and AI | Mixed role compositions, stronger bosses, nearby threat responses, archer/Keep/rear/wall hunters; open passes used before breaching. Optional five-second auto wave. |
| Nightmare campaign | Conqueror death breaks the seal after wave 50; crimson world and coastal portals; all 12 regular demon roles, ArchDemon at 55 and Demon Lord at 60; campaign/endless transitions saved and tested. |
| Demon behaviors | Swarms, burning airborne archers, taunt, buffs, summons, wall jumping, siege, percentage defense and melee retaliation. Golem instant-wall damage does not leak into splash damage against other targets. |
| Additional boss abilities | Every pre-seal Nightmare milestone has an extra attack or reinforcement. ArchDemon adds dive/landing, guardian ward and flame cross. Demon Lord adds hurl, eruptions, ring of ruin, five-second rebirth and faster Keep assault. Ground effects and inspector explanations provide counterplay; attacks resolve automatically without warning popups. |
| Graphics and customization | Cached overhead roofs, canopies, units, ships, mineral seams, ridges and blended shores; kingdom name plus four Keeps with distinct perks (Demon Castle unlocks after Nightmare); unit/boss silhouettes and all upgrade atlases inspected. |
| Menus and responsive controls | Title, difficulty, pause, settings, help, categorized Build/Army trays, contextual inspectors, persistent placement, pinch zoom, group commands, rotation and keyboard shortcuts. Portrait sheets capped at 40dvh; short landscape side trays. |
| Sound | Original procedural peace/battle/boss/finale/demon music; ocean/atmosphere; 17 tested action and combat cues; independent sliders, mute, saved preferences, voice caps, rate limits and master limiting. Starts after user interaction; entirely offline. |
| Save and packaging | Existing version-1 saves preserve tiles. New queues, upgrades, garrisons, portals, warnings and boss phases persist. Failed title saves keep the game open. Single-file HTML has no network dependencies. |

The September 9 follow-up adds first-action peace, difficulty-specific supplies and pacing, a saved skippable beginner guide, synchronized Keep previews, minimap fleet arrows and five tiers of boss heraldry. See [USABILITY.md](USABILITY.md).

The walls and Temple expansion adds tier-gated research, mounted troop classes, Cleric healing/buffs, connected wall movement and cover, time-aware roads, deposit restoration, distinct Keep perks and a persistent Nightmare reward. See [EXPANSION.md](EXPANSION.md).

## Verification

- 105 passing Node simulation tests, including two independent sets of 100 fixed map seeds.
- Browser suites: browser-test, design-test, construction-test, island-test, nightmare-test, polish-test, battle-browser and release-test. Desktop, tablet, 390×844 and 320×568 phones, 844×390 landscape, orientation changes and emulated touch.
- Audio rendered through real OfflineAudioContext: five score moods and 17 cues emit bounded, non-silent signals; nodes release and duplicate events throttle. Browser settings persist and master mute reaches silence.
- Eight 700-second openings spend real starting resources and use real construction, gathering and training. All retain full Keep HP. Easy reaches wave 2, Normal wave 3, Hard wave 3, and Nightmare wave 4 under the new preparation timings; Easy/Normal lose no units.
- Established-kingdom encounters compare exposed armies with fortifications at Hard 10/30/50 and Nightmare 55/60. These are encounter fixtures, not an organic campaign completion claim. An expanded citadel defeats the Demon Lord through both phases; the smaller force loses.
- A deterministic 220-unit finale was checked against fresh routing for every query: 4,606 comparisons, zero mismatches. Local simulation p95 fell from roughly 9.2 ms to 2.6 ms after route caching and bounded nearest-land checks. These are workstation diagnostics, not hardware certification.
- A live browser siege remained interactive at desktop and emulated phone/landscape sizes, including 4× CPU throttling, save/load and orientation changes. See PLAYTEST.md for measured scope and limitations.

The final release audit also checks the freshly built offline HTML, updated documentation/screenshots, the published kv1 tree and remote Actions result. Physical iOS/Android certification and subjective long-term enjoyment cannot be inferred from these automated checks; player feedback remains valuable for future balance tuning.
