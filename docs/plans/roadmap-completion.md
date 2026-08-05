# Implementation Plan — Complete Feature Roadmap

Complete the remaining items from the feature roadmap: Streaming LLM responses, Multi-Tab Webpage Comparison, and PII Masking Privacy Shield.

## Proposed Changes

### 1. PII Masking & Privacy Shield
- **`popup.html` & `popup.js`**: Add a `PII Masking` checkbox toggle (`maskPII`).
- **`content.js`**: Implement `sanitizePII(text)` function using regex patterns to redact sensitive personal data (emails, phone numbers, SSNs, credit cards) before sending content to AI providers.

### 2. Multi-Tab Webpage Comparison
- **`manifest.json`**: Ensure tabs permission allows reading tab titles for comparison.
- **`background.js`**: Add `compareTabs` handler that queries all open tabs using `chrome.tabs.query({ currentWindow: true })`, extracts titles/URLs, and generates a comparative analysis.
- **`content.js`**: Add a `📊 Compare Tabs` pill button in the preset bar.

### 3. Progressive Text Streaming Support
- **`background.js` & `content.js`**: Enhance message passing to deliver real-time progressive response tokens to the UI.

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness.

### Manual Verification
- Test PII masking toggle in options -> verify emails/phones in page content are masked as `[REDACTED_EMAIL]`.
- Click `📊 Compare Tabs` -> verify AI compares topics across open browser tabs.
