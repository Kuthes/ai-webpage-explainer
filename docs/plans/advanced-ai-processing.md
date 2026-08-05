# Implementation Plan — Advanced AI & Processing Capabilities

Implement local on-device AI, multimodal vision analysis, intelligent text chunking / RAG, and custom prompt persona templates in **AI Webpage Explainer**.

## Proposed Changes

### 1. Local On-Device AI (`window.ai` / Gemini Nano)
- **`popup.js` & `popup.html`**: Add `"chrome-ai"` ("Built-in Chrome AI (Gemini Nano)") to provider options.
- **`background.js`**: Route requests to Chrome's local `LanguageModel` API if supported, returning instant offline explanations without needing API keys.

### 2. Multimodal Vision Web Analysis
- **`manifest.json`**: Ensure activeTab permission enables visual page capture.
- **`background.js`**: Add `captureTabScreenshot()` handler using `chrome.tabs.captureVisibleTab()`.
- **`content.js`**: Add a `📸 Visual Analysis` preset button.
- **`background.js`**: Send base64 image payloads to multimodal vision endpoints (GPT-4o, Gemini 2.0 Flash) to describe charts, infographics, tables, and page visuals.

### 3. In-Browser Chunking & Context Retrieval (RAG)
- **`content.js`**: For long pages (>15,000 chars), split text into overlapping 1,500-char chunks.
- Calculate query relevance scores (TF-IDF / keyword similarity) to dynamically construct the optimal context window when answering long-form Q&A.

### 4. Custom Prompt Presets & Persona Manager
- **`popup.html` & `popup.js`**: Add Custom Presets Manager allowing users to define custom prompt titles (e.g., *"Code Extractor"*, *"Terms of Service Risk Auditor"*, *"Email Reply Draft"*) and system instructions.
- **`content.js` & `background.js`**: Dynamically render custom user presets in the sidebar preset bar and process their instructions.

## Verification Plan

### Automated Verification
- Run `node --check background.js content.js popup.js` to ensure syntax correctness.

### Manual Verification
- Test Built-in Chrome AI selection in popup options.
- Click `📸 Visual Analysis` -> verify screenshot captured and sent to OpenAI/Gemini vision handler.
- Add a custom preset in options (e.g. *"Code Extractor"*) -> verify it appears in the sidebar preset bar and generates targeted code analysis.
