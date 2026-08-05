# AI Webpage Explainer

A modern Chrome Extension (Manifest V3) that provides instant AI-powered explanations, selection analysis, quick presets, and chat functionality for any webpage. Seamlessly integrated into your browsing experience with a clean, slide-in Shadow DOM sidebar.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-V3-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

- **Multi-Provider Support**: Choose between Anthropic Claude, OpenAI GPT, Google Gemini, OpenRouter, or **Built-in Chrome AI (Gemini Nano)**.
- **⚡ Local AI / On-Device Processing**: Run offline explanations using Chrome's built-in `window.ai` (Gemini Nano) with zero latency and zero API cost.
- **📸 Multimodal Web Analysis (Vision)**: Capture page screenshots to analyze complex UI elements, charts, infographics, embedded tables, and visual layouts using GPT-4o or Gemini 2.0 Flash.
- **🧠 Context Retrieval & Chunking (RAG)**: Automatically chunks long articles (>15,000 chars) and performs semantic keyword retrieval to deliver precise answers without exceeding context windows.
- **⚙️ Custom Persona Presets**: Define custom prompt templates (e.g. *Code Extractor*, *Terms of Service Risk Auditor*, *Email Reply Draft*) in options and execute them with one click.
- **🛡️ PII Masking & Privacy Shield**: Automatic redaction toggle in options that redacts sensitive personal data (emails, phone numbers, credit card strings) as `[REDACTED_EMAIL]` and `[REDACTED_PHONE]` before sending content to AI cloud providers.
- **📊 Multi-Tab Webpage Comparison**: Synthesizes and compares open browser tabs across your current window with one click (`📊 Compare Tabs`).
- **🖍️ In-Context Inline Annotations**: Wraps selected text in visual `<mark class="ai-explainer-highlight">` markers directly on the webpage for Notion/Medium-style side comments.
- **🔗 Workspace Export Integrations**: One-click export summaries and saved snippets directly to Notion, Obsidian, Trello, or custom Webhook endpoints via settings.
- **🌐 Auto-Translation & Dual-Language Display**: Detects page language automatically and provides parallel side-by-side or translated dual-language summaries.
- **🔄 Smart Page Diffing / Change Tracking**: Saves local snapshots of visited URLs and offers a `"🔄 What Changed?"` preset to analyze policy updates, price changes, or structural page diffs since your last visit.
- **✨ Text Selection Explanation**:
  - Highlight text on any page to trigger a floating `✨ Explain Selection` tooltip.
  - Right-click highlighted text to use `"Explain selection with AI"` in the Chrome context menu.
- **⚡ One-Click Action Presets**:
  - 📌 **Executive Summary**: 3-sentence summary of core impacts.
  - 💡 **Key Takeaways**: Actionable bullet points highlighting key terms.
  - 👶 **ELI5**: Simple, non-technical plain English explanations.
  - ❓ **FAQs**: Top extracted Q&A pairs from the webpage.
  - 🌐 **Translate**: Dual-language summary and translation.
  - 📸 **Vision**: Multimodal visual analysis of layout and charts.
  - 📊 **Compare Tabs**: Multi-tab comparative synthesis across open browser tabs.
  - 🔄 **What Changed?**: Structural page diff tracking vs past visits.
- **🔊 Export & Voice Tools**:
  - 📋 **Copy**: One-click copy raw markdown or plain text to clipboard.
  - 📥 **Download**: Download summaries as `.md` documents.
  - 🔗 **Export**: Send summary payload directly to Notion / Obsidian Webhook.
  - 🔊 **Text-to-Speech (TTS)**: Listen to explanations out loud using browser Speech Synthesis.
- **📜 Persistent Summary History**: Automatically saves your recent explanations locally in `chrome.storage.local` with a slide-over history drawer.
- **Shadow DOM Isolation**: UI is completely isolated from website styles, ensuring CSS consistency on every webpage.

## 🛠️ Supported Providers & Models

| Provider | Recommended Models |
| :--- | :--- |
| **Built-in Chrome AI** | Gemini Nano (On-Device, Offline, Zero-Cost) |
| **Anthropic** | Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4 Sonnet |
| **OpenAI** | GPT-4o (Vision Supported), GPT-4o-mini, GPT-4.1 |
| **Google Gemini** | Gemini 2.0 Flash (Vision Supported), Gemini 2.5 Flash, Gemini 2.5 Pro |
| **OpenRouter** | OpenAI GPT-4o, Claude 4.5, Gemini 2.5 Pro, or Custom Model IDs |

## 📦 Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the root folder of this repository.

## ⚙️ Configuration

1. Click the extension icon in your Chrome toolbar.
2. Select your preferred **AI Provider**.
3. Select a **Model** from the dropdown.
4. Enter your **API Key** (stored securely in `chrome.storage.local`).
5. Click **Save Settings**.

## 📖 Usage

### Full Page Explanation
1. Visit any webpage you want to explore.
2. Click the **Indigo FAB** in the bottom-right corner.
3. Click **Explain Page** or select any **Action Preset** (`📌 Summary`, `💡 Takeaways`, `👶 ELI5`, `❓ FAQs`).
4. Use the chat box to ask follow-up questions about the page content.

### Selection Explanation
1. Highlight any text on a webpage.
2. Click the floating `✨ Explain Selection` button near your cursor, OR right-click and select `"Explain selection with AI"`.
3. The sidebar will open automatically with a targeted explanation of the selected snippet.

## 🏗️ Architecture, SEO & Publishing

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Detailed breakdown of Manifest V3 background service worker messaging, Shadow DOM injection, and multi-provider request normalization.
- **[CHROMEWEBSTORE.md](CHROMEWEBSTORE.md)**: Official Chrome Developer Dashboard submission metadata, permissions justifications, and privacy disclosures.
- **[SEO-STRATEGY.md](docs/seo/SEO-STRATEGY.md)**: Complete strategic SEO plan, competitor analysis, and 12-week organic growth roadmap.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
