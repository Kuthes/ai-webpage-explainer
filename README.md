# AI Webpage Explainer

A modern Chrome Extension (Manifest V3) that provides instant AI-powered explanations, selection analysis, quick presets, and chat functionality for any webpage. Seamlessly integrated into your browsing experience with a clean, slide-in Shadow DOM sidebar.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-V3-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

- **Multi-Provider Support**: Choose between Anthropic Claude, OpenAI GPT, Google Gemini, or OpenRouter.
- **✨ Text Selection Explanation**:
  - Highlight text on any page to trigger a floating `✨ Explain Selection` tooltip.
  - Right-click highlighted text to use `"Explain selection with AI"` in the Chrome context menu.
- **⚡ One-Click Action Presets**:
  - 📌 **Executive Summary**: 3-sentence summary of core impacts.
  - 💡 **Key Takeaways**: Actionable bullet points highlighting key terms.
  - 👶 **ELI5**: Simple, non-technical plain English explanations.
  - ❓ **FAQs**: Top extracted Q&A pairs from the webpage.
- **🔊 Export & Voice Tools**:
  - 📋 **Copy**: One-click copy raw markdown or plain text to clipboard.
  - 📥 **Download**: Download summaries as `.md` documents.
  - 🔊 **Text-to-Speech (TTS)**: Listen to explanations out loud using browser Speech Synthesis.
- **📜 Persistent Summary History**: Automatically saves your recent explanations locally in `chrome.storage.local` with a slide-over history drawer.
- **Shadow DOM Isolation**: UI is completely isolated from website styles, ensuring CSS consistency on every webpage.

## 🛠️ Supported Providers & Models

| Provider | Recommended Models |
| :--- | :--- |
| **Anthropic** | Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4 Sonnet |
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4.1 |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 1.5 Pro |
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

## 🏗️ Architecture & Publishing

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Detailed breakdown of Manifest V3 background service worker messaging, Shadow DOM injection, and multi-provider request normalization.
- **[CHROMEWEBSTORE.md](CHROMEWEBSTORE.md)**: Official Chrome Developer Dashboard submission metadata, permissions justifications, and privacy disclosures.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
