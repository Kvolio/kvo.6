# HTML5 Kingdom Survival City Builder

Create a polished, replayable **top-down 2D medieval/fantasy city-builder, survival, RTS, and wave-defense game** designed to run in a web browser and eventually be published on HTML5 game platforms for monetization.

The game should ultimately be capable of being packaged into a browser-compatible HTML5 build. The final distributable version should ideally be bundleable into a single `index.html`, although during development the code should remain modular and maintainable.

The core fantasy is:

> The player begins with nothing except a small Keep, a few workers, and a limited supply of basic resources. From that starting point, they must personally construct an entire kingdom, develop its economy, recruit an army, build fortifications, and survive 50 increasingly dangerous invasion waves arriving from the sea.

The player must build **everything** themselves.

There must NOT already be a village, barracks, farms, walls, towers, roads, or other functional buildings at the start.

---

# 1. CORE GAME LOOP

The basic gameplay cycle should be:

1. Gather resources.
2. Construct buildings.
3. Assign workers.
4. Expand the settlement.
5. Produce food and materials.
6. Recruit military units.
7. Build walls, gates, and towers.
8. Upgrade the kingdom.
9. Prepare for the next invasion.
10. Defend against the invasion.
11. Repair and rebuild.
12. Expand further.
13. Repeat until Wave 50.

The experience should combine:

* city building
* resource management
* worker management
* RTS unit control
* base defense
* tower defense
* survival
* army building
* progression
* increasingly large enemy invasions

The player's kingdom should visually grow from:

**Keep → tiny settlement → village → fortified town → major city → enormous defensive kingdom**

---

# 2. STARTING CONDITIONS

At the beginning of a new game, the player starts with ONLY:

* 1 Keep
* approximately 4–6 workers
* a small supply of wood
* a small supply of stone
* a small amount of food
* a small amount of gold

Exact values should be balanced through testing.

Example starting resources:

* 250 Wood
* 150 Stone
* 150 Food
* 100 Gold
* 0 Iron

These numbers are examples, not permanent balance requirements.

There should be natural resources around the map such as:

* forests
* stone deposits
* iron deposits
* fertile land
* possibly gold deposits

The player must construct the infrastructure necessary to exploit these resources.

There should be **no prebuilt resource buildings**.

---

# 3. THE KEEP

The Keep is the heart of the kingdom.

If the Keep is destroyed:

# GAME OVER

The Keep should:

* have substantial HP
* store a limited amount of resources
* serve as the initial worker drop-off point
* provide a small starting population capacity
* unlock kingdom upgrades
* be upgradeable
* visually become more impressive when upgraded

Possible levels:

### Keep Level I

Small fortified keep.

### Keep Level II

Stone castle.

### Keep Level III

Large fortress.

### Keep Level IV

Royal citadel.

### Keep Level V

Massive endgame castle.

Upgrading the Keep should unlock more advanced structures and units.

---

# 4. GRID-BASED BUILDING

Use a top-down grid system.

Buildings should occupy physical tiles.

Example tile size:

* 32×32
  or
* 48×48

Choose whichever provides the best balance between visual detail and performance.

When placing a structure:

* show transparent building preview
* green = valid placement
* red = invalid placement
* display resource cost
* allow rotation where appropriate
* prevent overlapping structures
* prevent construction on deep water
* account for terrain
* allow cancellation before completion

Workers should physically construct buildings instead of structures instantly appearing.

Construction should take time.

Multiple workers assigned to construction should increase build speed.

---

# 5. WORKER SYSTEM

Workers should be one of the most important resources in the game.

Workers can:

* chop trees
* harvest stone
* mine iron
* gather food
* construct buildings
* repair buildings
* transport resources
* potentially fight as weak militia during emergencies

Workers should physically move around the kingdom.

They should not simply represent invisible resource-generation numbers.

The player should be able to select workers and assign jobs.

Examples:

* select worker
* click tree
* worker chops wood

or:

* build Lumber Camp
* assign 4 workers
* workers gather nearby trees

Worker efficiency can later be improved through upgrades.

---

# 6. POPULATION

Population should be limited by housing.

The Keep provides only a small initial population capacity.

The player must construct houses to increase capacity.

For example:

Keep:

