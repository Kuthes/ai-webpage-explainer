# Technical Architecture — AI Webpage Explainer

This document outlines the technical design, system architecture, data flows, and security model of **AI Webpage Explainer**.

---

## 🏛️ System Overview

The extension uses Chrome Extension **Manifest V3** standards with an isolated Shadow DOM client architecture communicating asynchronously with an ephemeral Background Service Worker.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Webpage DOM (Browser Tab)                       │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Shadow DOM (#ai-explainer-root)                │   │
│   │  • Floating Action Button (FAB)                                │   │
│   │  • Slide-in Sidebar (Presets, Messages, Chat Input)            │   │
│   │  • Floating Selection Tooltip                                  │   │
│   │  • History Drawer & Message Action Toolbar (Copy/Download/TTS) │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                         chrome.runtime.sendMessage
                         chrome.runtime.onMessage
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Background Service Worker (background.js)           │
│                                                                        │
│  • Message Router (`explainContent`, `explainSelection`, `chat`)       │
│  • Provider Model Validator (`VALID_MODELS`, `DEFAULT_MODELS`)          │
│  • Role Normalizer (`normalizeMessages`)                               │
│  • Context Menu Handler (`chrome.contextMenus`)                        │
│  • Multi-Provider Handlers (Anthropic, OpenAI, Gemini, OpenRouter)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                HTTPS Fetch
                                    │
 ┌──────────────────────────────────▼──────────────────────────────────┐
 │                         External AI APIs                            │
 │  • https://api.anthropic.com/v1/messages                            │
 │  • https://api.openai.com/v1/chat/completions                       │
 │  • https://generativelanguage.googleapis.com/v1beta/models/...      │
 │  • https://openrouter.ai/api/v1/chat/completions                    │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Architecture Components

### 1. UI Injection & Shadow DOM (`content.js`, `styles.css`)
- **Isolation**: Injects `#ai-explainer-extension-host` into `document.body` and creates an open Shadow Root (`host.attachShadow({ mode: 'open' })`).
- **Styles**: Styles are loaded from `chrome.runtime.getURL('styles.css')` inside the shadow root, guaranteeing zero style leakage from or to the parent website.
- **Floating Tooltip**: Listens to `mouseup` / `keyup` text selections and calculates `getBoundingClientRect()` relative to `window.scrollX`/`scrollY` to position the selection tooltip.

### 2. Ephemeral Background Service Worker (`background.js`)
- **Stateless Execution**: Stores all credentials and preferences in `chrome.storage.local`. Service worker shuts down during inactivity and resumes seamlessly on message events.
- **Message Role Normalization (`normalizeMessages`)**: Enforces strict conversation structure (`user` -> `assistant` -> `user`) to prevent API provider validation rejections (such as Anthropic and Gemini 400 errors).
- **CORS Direct Access**: Direct fetch requests to Anthropic from browser workers include the mandatory `'anthropic-dangerous-direct-browser-access': 'true'` header.
- **Cross-Provider Model Protection**: Validates requested models against provider dictionaries to prevent cross-provider model ID mismatches when users change providers in options.

---

## 🔄 Data Flows

### 1. Page Content Extraction Flow
1. User clicks **"Explain Page"** or a **Preset Action Pill**.
2. `content.js` extracts main article DOM (`article`, `main`, `#content`, `.post`) and clones the tree.
3. Inserts spaces/newlines around block elements (`h1`-`h6`, `p`, `li`, `div`, `tr`, `br`) to prevent word smashing.
4. Sends `chrome.runtime.sendMessage({ action: 'explainContent', payload: pageContext })` to `background.js`.
5. Service worker routes to configured AI API handler and returns markdown response.
6. `content.js` renders markdown response and automatically persists summary to `chrome.storage.local` under `explanationHistory`.

### 2. Selection Explanation Flow
1. User highlights text on a webpage.
2. Floating tooltip (`✨ Explain Selection`) or right-click Context Menu (`"Explain selection with AI"`) is triggered.
3. `content.js` receives `triggerSelectionExplanation` message and launches sidebar.
4. `background.js` builds targeted snippet system prompt and requests AI explanation.

---

## 🔒 Security & Privacy Model

- **No Plaintext Credential Exposure**: API keys are stored locally in Chrome Storage (`chrome.storage.local`) and transmitted directly to official provider HTTPS endpoints.
- **Strict Policy Enforcement**: No `eval()`, `new Function()`, or dynamic code execution in extension contexts.
- **Web Accessible Scoping**: `styles.css` is declared under `web_accessible_resources` scoped strictly to extension Shadow DOM instances.
