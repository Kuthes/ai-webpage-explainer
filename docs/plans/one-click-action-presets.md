# Implementation Plan — One-Click Action Presets

Add preset mode pill buttons to **AI Webpage Explainer** so users can generate specialized explanations (Executive Summary, Key Takeaways, ELI5, FAQs) with a single click.

## Proposed Changes

### 1. Update `content.js`
- Create a `#preset-container` div inside the sidebar (below the header or above the input area).
- Render 4 preset action pills:
  - `📌 Summary` (Executive 3-sentence summary)
  - `💡 Key Takeaways` (Bulleted points)
  - `👶 ELI5` (Simplified explanation)
  - `❓ FAQs` (Extracted top Q&As)
- Clicking a preset pill triggers `startPresetExplanation(mode)` which calls `chrome.runtime.sendMessage` with action `'explainPreset'`.

### 2. Update `background.js`
- Add support for `'explainPreset'` in `chrome.runtime.onMessage` and `handleRequest`.
- Tailor `systemPrompt` based on the preset mode:
  - `summary`: "Provide a concise 3-sentence executive summary focusing on primary key facts."
  - `takeaways`: "Extract key takeaways and actionable bullet points from this page."
  - `eli5`: "Explain this webpage content in simple, non-technical plain English as if explaining to a 5-year-old."
  - `faqs`: "Extract top 3 to 5 frequently asked questions and concise answers from this page content."

### 3. Update `styles.css`
- Add styles for `.preset-container` and `.preset-pill` (horizontal scrollable bar, hover scale, active focus state, smooth transitions).

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness.

### Manual Verification
- Click each preset pill button in the sidebar and verify that the AI responds according to the requested formatting mode (executive summary, bullet takeaways, simple ELI5 explanation, or FAQs).
