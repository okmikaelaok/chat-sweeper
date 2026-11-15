# Using ChatSweeper

**Select. Manage. Keep or Sweep.** · [Back to README](../README.md)

## Install or update

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select **`extension/`**, the folder containing `manifest.json`. If using `chatsweeper.zip`, extract it first and select its extracted folder.
3. Refresh Gemini or ChatGPT, expand the chat sidebar, and click **ChatSweeper**.
4. To update, replace the files in the folder already loaded by Chrome, click **Reload** on its extension card, then refresh the chat tabs. Do not remove/reinstall if you want to keep local protection choices.

The toolbar opens a site chooser on unrelated pages. Supported sites are `gemini.google.com`, `chatgpt.com` and the legacy `chat.openai.com` hostname.

## Find and select chats

- The count covers unique chats **discovered in this tab**, not a verified account total. **Load more chats** first checks current entries, returns to the top to check for new chats, then resumes older-history scanning from the previous scroll position. Collapsed sections, searches, archived chats, virtualised lists and site changes can limit coverage. Scans stop at a stable bottom or after 150 steps.
- Only **50 chats per page** are rendered. Previous/Next changes the page. Search, Show and Sort reset to the first page, so every matching result remains accessible.
- **Show** filters the single list: All, Selected, Protected or Unprotected.
- **Sort by** includes Discovery order, Newest, Oldest and title A–Z/Z–A. Only explicit date metadata exposed in the sidebar is read; ChatSweeper does not fetch full chats or account history to obtain dates. Timestamps added or changed later are detected automatically, and changing Sort rereads current metadata. Unknown dates sort last. When the matching chats have no readable timestamps, a message beside Status explains that dates are unavailable and discovery order is kept. This is separate from loading or scrolling the sidebar; it does not mean the sidebar is collapsed. Dates are never guessed from pins, titles or discovery order. Custom date ranges are currently omitted.
- **Select all** selects/deselects only the current page's unprotected chats. Selections on other pages remain selected and are included in the Selected total and the note about chats outside this page in Status.
- New sidebar rows, titles and chat IDs are detected automatically while the panel is open, including rows whose text/attributes update in place. Unrelated message streaming does not postpone sidebar updates. Empty unsaved drafts are not counted before the site exposes a saved chat and stable ID. Search, Show filters or the current page may hide a newly discovered entry.
- Chat IDs appear below every title. Display titles are capped at **80 characters**, including "..." for longer titles, and may shorten further to fit the row. Hover over the title to read it in full. Search and sorting still use the full title.
- Refresh after switching accounts or workspaces. Discovery and selections are session-only.

## Protect chats

Use the shield button to keep a chat: protected chats are excluded from ChatSweeper deletion. Protection persists across reloads. Protecting a selected chat deselects it. Protection is stored by provider and ID in local extension storage, shared between supported tabs and ChatGPT's current/legacy hosts. It is not synced to other devices and disappears if extension data is cleared or the extension is removed.

Find protected chats through **Show → Protected**. Saved IDs that have not been discovered in this tab appear there with an ID label; they do not inflate the discovered count. Click their shield to unprotect. Protection applies to extension operations, not manual actions on the websites.

## Delete and follow progress

The red **Delete selected chats** button starts permanent deletion directly, without a ChatSweeper confirmation popup. Before clicking, check the Selected total and the note in Status about any selected chats outside the current page. Protected chats are excluded.

During the run, the list follows the active chat, switches pages automatically and labels rows **Queued**, **Deleting…**, **Deleted**, **Protected · skipped** or **Check required**. It shows the discovered chats in a fixed order, including protected neighbours, so filters cannot hide the active item. Only the selected, unprotected IDs enter the queue. At most 50 rows render at once. Search, Show and Sort are locked while deletion runs. Select all stays visible and is disabled during deletion.

Chats are processed sequentially through the site's visible English menus and confirmation dialogs. **Stop** ends the queue after the current operation; a deletion already confirmed may finish. Protection is checked again before every deletion and immediately before the site's confirmation. Protection changes in another tab stop the run. The extension waits for the dialog to close and the sidebar entry to disappear before labelling a row Deleted. This is page-level verification, not proof of server-side deletion.

When deletion finishes, stops or fails, the normal chat list and controls return automatically. Verified deleted rows are removed, your search, Show and Sort settings stay in place, and remaining selections are preserved. The Status message shows the outcome.

Missing/ambiguous controls, existing site menus/dialogs, unavailable protection storage or a timeout stop deletion with an error. There is no automatic retry. A timeout after confirmation can mean the site completed deletion without verification: inspect the site, close any remaining dialog/menu, and refresh before retrying.

**Project-folder management is omitted for now** because detection was unreliable. This version does not delete projects.

## Appearance and About

Choose **System**, **Light** or **Dark** beside the site badge. System follows OS changes automatically. Manual preferences are stored locally and shared across supported tabs. Text, controls and borders have been enlarged for readability. The **Status:** area below the scan controls contains discovered, selected/deleted and protected totals, operation results, date availability and selection details. Select all and page controls sit in the same area. Search, dropdowns, the provider pill and header buttons use matching text sizes and visible focus borders. Status uses a neutral border. Select all and its page scope appear inline with the page controls; selection checkboxes match their adjacent button sizes.

The **About** button in the header opens a dialog over the panel, immediately below the button, with author/copyright, GPLv3 license, the protection explanation and [the GitHub source](https://github.com/okmikaelaok/chat-sweeper). The name is shown inside About instead of in the panel footer. About stays within the viewport and uses a dimmed backdrop without blur. Deletion progress stays in the main list.

## Privacy and checks

No messages or titles are saved to disk, no analytics/remote servers/private API calls are used, and all UI assets are bundled. Only protected IDs and the theme preference are saved locally. Permissions are `activeTab` and `storage`, with static content scripts limited to the three supported HTTPS hosts.

Tests simulate the sites and extension storage. A user has confirmed signed-in chat discovery and deletion on both sites. The updated deletion flow still needs checking on the live sites; UI changes can affect compatibility. Start with a disposable chat. See [development](DEVELOPMENT.md) for build/test commands and limitations.

## If Gemini shows no chats

Keep Gemini's side panel expanded with the previous chat titles visible, reload ChatSweeper at chrome://extensions, then refresh Gemini. Each tab scans that site's own sidebar; ChatGPT and Gemini are detected independently.

Gemini can render chat entries as clickable rows rather than links. ChatSweeper now recognises IDs in those rows' metadata, along with regular chat URLs, and preserves account-specific URLs. It never uses a title as an identifier. If rows are present without a reliable ID, the empty-state message explains that the layout needs an update, and those rows are not offered for deletion.

Report the empty-state message if chats still are not detected. Do not send chat contents or account credentials.
