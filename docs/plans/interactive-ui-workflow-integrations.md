# Implementation Plan — Interactive UI & Workflow Integrations

Implement inline page annotations, workspace webhook exports, auto-translation presets, and smart page change tracking diffing in **AI Webpage Explainer**.

## Proposed Changes

### 1. Inline Text Highlighting & Page Annotations
- **`content.js`**: When a text selection is explained, wrap the active range in `<mark class="ai-explainer-highlight">`.
- **`styles.css`**: Style `.ai-explainer-highlight` with smooth yellow/indigo highlighting and hover tooltip.

### 2. Workspace Export Integrations (Webhooks / Notion / Obsidian / Markdown)
- **`popup.html` & `popup.js`**: Add Webhook / Workspace Export URL setting field (`webhookUrl`).
- **`content.js`**: Add a `🔗 Export` action button to assistant messages that sends summary payload to configured Webhook / Notion bridge endpoint.

### 3. Auto-Translation & Dual-Language Preset
- **`content.js` & `background.js`**: Add `🌐 Translate` preset button. Detects original page language and generates a dual-language summary (Original + English / Target translation).

### 4. Smart Page Diffing / Change Tracking
- **`content.js`**: Store webpage URL & text snapshot in `chrome.storage.local`.
- If visiting a returning URL with a previous snapshot, render a `🔄 What Changed?` button in the sidebar preset bar.
- Compare previous snapshot vs current text and prompt AI to highlight structural changes, policy updates, or price diffs.

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness.

### Manual Verification
- Test selecting text -> verify inline text highlight `<mark>` is applied to webpage text.
- Test `🌐 Translate` button -> verify dual-language response.
- Test visiting page twice -> verify `🔄 What Changed?` diff preset button appears.
- Test Webhook export button in message actions.
