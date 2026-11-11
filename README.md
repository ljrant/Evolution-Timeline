# Epoch — Evolution Timeline Challenge

A dependency-free, static interactive evolution timeline game for GitHub Pages. It uses a continuously zoomable **logarithmic scale** from Earth's formation (~4.54 billion years before present) to today.

## Play

- **Place events:** drag a card from the bank into the canvas, or click the card and click the canvas to place it.
- **Navigate:** drag empty space to pan; scroll or use zoom buttons to zoom. Era presets jump to early Earth, dinosaurs, and recent life.
- **Ongoing events:** drawn as horizontal bars below the main axis. Drag the bar to move it, or drag its end handles to adjust the date range.
- **Select and move together:** Shift-click several placed events and drag one of them to move the group while maintaining its relative spacing in logarithmic coordinate space. The "Select all placed" button also works.
- **Link related events:** select "Link events" then click two placed events. Click the same pair again to remove the link.
- **Check accuracy:** produces a 0–100 score with 70% date/duration accuracy, 25% relative order, 5% user-created connections. The date component uses a continuous exponential distance penalty in normalized log time. Ordering is evaluated over all pairs of placed events. Related connections are scored against curated relationships.
- **Save progress:** placements and connections persist in your browser's localStorage. Reset round clears them.
- **Keyboard:** focus a placed event and use left/right arrows for precise moves; Escape closes dialogs.

## Deployment

The repository includes `.github/workflows/deploy.yml` for GitHub Pages. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The workflow will deploy on subsequent pushes to `main` (or launch it through **Actions → Deploy Epoch to GitHub Pages → Run workflow**). The expected public site URL is:

https://ljrant.github.io/Evolution-Timeline/

**Note:** GitHub Pages must be enabled under repository Settings. Committing a workflow alone does not guarantee the Pages site has been provisioned. If Actions are restricted, alternatively select **Deploy from a branch**, branch `main`, folder `/(root)` — all website files are in the root.

## Files

- `index.html`: semantic app layout and help/result dialogs
- `styles.css`: responsive presentation
- `app.js`: event catalog, log coordinate mapping, pointer interactions, persistence, links and scoring
- `.github/workflows/deploy.yml`: Pages deployment

No Node.js, npm, server, framework, or build step is required.

## Event data

Edit the `EVENTS` array in `app.js`. Singular events have `type:'point'` and `age`. Ongoing processes use `type:'range'`, `start` (older boundary) and `end` (younger boundary). All values are years before present, with `0` representing today. The `related` array contains IDs of scientifically related events.

The included events and ages are approximate educational examples, especially for disputed first appearances of life and biological innovations. For a classroom deployment, validate event ages against your preferred scientific references before use.

## Notes

This is a client-side, single-player game: there is no account system, shared score leaderboard, moderation, or remote data store. Its interface is inspired by deep-time explorer interaction patterns but uses its own implementation and design.
