# Implementation Plan — Selection Explanation Feature

Add text selection explanation functionality to **AI Webpage Explainer** via both a floating context tooltip and Chrome Context Menu item.

## Proposed Changes

### 1. Update `manifest.json`
- Add `"contextMenus"` to the `"permissions"` array.

### 2. Update `background.js`
- Create a context menu item on `chrome.runtime.onInstalled`:
  - `id`: `"explainSelection"`
  - `title`: `"Explain selection with AI"`
  - `contexts`: `["selection"]`
- Add `chrome.contextMenus.onClicked` listener to forward the selected text to the active tab's content script.
- Add support in `handleRequest` for `'explainSelection'` action type, formatting system prompt to focus on explaining the specific selected snippet within the page context.

### 3. Update `content.js`
- Listen for `mouseup` / `keyup` events to detect highlighted text selection on the page.
- Render a floating tooltip button near the text selection inside the Shadow DOM (`#selection-tooltip`).
- Listen for messages from background script when triggered via Chrome Context Menu.
- Open the sidebar automatically, populate selection context, and display the AI explanation.

### 4. Update `styles.css`
- Add styles for the floating text selection tooltip (animations, positioning, hover effects, shadow DOM compatibility).

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness across all updated JavaScript files.

### Manual Verification
- Test text selection on web pages: select text -> verify floating tooltip appears -> click tooltip -> verify sidebar opens with targeted explanation.
- Test context menu: select text -> right-click -> click "Explain selection with AI" -> verify sidebar opens with targeted explanation.