+8 population capacity

House:

+5 population

Large House:

+10 population

Manor:

+20 population

Both civilian workers and soldiers consume population capacity.

This creates meaningful decisions between:

* economic growth
* army size

---

# 7. RESOURCE SYSTEM

Use a manageable but meaningful economy.

Primary resources:

## Wood

Used for:

* houses
* farms
* palisades
* towers
* early military structures
* weapons
* siege structures

## Stone

Used for:

* stone walls
* towers
* upgraded buildings
* Keep upgrades
* fortifications

## Food

Required for:

* workers
* soldiers
* population growth
* recruitment

## Iron

Required for:

* armored units
* advanced weapons
* gates
* upgrades
* elite soldiers

## Gold

Used for:

* advanced units
* research
* specialized buildings
* upgrades
* merchants
* elite troops

Resources should not automatically appear.

The player needs the proper infrastructure and workforce.

---

# 8. RESOURCE BUILDINGS

Possible structures:

## Lumber Camp

Allows nearby forests to be efficiently harvested.

## Quarry

Extracts stone.

## Iron Mine

Extracts iron from ore deposits.

## Gold Mine

Extracts gold from rare deposits.

## Farm

Produces food over time.

## Mill

Improves nearby farms.

## Granary

Increases food storage.

## Warehouse

Increases general resource capacity.

Resource placement should matter.

A lumber camp surrounded by forest should be more useful than one far away from trees.

---

# 9. PLAYER-BUILT KINGDOM

A fundamental rule:

# THE PLAYER BUILDS EVERYTHING.

Other than the Keep, nothing useful should exist at the beginning.

The player personally determines:

* where houses go
* where farms go
* where roads go
* where walls go
* where towers go
* where barracks go
* where workshops go
* where defenses concentrate
* where gates are placed
* where the economy develops
* where soldiers are stationed

Do not automatically generate a town around the player.

The kingdom's layout should be completely player-created.

---

# 10. ROADS

Consider adding roads.

Roads should:

* be inexpensive
* increase worker movement speed
* increase military movement speed
* help organize settlements

Possible progression:

Dirt Path

→ Stone Road

→ Royal Road

Roads should not be mandatory for movement but should provide useful bonuses.

---

# 11. MILITARY BUILDINGS

The player must construct the appropriate buildings before recruiting troops.

## Barracks

Unlocks:

* militia
* spearmen
* swordsmen

## Archery Range

Unlocks:

* archers
* crossbowmen

## Stable

Unlocks:

* scouts
* cavalry
* knights

## Blacksmith

Allows weapon and armor upgrades.

## Workshop

Allows:

* ballistae
* siege equipment
* specialized defenses

## Mage Tower

Optional fantasy progression.

Could unlock magical defenders much later if magic fits the intended game direction.

Do not let fantasy elements completely replace conventional medieval defenses.

---

# 12. MILITARY UNITS

Possible player units:

### Militia

Very cheap.

Weak.

Fast recruitment.

Useful for emergencies.

### Spearman

Strong defensive infantry.

Good against large enemies and cavalry.

### Swordsman

General-purpose infantry.

### Shield Guard

High defense.

Excellent at holding gates.

### Archer

Long-range ranged unit.

### Crossbowman

Slower attack speed but stronger armor penetration.

### Scout Cavalry

Fast.

Useful for reacting to landings.

### Knight

Expensive elite cavalry.

### Royal Guard

Late-game elite infantry.

### Longbowman

Late-game ranged specialist.

Units should have:

* HP
* damage
* armor
* attack range
* movement speed
* attack speed
* unit type
* targeting logic

Avoid inflated damage numbers.

Combat should remain readable.

---

# 13. RTS CONTROLS

The player should be able to control military units.

Support:

* click unit
* drag-selection box
* multi-select
* move command
* attack command
* patrol
* hold position
* attack move
* defensive stance

Potential formation options later:

* line
* block
* loose formation

Controls should feel responsive.

---

# 14. DEFENSIVE CONSTRUCTION

Defense must be a major part of the city builder.

Allow the player to build:

## Wooden Palisade

Cheap early-game wall.

## Stone Wall

Stronger midgame fortification.

## Reinforced Wall

Late-game wall.

