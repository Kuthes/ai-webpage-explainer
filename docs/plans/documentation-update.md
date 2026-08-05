# Implementation Plan — Documentation Update

Update project documentation to reflect all newly implemented features, architecture, and store readiness.

## Proposed Changes

### 1. Update `README.md`
- Add new features:
  - **Text Selection Explanation** (Floating action tooltip + Right-click context menu)
  - **One-Click Action Presets** (Executive Summary, Key Takeaways, ELI5, FAQs)
  - **Summary Export & Voice Tools** (Copy, `.md` File Download, Text-to-Speech audio)
  - **Local Summary History** (Persistent local history drawer)
- Update model list with current production models (Claude 3.7 Sonnet, GPT-4o, Gemini 2.0 Flash, etc.).
- Add link to [`CHROMEWEBSTORE.md`](../../CHROMEWEBSTORE.md) for publishing guidelines.

### 2. Create `docs/ARCHITECTURE.md`
- Detail system architecture (Content Script Shadow DOM, Background Service Worker, Chrome APIs, Multi-Provider Routers).
- Include sequence flow diagrams (Page Extraction, Selection Handling, Voice TTS, History Storage).

## Verification Plan

### Automated Verification
- Check markdown file links and syntax correctness.

### Manual Verification
- Review updated `README.md` and `docs/ARCHITECTURE.md` for clarity and completeness.
