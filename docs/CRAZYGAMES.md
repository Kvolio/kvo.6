# CrazyGames submission — Tidehold: The Last Coast

## Upload files

Run `npm run build:crazygames` to create `dist/tidehold-crazygames.zip`. Upload this ZIP in the CrazyGames Developer Portal as an **HTML5** game. Its only entry is `index.html` at the archive root. Do not upload the repository or the offline `dist/index.html` instead: the dedicated CrazyGames build includes the official v3 SDK.

The game is approximately 243 KB before ZIP compression (approximately 77 KB zipped), with all artwork, music and code embedded. Only the official CrazyGames SDK is loaded remotely. The standard GitHub Pages and offline builds keep local saves and have no SDK dependency.

## Portal settings

- Title: **Tidehold: The Last Coast**
- Engine: **HTML5 / JavaScript**
- Devices: **Desktop, tablet and mobile**; responsive portrait and landscape. Physical iOS/Safari validation remains part of portal QA.
- Progress Save: **Yes, using the Data Module from the CrazyGames SDK**. This toggle is mandatory for Data calls to work.
- Accounts: no separate game account or external login. CrazyGames handles guest storage and account synchronization.
- Initial submission: **Basic Launch**. The game contains no ads or purchases. CrazyGames disables monetization during Basic Launch; ad placements can be added for an approved Full Launch.
- Genres to select if offered: Strategy, Tower Defense, Building, Survival.

## Submission text

**Short description**
Build a medieval kingdom, defend its coast, and survive waves of invaders, dragons and demons.

**Description**
Tidehold is a top-down kingdom-building strategy game. Start with a Keep and five workers, gather supplies, develop your settlement and protect it with walls, towers and an army. Mine rich mountain foothills, research stronger defenses, recruit cavalry and heal your troops with Clerics. Choose a Keep with its own benefits and prepare for increasingly dangerous attacks by sea and air. Easy offers 40 waves, Normal and Hard offer 50, and Nightmare continues through 60. Defeat Nightmare to unlock the Demon Castle, or continue your surviving kingdom in endless mode.

**Controls**
Desktop: WASD or arrow keys to pan; mouse wheel to zoom; click to select or build; drag to select groups or draw walls; right-click to move; R rotates buildings; E upgrades; Space pauses; Escape cancels. Touch: drag to pan, pinch to zoom, tap to select and preview, then confirm placement. Select troops through Army, choose Move, then tap their destination.

## Covers and video

Generate the submission artwork and real-time gameplay recordings while `npm start` is running:

```sh
node tools/crazygames-media.mjs
```

The script uses the game's own Canvas artwork and renderer, with no downloaded artwork or music. A local Chrome/Playwright installation and FFmpeg are needed. Put FFmpeg on PATH or set `FFMPEG_PATH` to its executable; it remuxes recorded MP4 files for accurate duration and seeking without changing playback speed. `CHROME_PATH` and `PLAYWRIGHT_PATH` can override the documented defaults in the script.

Upload these from `dist/crazygames-submission` in the matching portal fields:

| File | Dimensions | Purpose |
| --- | --- | --- |
| `cover-landscape.png` | 1920 × 1080 | Landscape cover |
| `cover-portrait.png` | 800 × 1200 | Portrait cover |
| `cover-square.png` | 800 × 800 | Square cover |
| `preview-landscape.mp4` | 1920 × 1080 | Silent landscape preview, about 18 seconds |
| `preview-portrait.mp4` | 1080 × 1620 | Silent 2:3 portrait preview, about 18 seconds |

The videos begin with their cover artwork, then show the actual game simulation at normal speed. They have no audio, external logos, promotional text, black bars, or cursor. These files are generated separately from the playable upload ZIP.

## Integration behavior

- Startup awaits `CrazyGames.SDK.init()` before any progress/settings reads or the title screen. SDK initialization and Data-module failures display a Retry screen instead of opening a conflicting local kingdom.
- On CrazyGames and local SDK testing, all kingdom saves, tutorial completion, Demon Castle unlocks and audio preferences use `SDK.data`. There is no direct-localStorage fallback or automatic import that could overwrite another account's progress. GitHub Pages saves belong to a different browser origin and are not automatically imported into CrazyGames.
- Guests and signed-in players use the same Data API. The SDK owns cloud loading, guest/account synchronization and account-change reloads.
- Lossless tile tables reduce the sample Nightmare save from approximately 920 KB to 497 KB. Older uncompressed saves remain readable. Saved map fields, structures, upgrades, armies and boss phases are preserved. A conservative save budget reserves space under the SDK's 1 MB total quota. A failed save leaves the previous save intact and the current kingdom open.
- `loadingStart/Stop` surrounds game startup after SDK initialization. `gameplayStart/Stop` follows entry into the playable kingdom, pause/resume, nested menus and game over. Tutorials count as gameplay because the kingdom is playable. Focus-only changes do not send duplicate events; simulation/audio are suspended while hidden.
- `muteAudio`, including settings-change notifications, takes priority over the user's audio controls without changing their stored preference. Campaign victory sends a single celebration and 100% completion event.
- Standard keyboard scrolling is prevented by the game input controls. Menus and touch controls stay usable in both orientations.

## Validation and final portal QA

Automated verification: 113 simulation/integration tests; packaged desktop, phone and landscape checks with a controlled SDK; real official CDN v3 SDK initialization, Data save/reload and muting in local mode; single-file offline regression test. The archive and media dimensions/durations are checked separately.

Before submitting for review, use **Preview** in the CrazyGames Developer Portal:

1. Confirm the SDK QA panel accepts initialization, loading and gameplay events. Found a kingdom, pause, open Settings, return, and resume.
2. Save as a guest and reload. Log in and check guest-to-account behavior. With an existing account save, confirm its kingdom is restored. Test the same account on a second device. These backend scenarios require the portal and cannot be certified by a local SDK mock.
3. Check platform mute, browser tab suspension, keyboard controls, touch placement, pinch zoom and orientation changes. Check audio resumes after interruption on a physical iPhone/iPad.
4. Review all three covers and both silent previews. Complete the portal's developer, rights, category and contact fields with your own information, then submit when satisfied.

No CrazyGames submission or approval has been performed automatically. The files are prepared for you to upload; acceptance remains CrazyGames' review decision.

## Official references (checked September 13, 2026)

- [SDK v3 initialization](https://docs.crazygames.com/sdk/intro/)
- [Data module and submission toggle](https://docs.crazygames.com/sdk/data/)
- [Gameplay events and platform mute](https://docs.crazygames.com/sdk/game/)
- [Technical requirements](https://docs.crazygames.com/requirements/technical/)
- [Cover and video requirements](https://docs.crazygames.com/requirements/game-covers/)
- [Developer Portal](https://developer.crazygames.com/)