## Gate

Allows friendly movement through walls.

Enemies should attempt to destroy gates if strategically useful.

## Archer Tower

Automatically attacks enemies.

## Ballista Tower

Slow firing but high damage.

Strong against large enemies.

## Guard Tower

Balanced defense.

## Cannon Tower

Potential late-game structure if gunpowder is included.

## Moat

Potential advanced defensive structure.

Can slow enemies.

---

# 15. WALL MECHANICS

Walls must physically affect enemy pathfinding.

Enemies should never simply walk through walls.

Enemies should:

1. Find an open path toward the Keep.
2. Prefer reasonable paths.
3. Attack gates.
4. Attack walls if there is no accessible route.
5. Target strategically useful weak points.

Use grid-based A* pathfinding or an equivalent efficient algorithm.

When the player modifies walls, pathfinding must update.

Avoid pathfinding exploits.

For example:

If the player completely surrounds the Keep with walls, enemies should attack the walls instead of becoming confused.

---

# 16. ENEMY INVASION SYSTEM

Enemies arrive primarily from the sea.

Ships should appear offshore.

They travel toward beaches or landing locations.

Troops then disembark and attack.

Potential sequence:

Enemy fleet appears.

↓

Ships approach coastline.

↓

Landing craft or ships reach beaches.

↓

Enemy troops deploy.

↓

Army forms.

↓

Enemy attacks kingdom.

This should visually communicate that the kingdom is being invaded rather than enemies simply spawning at map edges.

---

# 17. MULTIPLE LANDING AREAS

Early waves should primarily attack from one location.

Later waves should become less predictable.

Possible progression:

### Early Game

1 landing zone.

### Mid Game

2 landing zones.

### Late Game

2–3 simultaneous landing zones.

### Endgame

Massive invasion from several directions.

This prevents the player from building one giant defense line and ignoring the rest of the map.

---

# 18. ENEMY TYPES

Introduce enemies gradually.

Possible enemy roster:

## Raider

Basic enemy.

## Barbarian

Stronger melee unit.

## Archer

Enemy ranged unit.

## Berserker

High damage and speed.

## Shield Warrior

High defense.

## Raider Captain

Buffs nearby units.

## Wolf Rider

Fast attacking unit.

## Ogre

Large, slow enemy.

Very effective against structures.

## Armored Ogre

More dangerous ogre variant.

## Siege Ram

Strong against gates.

## Catapult

Attacks structures from range.

## Siege Tower

Helps assault walls.

## War Beast

Large creature used in late waves.

## Elite Guard

High-level enemy infantry.

## Dragon Rider

Possible extremely late-game elite enemy.

Enemy variety should increase as waves progress.

---

# 19. 50-WAVE CAMPAIGN

The campaign contains exactly:

# 50 MAIN WAVES

Difficulty should scale throughout the campaign.

Enemies should not simply gain HP every wave.

Difficulty should increase through:

* larger armies
* stronger enemy types
* additional landing zones
* improved enemy compositions
* siege weapons
* faster attacks
* elite enemies
* coordinated attacks
* bosses
* minibosses

---

# 20. WAVE STRUCTURE

There should be normal waves, miniboss waves, and major boss waves.

Major bosses:

* Wave 10
* Wave 20
* Wave 30
* Wave 40
* Wave 50

Minibosses:

* Wave 5
* Wave 15
* Wave 25
* Wave 35
* Wave 45

Therefore:

### Wave 5

Miniboss

### Wave 10

Major Boss

### Wave 15

Miniboss

### Wave 20

Major Boss

### Wave 25

Miniboss

### Wave 30

Major Boss

### Wave 35

Miniboss

### Wave 40

Major Boss

### Wave 45

Miniboss

### Wave 50

FINAL BOSS

---

# 21. MINIBOSSES

Minibosses should be dangerous but substantially weaker than major bosses.

Suggested progression:

## Wave 5 — Raider Captain

An elite raider commander.

Abilities:

* buffs nearby raiders
* charges defenders
* increased health
* stronger attack

## Wave 15 — Ogre Brute

Large early ogre.

Abilities:

* smashes wooden walls
* knockback attack
* high structure damage

## Wave 25 — Stone Giant

Smaller relative of the Titan.

