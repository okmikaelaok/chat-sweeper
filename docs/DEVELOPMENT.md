# Developing ChatSweeper

Node.js 22+ and npm are required to rebuild the UI. Normal installation uses the already-built `extension/` folder and needs no Node.js or API keys.

```sh
npm ci
npm run typecheck
npm run build
npm test
npm run package
```

`npm test` needs a local Chrome/Chromium installation. Set `CHROME_BIN` to its executable if automatic discovery fails. Browser fixtures run headlessly in isolated profiles under `.tools/`; they never sign in to accounts or delete real chats. The package command also needs Python 3 (`py` on Windows or `python3` elsewhere; override with `PYTHON_BIN`). It writes `dist/chatsweeper.zip` and `dist/chatsweeper-source.zip`. The second archive includes corresponding editable source and build instructions for GPLv3 distribution. Publish both together if distributing a generated release.

The TypeScript compiler and React, React DOM and Node type definitions are pinned development dependencies. `npm run typecheck` checks the UI components and build-time renderer using `tsconfig.json` without emitting files. Run it before rebuilding.

## Structure

| Path | Purpose |
| --- | --- |
| `src/` | Existing site adapters, queue, protection and date logic; shared theme controller |
| `src/ui/` | React templates, shadcn/ui source, Tailwind styles and palette tokens |
| `extension/` | Loadable build, manifest and locally bundled assets; committed for easy installation |
| `tests/` | Behaviour, date, theme and UI fixtures with simulated extension storage |
| `scripts/` | Build, local tests, packaging, attribution and preview generation |
| `docs/` | Usage details, development notes and gallery images |
| `licenses/` | Upstream license texts and generated dependency notices |

`scripts/render.tsx` renders the extension panel and shared components to static markup **at build time**. `scripts/start.tsx` renders the fallback page separately. Tailwind compiles CSS and Lucide supplies inline SVG icons. `src/content.js` attaches the existing DOM controller to those stable element IDs inside a shadow root. This preserves behaviour without mounting a new React application or bundling a React runtime in the extension. Rebuild `extension/` after changing source; reload the extension and refresh supported tabs.

The panel uses `src/ui/styles.css`, which builds to `extension/assets/styles.css` and is embedded in `extension/ui.js`. Its dark palette matches the panel screenshots: `#18181F` panel surfaces, `#0B0B10` fields and rows, `#302740` selection backgrounds and `#A78BFA` accents. The published v0.1.0 source had the primary/accent colours reversed; restoring that release alone does not restore the screenshot palette. Browser theme checks guard these colours. The fallback page uses its own `src/ui/start.css`, built to `extension/assets/start.css`. Keep fallback layout and palette changes in that separate file. Its saved theme uses `chatsweeper:start-theme`; the panel retains `chatsweeper:theme`, so switching themes on the fallback does not recolour the panel.

Palette tokens are in `src/ui/styles.css`. Theme choices are `system`, `light`, and `dark`; `system` follows OS changes, manual overrides persist in local extension storage, and changes propagate between tabs. Dark mode is ready for v0.1.0; light mode is still being refined. No remote fonts, styles, scripts or icon services are used.

The brand source is `extension/assets/chat-sweeper-icon.png` (512×512). Builds preserve the artwork and produce 16, 32, 48 and 128-pixel PNGs for the manifest. The original 512-pixel PNG is retained as the only master copy. The supplied icon is also used in the launcher, header, chooser, favicon and README. A white icon tile keeps black lettering visible in both themes. Chrome's [icon guidance](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons) lists the standard sizes; the full wordmark can be hard to read at toolbar scale.

Protection intentionally retains the pre-rebrand `chat-manager:protected:<provider>:<chat-id>` storage keys. Do not rename or clear those keys without a migration: existing protected chats must remain protected after upgrading. The new theme preference uses `chatsweeper:theme` and stores no chat data.

The shadcn/ui components are copied source, not a runtime component service. `components.json` records the registry configuration and `scripts/vendor.mjs` records source URLs. Normal builds do not fetch registry files. The lockfile pins dependencies. `scripts/notices.mjs` assembles their license notices during builds; third-party license terms remain attached to the generated distribution.

Before releasing, run the browser tests and compare a disposable chat on each live site. Site UI changes, virtualised lists and hidden dates still limit coverage; see [usage](USAGE.md). Firefox requires a separate manifest/background adaptation and is not supported by this package.

## UI structure

