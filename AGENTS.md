# Center growth game

Use docs/center-growth/GAME_DESIGN_DRAFT.md, ECONOMY_AND_CONTENT_DRAFT.md and ART_AND_AUDIO_DRAFT.md as the design baseline. New implementation lives in src/center. The old game remains in Git history and is not the gameplay foundation.

- Korean, scene-first interface, short contextual dialogue. Avoid dashboard-like walls of text.
- Deterministic simulation, persistent purchases, recoverable mistakes, ten independently simulated rivals.
- All new assets under public/center. Do not reuse the old art direction.
- Keep simulation separate from rendering. Never grant money from animation completion.
- Main branch deploys the existing public game. Work on feat/center-growth-reboot; do not push main during the first playable milestone.
- Run npm run check, npm test and npm run build. Inspect the actual browser flow.
- Record implemented scope and remaining art/audio work in docs/center-growth/IMPLEMENTATION_STATUS.md.