Abilities:

* throws rocks
* damages groups
* attacks walls

## Wave 35 — Black Knight

Elite enemy commander.

Abilities:

* heavy armor
* shield
* buffs nearby soldiers
* powerful charge

## Wave 45 — Dragon Knight

Elite late-game miniboss.

Could arrive riding a smaller wyvern before fighting on foot.

Abilities:

* aerial attack
* fire attack
* elite melee combat

These names and mechanics can be modified during balancing, but the miniboss structure must remain.

---

# 22. WAVE 10 BOSS — BARBARIAN CHIEF

Wave 10's boss is:

# THE BARBARIAN CHIEF

The Barbarian Chief should arrive with a large barbarian raiding force.

Appearance:

* massive warrior
* heavy fur armor
* large axe
* distinctive helmet
* visually larger than standard barbarians

Abilities:

### War Cry

Buffs nearby barbarians.

### Heavy Axe Swing

Wide melee attack.

### Gate Breaker

Deals increased structure damage.

### Charge

Rushes toward defenders or defensive positions.

This should be the player's first major test.

The Barbarian Chief encourages the player to have:

* proper walls
* trained soldiers
* archers
* multiple layers of defense

---

# 23. WAVE 20 BOSS — OGRE CHAMPION

Wave 20's boss is:

# THE OGRE CHAMPION

The Ogre Champion is a massive armored ogre.

He should be much larger than normal soldiers.

Appearance:

* enormous muscular ogre
* heavy armor
* huge weapon
* scars/trophies
* intimidating silhouette

Abilities:

### Ground Slam

Creates an area-of-effect shockwave.

### Wall Crusher

Deals enormous structure damage.

### Boulder Throw

Throws a large projectile at defensive structures.

### Rage

At low HP, attack speed and movement speed increase.

The Ogre Champion should force players to construct significantly stronger defenses than what was sufficient against the Barbarian Chief.

---

# 24. WAVE 30 BOSS — TITAN

Wave 30's boss is:

# THE TITAN

The Titan should be enormous.

It should visually dwarf:

* workers
* soldiers
* houses
* towers

The Titan is essentially a walking siege engine.

Abilities:

### Titan Step

Damages units near its feet.

### Earthquake Slam

Creates a large shockwave.

### Boulder Throw

Attacks towers or walls from range.

### Siege Strike

Massive damage against structures.

### Roar

Briefly disrupts nearby troops.

The Titan should force the player to use:

* layered defenses
* concentrated ranged fire
* elite soldiers
* strong walls
* specialized anti-large defenses

---

# 25. WAVE 40 BOSS — WARLORD

Wave 40's boss is:

# THE WARLORD

Unlike the Ogre Champion and Titan, the Warlord's greatest strength should be his ability to command an enormous organized army.

The Warlord should arrive with:

* elite infantry
* archers
* cavalry
* siege engines
* potentially monsters

Abilities:

### Command

Buffs nearby units.

### Reinforcements

Calls additional troops.

### Battle Formation

Nearby enemies gain defensive bonuses.

### Duelist

Extremely powerful melee combatant.

### Tactical Assault

Periodically redirects enemy groups toward weaker defenses.

The Warlord should feel like the first enemy who is strategically attacking the player's kingdom rather than simply attempting to overpower it.

---

# 26. WAVE 50 FINAL BOSS — THE CONQUEROR

Wave 50 is the ultimate battle.

The final boss is:

# THE CONQUEROR

The Conqueror arrives riding a:

# MASSIVE BLACK DRAGON

This boss battle must have:

# TWO DISTINCT PHASES.

It should feel dramatically larger than every previous battle.

---

# 27. FINAL BOSS PHASE 1 — THE BLACK DRAGON

During Phase 1, the Conqueror remains mounted on the massive Black Dragon.

The dragon should be visually enormous.

It flies over the battlefield.

Possible abilities:

### Fire Breath

Sweeps flames across:

* soldiers
* walls
* towers
* buildings

### Fireball

Launches massive projectiles at defensive structures.

### Wing Blast

Pushes units backward.

### Dive Bomb

Dragon dives toward a target and causes large area damage.

### Terror Roar

Temporarily reduces friendly soldier effectiveness.

