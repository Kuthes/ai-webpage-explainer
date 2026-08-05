# Implementation Plan — Summary Export & Voice Tools

Add copy, file download, Text-to-Speech (TTS), and local summary history features to **AI Webpage Explainer**.

## Proposed Changes

### 1. Update `content.js`
- **Message Action Bar**: For each AI assistant response, append a sleek action toolbar containing:
  - 📋 **Copy**: Copies response text/markdown to clipboard with visual feedback (`Copied!`).
  - 📥 **Download**: Downloads the summary as a `.md` document using Blob URL.
  - 🔊 **Listen (TTS)**: Toggles browser Web Speech API (`speechSynthesis`) to read the explanation aloud.
- **Local History Manager**:
  - Automatically persist completed summaries to `chrome.storage.local` under `explanationHistory` (stores `{ title, url, explanation, timestamp }`).
  - Add a 📜 **History** button in the sidebar header.
  - Clicking History renders a collapsible history view allowing users to review or reload past explanations.

### 2. Update `styles.css`
- Style `.msg-actions` bar and action buttons inside message bubbles.
- Add styles for `.history-drawer` and `.history-card`.

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness.

### Manual Verification
- Generate an explanation -> click Copy -> verify clipboard content.
- Click Download -> verify `.md` file download.
- Click Listen -> verify browser audio speech starts/stops cleanly.
- Open History view -> verify saved summaries are displayed with timestamps.
