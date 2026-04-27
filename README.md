# AI Webpage Explainer

A modern Chrome Extension (Manifest V3) that provides instant AI-powered explanations and chat functionality for any webpage. Seamlessly integrated into your browsing experience with a clean, slide-in sidebar.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-V3-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

-   **Multi-Provider Support**: Choose between Anthropic Claude, OpenAI GPT, Google Gemini, or OpenRouter.
-   **Shadow DOM Isolation**: The UI is completely isolated from the website's styles, ensuring a consistent look on every page.
-   **Intelligent Content Extraction**: Surgically extracts main article content while ignoring ads, navigation, and noise.
-   **Interactive Chat**: Ask follow-up questions about the page content in real-time.
-   **Minimalist UI**: Floating Action Button (FAB) for quick access without cluttering your view.

## 🛠️ Supported Providers & Models

| Provider | Recommended Models |
| :--- | :--- |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku |
| **OpenAI** | GPT-4o, GPT-4o-mini |
| **Google Gemini** | Gemini 1.5 Pro, Gemini 1.5 Flash |
| **OpenRouter** | Any model supported via OpenRouter gateway |

## 📦 Installation

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top-right corner.
4.  Click **Load unpacked** and select the folder containing this extension.

## ⚙️ Configuration

1.  Click the extension icon in your Chrome toolbar.
2.  Select your preferred **AI Provider**.
3.  Enter your **API Key** (stored securely in `chrome.storage.local`).
4.  Select a **Model** from the dropdown.
5.  Click **Save Settings**.

## 📖 Usage

1.  Visit any webpage you want to explore.
2.  Click the **Indigo FAB** in the bottom-right corner.
3.  The sidebar will slide in. Click **Explain Page** to get a summary.
4.  Use the input area at the bottom to ask follow-up questions.

## 🏗️ Tech Stack

-   **Manifest V3**: Using the latest Chrome extension standards.
-   **Background Service Worker**: Handles all API communication and routing.
-   **Shadow DOM**: Used for UI injection to prevent style bleeding.
-   **Vanilla JS & CSS**: No heavy frameworks, ensuring high performance and small footprint.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