### Building Attack

The dragon specifically targets strategically important structures.

Possible targets:

* towers
* barracks
* gates
* military formations

The player must use ranged defenses to damage the dragon.

Potential anti-dragon defenses:

* archers
* crossbowmen
* ballista towers
* specialized anti-air ballistae
* elite longbowmen

When the dragon's HP reaches zero:

Do NOT immediately end the fight.

Trigger a major transition.

---

# 28. PHASE TRANSITION

The Black Dragon crashes onto the battlefield.

Create:

* screen shake
* impact effects
* dust
* debris
* fire
* large crash animation

The Conqueror survives.

He dismounts.

Phase 2 begins.

---

# 29. FINAL BOSS PHASE 2 — THE CONQUEROR

The Conqueror fights on foot.

He should be the strongest humanoid enemy in the game.

Appearance:

* dark royal armor
* enormous weapon
* cape
* dragon-themed armor
* intimidating animations

Abilities:

### Conqueror's Strike

Massive melee attack.

### Dark Charge

Charges through groups of soldiers.

### Rally the Legion

Buffs remaining enemy forces.

### Execute

Powerful attack against individual elite units.

### Dragonfire Blade

Weapon becomes engulfed in fire.

### Last Stand

At low HP, gains increased attack speed and damage.

The final portion of the fight should create an intense last defense around the player's Keep.

---

# 30. WAVE 50 INVASION SCALE

Wave 50 should not consist only of the boss.

It should begin as the largest invasion in the campaign.

Potential structure:

## Stage 1

Large invasion fleet appears.

## Stage 2

Multiple landing armies arrive.

## Stage 3

Elite units and siege weapons attack.

## Stage 4

The Conquerer appears riding the Black Dragon.

## Stage 5

Dragon boss Phase 1.

## Stage 6

Dragon crashes.

## Stage 7

Conquerer boss Phase 2.

## Stage 8

Victory.

The player's entire kingdom should feel like it is under siege.

---

# 31. BOSS HEALTH BARS

Bosses should receive large dedicated boss-health UI.

Example:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

              THE TITAN

██████████████████████████████████

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

For Wave 50:

```text
THE CONQUERER
BLACK DRAGON — PHASE I
```

Then:

```text
THE CONQUERER
PHASE II
```

---

# 32. WAVE PREPARATION

After completing a wave, provide preparation time.

The player can:

* repair walls
* rebuild destroyed structures
* gather resources
* recruit troops
* reposition defenses
* expand the city
* upgrade structures

Show:

```text
NEXT INVASION
01:46
```

Provide:

**START WAVE EARLY**

Starting early could provide a small reward such as bonus gold.

Do not force long waits if the player is ready.

---

# 33. REPAIR SYSTEM

Buildings should remain damaged after attacks.

Workers must repair them.

Repairs cost:

* wood
* stone
* possibly iron

depending on the building.

Repairing should be cheaper than rebuilding a destroyed structure.

Allow:

* manually repair structure
* repair priority
* optional auto-repair toggle later

---

# 34. BUILDING DESTRUCTION

Buildings should visibly react to damage.

Possible visual states:

100–70%:

Normal

70–40%:

Visible cracks

40–15%:

Heavy damage

Below 15%:

Severe damage/smoke

Destroyed:

Rubble

Destroyed structures should leave rubble temporarily.

Workers can clear rubble.

---

# 35. TECHNOLOGY AND UPGRADES

Create an upgrade system.

Examples:

## Economy

* faster wood gathering
* faster mining
* increased farm production
* worker carrying capacity
* storage improvements

## Military

* stronger swords
* improved bows
* improved armor
* increased ranged damage
* increased unit HP

## Fortifications

* stronger walls
* stronger towers
* faster repairs
* stronger gates
* increased tower range

## Kingdom

* increased population
* faster construction
* Keep improvements
* improved roads

Do not make upgrades overwhelmingly complicated.

---

# 36. KINGDOM ERAS

Progression can be visually separated into five stages.

## Stage I — Settlement

Waves 1–10

Primarily:

* wood
* farms
* militia
* palisades

## Stage II — Village

Waves 11–20

Unlock:

* stronger soldiers
* stone construction
* additional defenses

