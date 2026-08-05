# Chrome Web Store Listing — AI Webpage Explainer

> Last Updated: 2026-08-05

## Store Listing

**Extension Name**
AI Webpage Explainer

**Short Description**
Summarize and ask questions about any webpage using your choice of AI model (Claude, GPT-4o, Gemini, or OpenRouter).

**Detailed Description**
AI Webpage Explainer is a Chrome extension that extracts content from the active webpage and delivers clear, structured summaries and interactive Q&A using top-tier AI providers.

KEY FEATURES
• Multi-Provider Support: Connect your own API key for Anthropic Claude, OpenAI, Google Gemini, or OpenRouter.
• Intelligent Summarization: Get concise, well-formatted markdown summaries of articles, documentation, or long-form posts.
• Interactive Webpage Q&A: Chat directly with the webpage context to extract key statistics, ask follow-up questions, or get key takeaways.
• Privacy-First Key Storage: Your API keys are stored locally in your browser using Chrome Storage API and never transmitted to third-party servers outside official provider endpoints.

HOW TO USE IT
1. Click on the extension icon in your Chrome toolbar.
2. Select your preferred AI Provider and enter your API key in the settings panel.
3. Open any webpage and click "Explain Page" to generate a summary.
4. Use the built-in chat box to ask follow-up questions about the page content.

PRIVACY & SECURITY
Your data stays private. Webpage content is processed exclusively via direct requests to your selected AI provider's API. No personal identifiers or browsing history are stored or shared.

SUPPORT & FEEDBACK
For bug reports, feature requests, or documentation, visit our official repository.

**Category**
Productivity

**Single Purpose**
Extracts content from the current webpage to generate AI summaries and answer user questions about the page.

**Primary Language**
English


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
- **Screenshot 1**: Extension popup open over a web article showing the generated summary and provider selection dropdown.
- **Screenshot 2**: Interactive Q&A chat interface demonstrating follow-up questions on page content.
- **Screenshot 3**: Extension options/settings panel showing secure API key management for Anthropic, OpenAI, Gemini, and OpenRouter.


## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Required to save the user's chosen AI provider, model preferences, and encrypted API keys locally on their device. |
| `activeTab` | permissions | Required to access the active tab's URL and title when the user explicitly clicks the extension icon to summarize the current page. |
| `scripting` | permissions | Required to execute content extraction scripts on the active tab DOM to retrieve main text for AI processing. |
| `contextMenus` | permissions | Required to add an "Explain selection with AI" entry to the browser right-click context menu when text is selected. |
| `<all_urls>` | host_permissions | Required to extract webpage text and content across any website when requested by the user. |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | Yes | Yes (to chosen AI API) | API key authentication for AI services | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | Yes | Yes (to chosen AI API) | Sent to user's configured AI provider to generate summary | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL**: `https://github.com/Kuthes/ai-webpage-explainer/blob/main/PRIVACY.md`


## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free


## Developer Info

**Publisher Name**: AI Webpage Explainer Team
**Contact Email**: support@example.com
**Support URL / Email**: https://github.com/Kuthes/ai-webpage-explainer/issues
**Homepage URL**: https://github.com/Kuthes/ai-webpage-explainer


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-08-05 | Initial release with multi-provider AI support (Anthropic, OpenAI, Gemini, OpenRouter) and interactive page chat. | Draft |


## Review Notes

### Known Issues / Limitations
- Requires users to supply their own API keys for AI providers.
