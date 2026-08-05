# Site & Information Architecture — AI Webpage Explainer

> **Architecture Purpose**: URL hierarchy, Chrome Web Store structure, and GitHub Pages sitemap.

---

## 🌐 Web & Repository Information Hierarchy

```
https://github.com/Kuthes/ai-webpage-explainer/ (Root Repo)
│
├── README.md (Primary Product Landing Page & Features)
├── LICENSE (MIT Open-Source License)
├── PROVIDERS.md (Supported AI Provider Setup Guide)
├── CHROMEWEBSTORE.md (Web Store Metadata & Permissions Disclosures)
│
├── docs/ (Technical & Strategy Documentation)
│   ├── ARCHITECTURE.md (Manifest V3 Shadow DOM & Worker Design)
│   └── seo/
│       ├── SEO-STRATEGY.md
│       ├── COMPETITOR-ANALYSIS.md
│       ├── SITE-STRUCTURE.md
│       ├── CONTENT-CALENDAR.md
│       └── IMPLEMENTATION-ROADMAP.md
│
└── gh-pages/ (Optional Project Web Landing Site)
    ├── index.html (Product Showcase & One-Click Install Link)
    ├── privacy.html (Public Privacy Policy for CWS Verification)
    └── sitemap.xml
```

---

## 🏪 Chrome Web Store Asset Mapping

- **Store Listing Page**: Chrome Web Store Title, Short Description, Detailed Markdown Description.
- **Support & Docs Links**: Direct link to GitHub Issues and `PRIVACY.md`.
- **Media Gallery**:
  - Store Icon: 128×128 PNG (`icons/icon128.png`)
  - Screenshot 1: Full page summary with preset pills (1280×800)
  - Screenshot 2: Floating selection explanation tooltip in action (1280×800)
  - Screenshot 3: Multi-provider settings dropdown (Claude, OpenAI, Gemini, OpenRouter) (1280×800)
