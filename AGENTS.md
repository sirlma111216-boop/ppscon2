# Center growth game

The active game lives in `src/center`. Read `docs/center-growth/SPACE_AND_RENTALS.md` for current rules and `IMPLEMENTATION_STATUS.md` for implemented scope. Earlier `GAME_DESIGN_DRAFT.md`, economy/art drafts and the old game are historical planning references where they disagree with the current rules.

- Korean, picture-first interface with short contextual dialogue. Start with the exterior; show a room's controls only after entering it. Avoid text-heavy dashboards.
- Read `DESIGN.md` before UI work. The original Oura analysis in `docs/references/DESIGN-oura.md` is reference data; the game-specific rules and user instructions take precedence.
- The campaign is 7 years, 28 seasonal turns, 364 simulated weeks. Use exported `MAX_YEARS`/`MAX_TURNS`; do not restore old 5-year constants.
- There are 9 independently simulated rivals plus the player, 10 centers total. Derive UI counts from state. Preserve historical report participant counts.
- Each room has a purpose and its own equipment. Use `roomSupportsProgram`, `roomSupportsOffer`, and `getProgramRequirements`; do not duplicate eligibility rules in UI. Equipment must be installed and usable in the same room.
- Rental approvals may replace an existing class only after explicit confirmation through `replaceClassWithRental`. Failed approval must preserve the class and money.
- Locked facilities require tender, bid comparison, paid contract and simulated construction. Campus garden/facade projects have their own costs and completion effects.
- Evaluate at the end of years 2, 4, 6, and 7. Use engine evaluation records for the four component scores, awards and non-compounding budget changes. Ordinary winter is an operating settlement.
- Final competition uses `getFinalStandings`, `getFinalRank`, `finalScore`, and `getAwardForRank`. Distinguish the year-7 final-year award from the full seven-year final award.
- Keep simulation deterministic and separate from rendering. Animation completion/skip must never grant money or advance construction. The scene shows the final simulated week, not an invented second week.
- Keep people static. Operating scenes use the actual attended class/rental still as a small borderless inset in the original room. Use object-fit:contain: never crop faces. Planning and empty times keep the original room. No GIF, modal or animation-driven simulation.
- Preserve general classes. Exclusive programs use Program.exclusiveRoom and exclusive equipment uses Offer.exclusiveRoom: B2/C3/E2/F1/G3, 11 total. P11 Pilates is B only, P12 professional pottery E only, and P13 filmmaking F only. Do not allow multipurpose rooms to bypass these restrictions. Preserve and back up old saves before specialty migration.
- Premium classes have distinct income/reputation roles, their own demand and a center-wide weekly limit. Storage does not expand room slots or remove owned-equipment maintenance. Reinstallation costs time and money; affected classes require explicit clearing confirmation and accepted rentals must be cancelled separately before equipment is stored or moved.
- New game assets belong under `public/center`. Use optimized WebP in the main UI, preserve source artwork/provenance, and do not recolor or distort supplied official logos/characters.
- Preserve existing save progress. Before upgrading version, rival roster or evaluation schema, back up the original stored JSON. Migration does not rerun completed seasons.
- User-provided recorded audio is integrated; external human playtesting remains unfinished. Use current engine/IMPLEMENTATION_STATUS for events and implemented scope.
- Work on `feat/center-growth-reboot`. Main deploys the existing public game; do not push main as part of routine local development.
- Run `npm run check`, `npm test`, and `npm run build` for relevant changes. Inspect actual desktop/mobile flows. Old-game tests included by `npm test` are not proof of center-game coverage.
- Record only observed validation results in `docs/center-growth/IMPLEMENTATION_STATUS.md`; do not invent current test totals or completed browser checks.

- Activity equipment limits: C auditorium 4, every other room 3. Common/supporting equipment keeps its existing counting rules.
- Room remodeling is optional, once per open room, 13 simulated weeks. Apply +6 satisfaction only to actual use in that room, capped at 100. No direct fee/capacity/slot bonus. Completed rooms use room-upgrades-v1.
- First page is CenterShell. Never mount a new game on landing or overwrite a valid save without backing it up. Hall of Fame is local-only and only accepts actual completed campaigns.
- Tutorial is a read-only scene-and-caption slideshow, never a practice task. It must not write or replace saves until the user finishes/skips to start the actual new game.
- Satisfaction values and per-action satisfaction changes are hidden outside evaluations. Show only the aggregate satisfaction component at evaluation; preserve internal mechanics.