## Stage III — Town

Waves 21–30

Unlock:

* advanced military units
* stronger towers
* workshops
* specialized defenses

## Stage IV — City

Waves 31–40

Unlock:

* elite troops
* advanced fortifications
* major upgrades

## Stage V — Kingdom

Waves 41–50

Unlock:

* strongest units
* strongest walls
* anti-dragon defenses
* royal upgrades

Do not automatically upgrade the player when reaching these waves.

The player still has to purchase and build their improvements.

---

# 37. ENEMY AI

Enemy behavior should depend on unit type.

Infantry:

* advance toward settlement
* attack defenders
* attack walls when blocked

Archers:

* maintain range
* target troops/towers

Siege units:

* prioritize walls
* gates
* towers
* Keep

Fast enemies:

* attempt flanking routes

Large monsters:

* focus on structural destruction

Commanders:

* support nearby armies

Enemies should not behave like one large blob with identical AI.

---

# 38. PERFORMANCE

This is an HTML5/browser game, so performance is extremely important.

Target:

* smooth gameplay on average laptops
* reasonable mobile compatibility later
* approximately 60 FPS when possible

There may eventually be:

* hundreds of enemies
* hundreds of projectiles
* many buildings
* workers
* soldiers
* effects

Optimize accordingly.

Use:

* object pooling
* efficient spatial queries
* sprite batching
* efficient pathfinding
* limited AI updates
* delta-time movement
* requestAnimationFrame
* chunk/grid-based world queries

Avoid performing expensive full-map checks every frame.

---

# 39. VISUAL STYLE

Use attractive top-down 2D graphics.

Do NOT make the game look like a debug prototype.

Even placeholder assets should be coherent and polished.

Prioritize:

* detailed terrain
* clear buildings
* readable units
* animations
* shadows
* particles
* impact effects
* arrows
* fire
* smoke
* explosions where appropriate
* water animation
* ship animations
* construction animations
* destruction effects

Buildings should visually improve after upgrades.

The player's settlement should look noticeably more impressive as the game progresses.

---

# 40. WATER

The ocean should feel alive.

Use:

* animated water
* waves
* foam near beaches
* ship wakes
* landing animations

Enemy ships approaching should be clearly visible.

Late-game invasion fleets should create an intimidating visual spectacle.

---

# 41. CAMERA

Support:

* mouse wheel zoom
* camera dragging
* WASD movement
* edge scrolling if useful

Include reasonable zoom limits.

The player should be able to:

* zoom close enough to watch combat
* zoom far enough to manage the kingdom

---

# 42. USER INTERFACE

Create a clean medieval/fantasy UI.

Top resource bar:

```text
WOOD   STONE   FOOD   IRON   GOLD   POPULATION
```

Example:

```text
Wood 482
Stone 311
Food 709
Iron 145
Gold 890
Population 46/60
```

Bottom build menu could contain categories:

```text
ECONOMY
HOUSING
MILITARY
DEFENSE
INFRASTRUCTURE
```

---

# 43. BUILDING INFORMATION

Selecting a building should display:

* name
* HP
* workers
* production
* upgrades
* repair option
* demolition option

Example:

```text
IRON MINE

HP: 720 / 800
Workers: 4 / 6
Production: 18 Iron/min

[ASSIGN WORKER]
[REMOVE WORKER]
[UPGRADE]
[REPAIR]
```

---

# 44. UNIT INFORMATION

Selecting a soldier should show:

* unit name
* HP
* armor
* damage
* movement speed
* rank
* kills

Potentially allow units to gain experience.

Example:

```text
ROYAL GUARD

HP: 185/200
Armor: 42
Damage: 31
Kills: 17
Rank: Veteran
```

---

# 45. UNIT EXPERIENCE

Consider allowing surviving soldiers to gain experience.

Ranks:

Recruit

→ Trained

→ Veteran

→ Elite

Veteran soldiers should become valuable.

This creates emotional attachment to surviving troops.

Do not make the bonus excessive.

---

# 46. PAUSE SYSTEM

Allow:

* pause
* 1× speed
* 2× speed

Potentially:

* 3× speed outside battle

The player should be able to pause while placing buildings and planning.

---

# 47. SAVE SYSTEM