Only 50 chat rows are rendered per page. Selection applies to the visible page while the delete action accounts for selections elsewhere. Protected and unprotected filters share one list; unresolved protected IDs are shown only in the Protected filter. Date sorting remains, but range inputs and unreliable project-folder management are omitted. About contains credits and the repository link. The stronger control-border token supplements the original surface palette.

## Gemini detection and About positioning

The adapter supports both chat anchors and non-link Gemini chat rows. Identifiers come from same-origin chat URLs, explicit chat ID attributes, c_-prefixed row IDs or unambiguous c_ metadata tokens. Title-only and conflicting identities are rejected. Sidebar scoping, row-level menu checks, deduplication and disappearance verification also apply to non-link entries.

The shared `src/dialogs.js` helper positions About next to its trigger within the panel bounds. It clamps the dialog to the viewport, scrolls its contents when needed, and repositions on resize/scroll. The native dialog retains its focus handling and Escape behaviour. Dialogs open above their trigger if insufficient space is available below. The chooser uses the same helper. Dialog backdrops are dimmed without blur.

## New-chat updates

The mutation observer watches relevant sidebar child, text and identity/title attribute updates. It uses a bounded scheduled refresh rather than resetting its timer for every page mutation; message streaming outside the sidebar is ignored. Refreshes suppressed during scanning/deletion resume afterward. Opening the panel and returning to the tab also refresh the list.

Load more chats harvests the current rows, checks the top for new entries, then returns to its previous scroll position before continuing older history. Current top-of-sidebar entries are prioritised in the cached order. No private API requests or forced page reloads are used.

The discovery fixtures cover reused rows, character-data titles, identity attributes, streaming, newly inserted entries, closed/reopened panels, recent-before-old ordering, scroll resumption, non-scrollable lists and Stop.

## Protection updates

Chat rows are reused by ID instead of replaced on every update. Protection saves mark only their shield button as busy; search, filters, pagination and other rows remain usable. Pending saves are excluded from selection and must settle before scanning or deletion can start. Successful local saves update the protected count and shield without inserting a status box. External storage changes still update selection eligibility and stop active operations.

The protected highlight is drawn inside the existing row border so title spacing stays fixed. Browser fixtures simulate delayed storage writes and check row identity, focus, scroll, geometry and pending-save guards.

## Date availability and scan notices

Date parsing and the sidebar observer share the same timestamp-attribute list. Timestamps supplied after a row mounts, or updated in place, refresh automatically. Changing Sort also rereads the current rows. Date availability counts only matching chats; with no readable dates, the sort note explicitly describes the discovery-order fallback. Date sorting never starts a scan.

Status messages share a single line: selection, sorting, scanning and deletion replace the previous message when the user takes a new action. Longer messages are clipped with an ellipsis and available in full on hover. A visible non-scrollable sidebar gets a neutral completion message rather than instructions to expand it. Dates still come only from page metadata, without private APIs or inferred timestamps. Date and discovery fixtures cover these cases.

## List-based deletion

The extension preview dialog has been removed. The list always displays IDs, and Status shows the exact eligible count and selections outside the current page before direct deletion starts. Titles are capped at 80 Unicode code points including the ellipsis; full titles remain in hover/accessibility labels and are used for searching and sorting. CSS also truncates the visible title to a single line.

A deletion run snapshots discovered rows in the chosen sort order and freezes its selected IDs. Its list view temporarily overrides filters to keep the active row visible, moves between 50-row pages, and scrolls only the list container. Protected rows are visibly skipped. When the run finishes, stops or fails, normal filters and controls return automatically and verified deleted rows are removed. Remaining selections are preserved, and normal discovery resumes.

The existing site-menu queue, persistent protection checks, Stop behaviour and disappearance verification remain in use. Browser fixtures cover direct deletion, stopping before a menu opens, protection added during confirmation, failures, title truncation, full-title searching, hidden targets, protected neighbours, automatic page/scroll following and automatic return to the normal list.

Global totals, selection details, date notices and operation results share the Status area. During a deletion run, the Deleted metric carries progress while the message simply says “Deleting…”. Select all stays visible and disabled during deletion. The provider name has a green detection dot and no button border.

Shared sizing tokens keep search/dropdown text, header controls and checkbox targets consistent. Search and selects use the same explicit focus border and outline. Native checkbox semantics are preserved with custom checked/indeterminate visuals and a forced-colours fallback. Status uses the neutral control border instead of a selection accent.