Use browser local storage.

Allow:

* save game
* continue game
* autosave
* settings persistence

Autosave:

* after waves
* periodically
* after major events

Avoid losing long runs because the browser closes.

---

# 48. DIFFICULTY

Eventually include:

## Easy

More resources.

Weaker invasions.

## Normal

Intended experience.

## Hard

Fewer resources and stronger enemies.

## Nightmare

Extremely difficult.

Do not balance Nightmare until the core game works.

---

# 49. ENDLESS MODE

After completing the 50-wave campaign, unlock:

# ENDLESS MODE

Enemies continue indefinitely.

Possible progression:

Wave 51

Wave 52

Wave 53

etc.

Enemy strength continues scaling.

Occasionally repeat or modify previous bosses.

Endless mode should primarily exist for score chasing.

---

# 50. SCORING

Track:

* highest wave
* enemies killed
* bosses killed
* workers lost
* soldiers lost
* buildings destroyed
* resources gathered
* resources spent
* kingdom population
* completion time
* Keep damage

Calculate a final score.

Example:

```text
KINGDOM VICTORIOUS

Waves Survived: 50/50

Enemies Defeated: 4,283
Bosses Defeated: 5
Minibosses Defeated: 5
Population: 227
Structures Built: 142

Final Score:

238,420
```

---

# 51. VICTORY

After defeating the Conquerer:

* remaining enemies retreat
* surviving enemy ships leave
* victory music plays
* soldiers celebrate
* banners appear
* camera slowly shows the kingdom

Display:

# THE KINGDOM HAS SURVIVED

Then show statistics.

Unlock:

* Endless Mode
* harder difficulty
* optional cosmetic reward

---

# 52. RANDOM MAPS

Eventually support procedural or semi-procedural maps.

Maps can contain:

* coastline
* beaches
* forests
* mountains
* rivers
* stone
* iron
* gold
* fertile land

The Keep should begin reasonably inland.

The terrain should create natural defensive opportunities but never guarantee an easy layout.

---

# 53. REPLAYABILITY

No two games should play exactly the same.

Replayability can come from:

* different terrain
* resource locations
* landing zones
* enemy compositions
* randomized events
* difficulty settings
* player-created city layouts
* different technology choices

---

# 54. RANDOM EVENTS

Consider adding occasional events between waves.

Examples:

### Refugees

Accept new villagers in exchange for food.

### Traveling Merchant

Buy scarce resources.

### Skilled Blacksmith

Temporary or permanent military upgrade.

### Good Harvest

Bonus food.

### Mine Collapse

Temporarily disables a mine.

### Bandits

Small land attack outside the normal wave system.

### Royal Volunteers

Receive several free soldiers.

Keep these events simple and readable.

---

# 55. SOUND

Include:

* construction sounds
* chopping
* mining
* swords
* arrows
* gates opening
* walls breaking
* battle cries
* monster sounds
* ocean waves
* ships
* dragon roar
* boss music

Boss waves should have distinctive music.

Wave 50 should have its own dramatic soundtrack.

---

# 56. MOBILE SUPPORT

Although desktop should be the initial priority, architecture should allow later mobile support.

Potential controls:

* tap selection
* drag selection
* pinch zoom
* two-finger camera pan
* touch-friendly build menu

Do not compromise desktop controls to achieve mobile support prematurely.

---

# 57. MONETIZATION-FRIENDLY DESIGN

The game is intended for HTML5 gaming websites.

Keep the core game fully enjoyable without requiring purchases.

Architecture should allow integration with platform APIs later for:

* rewarded advertisements
* interstitial advertisements
* achievements
* high scores
* cloud saves

Never hard-code a specific advertising provider into the gameplay architecture.

Create abstract hooks such as:

```javascript
GamePlatform.showRewardedAd()
GamePlatform.showInterstitial()
GamePlatform.submitScore()
GamePlatform.saveProgress()
```

These can later be connected to the target website's SDK.

---

# 58. CODE ARCHITECTURE

Do not write the entire game as one massive script.

Create clean systems such as:

```text
Game
World
Grid
Camera
InputManager
ResourceManager
WorkerManager
BuildingManager
UnitManager
EnemyManager
WaveManager
BossManager
PathfindingManager
CombatManager
ProjectileManager
EffectManager
AudioManager
SaveManager
UIManager
PlatformManager
```

Use modular JavaScript.

Final builds can later be bundled into one HTML file.

---

# 59. DATA-DRIVEN CONTENT

Units, structures, waves, upgrades, and enemies should use configuration objects rather than hundreds of hard-coded conditions.

Example:

```javascript
const UNIT_TYPES = {
    swordsman: {
        hp: 120,
        damage: 18,
        armor: 12,
        speed: 75,
        cost: {
            food: 50,
            iron: 20,
            gold: 10
        }
    }
};
```

Do the same for buildings and enemies.

This will make balancing far easier.

---

# 60. WAVE DATA

Wave design should also be data-driven.

Example concept:

```javascript
{
    wave: 10,
    boss: "barbarian_chief",
    enemies: {
        barbarian: 40,
        archer: 15,
        berserker: 8
    }
}
```

Wave 50 should contain its custom multi-stage logic.

---

# 61. BALANCING PRINCIPLE

Do NOT use ridiculous HP inflation as the main difficulty mechanic.

Example of bad scaling:

Wave 1 Enemy:

100 HP

Wave 50 Enemy:

100,000 HP

Instead use:

* stronger enemy classes
* better armor
* more enemies
* better army compositions
* siege weapons
* multiple attack directions
* bosses
* intelligent targeting

The player's kingdom should become more powerful while enemy armies become strategically more dangerous.

---

# 62. IMPORTANT DESIGN PRINCIPLES

The game must follow these principles:

### Player freedom

The player designs the kingdom.

### Visible progression

The kingdom visibly grows.

### Meaningful economy

Resources and workers matter.

### Preparation matters

Good planning should outperform mindless unit spam.

### Walls matter

Fortifications must genuinely affect combat.

### Army positioning matters

Troop placement should matter.

### Bosses feel unique

Each boss requires different defensive preparation.

### Losses matter

Destroyed structures and veteran soldiers should have consequences.

### Replayability matters

Different kingdom layouts should result in different strategies.

---

# 63. MOST IMPORTANT REQUIREMENT

Never lose sight of the main fantasy:

> The player starts with a lonely Keep, a handful of workers, and almost nothing else.

Everything visible by the end of the campaign should exist largely because the player built it.

By Wave 50, the player should be able to look at a gigantic fortified city filled with:

* houses
* farms
* mines
* workshops
* barracks
* walls
* towers
* roads
* soldiers
* workers
* castles

and recognize that all of it grew from the tiny Keep they began with.

Then the largest invasion in the game arrives.

A massive Black Dragon appears over the ocean carrying the Conquerer.

The player's entire kingdom is tested in one final battle.

---

# DEVELOPMENT PRIORITY

Do not attempt to build every feature simultaneously.

Develop the game systematically.

## Phase 1 — Foundation

Implement:

* canvas rendering
* game loop
* grid
* camera
* map
* terrain
* Keep
* building placement

## Phase 2 — Economy

Implement:

* workers
* resource gathering
* forests
* mines
* farms
* houses
* population
* storage

## Phase 3 — Military

Implement:

* barracks
* unit recruitment
* unit selection
* movement
* combat

## Phase 4 — Defenses

Implement:

* walls
* gates
* towers
* enemy pathfinding
* repairs

## Phase 5 — Waves

Implement:

* ships
* enemy landing
* invasion AI
* wave timer
* Wave Manager

## Phase 6 — Progression

Implement:

* upgrades
* advanced units
* building tiers
* technology progression

## Phase 7 — Bosses

Implement:

* minibosses
* Barbarian Chief
* Ogre Champion
* Titan
* Warlord
* Conquerer
* Black Dragon
* Phase 1/Phase 2 final battle

## Phase 8 — Polish

Implement:

* improved graphics
* animations
* particles
* sound
* music
* UI polish
* destruction
* environmental effects

## Phase 9 — Platform Release

Implement:

* optimization
* save system
* HTML5 packaging
* platform SDK abstraction
* mobile compatibility
* advertisement integration hooks

---

# FINAL GOAL

Create a game that begins like a small survival settlement and ends like a large-scale fantasy siege RTS.
