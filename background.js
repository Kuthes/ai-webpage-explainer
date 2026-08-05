/**
 * AI Webpage Explainer - Background Service Worker
 * Handles multi-provider API communication with normalized responses.
 */

const DEFAULT_MODELS = {
  anthropic: 'claude-3-7-sonnet-20250219',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  openrouter: 'openai/gpt-4o',
  'chrome-ai': 'gemini-nano'
};

const VALID_MODELS = {
  anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-sonnet-4-20250514'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
  openrouter: ['openai/gpt-4o', 'openai/gpt-4.1', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.5-pro', 'custom'],
  'chrome-ai': ['gemini-nano']
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['provider'], (result) => {
    if (!result.provider) {
      chrome.storage.local.set({
        provider: 'anthropic',
        model: DEFAULT_MODELS.anthropic
      });
    }
  });

  chrome.contextMenus.create({
    id: 'explainSelection',
    title: 'Explain selection with AI',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'explainSelection' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'triggerSelectionExplanation',
      selectionText: info.selectionText
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'compareTabs') {
    handleCompareTabs(sendResponse);
    return true;
  }
  if (request.action === 'explainVision') {
    handleVisionRequest(request.payload, sendResponse);
    return true;
  }
  if (request.action === 'explainContent' || request.action === 'explainSelection' || request.action === 'explainPreset') {
    handleRequest(request.action, request.payload, sendResponse);
    return true; // Mandatory for async sendResponse
  }
  if (request.action === 'chat') {
    handleRequest('chat', request.payload, sendResponse);
    return true; // Mandatory for async sendResponse
  }
});

/**
 * Multi-Tab Comparison Handler
 */
async function handleCompareTabs(sendResponse) {
  try {
    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      if (chrome.runtime.lastError || !tabs) {
        sendResponse({ success: false, error: 'Failed to query open browser tabs.' });
        return;
      }

      const tabSummaries = tabs
        .filter(t => t.title && t.url && !t.url.startsWith('chrome://'))
        .slice(0, 10)
        .map((t, idx) => `Tab ${idx + 1}: ${t.title} (URL: ${t.url})`)
        .join('\n');

      const payload = {
        title: 'Multi-Tab Comparison',
        content: `Here are the currently open browser tabs in this window:\n\n${tabSummaries}`
      };

      const systemPrompt = `You are a research synthesis analyst. Compare and contrast the themes, topics, and information across these open browser tabs. Highlight key overlaps, main differences, and actionable insights in clean markdown.`;

      const settings = await chrome.storage.local.get([
        'provider', 'model', 'customModel',
        'anthropicKey', 'openaiKey', 'geminiKey', 'openrouterKey'
      ]);

      const provider = settings.provider && DEFAULT_MODELS[settings.provider] ? settings.provider : 'anthropic';
      let model = settings.model || DEFAULT_MODELS[provider];
      const messages = [{ role: 'user', content: payload.content }];

      let resultText;
      switch (provider) {
        case 'anthropic':
          resultText = await handleAnthropic(model, systemPrompt, messages, settings.anthropicKey);
          break;
        case 'openai':
          resultText = await handleOpenAI(model, systemPrompt, messages, settings.openaiKey);
          break;
        case 'gemini':
          resultText = await handleGemini(model, systemPrompt, messages, settings.geminiKey);
          break;
        case 'openrouter':
          resultText = await handleOpenRouter(model, systemPrompt, messages, settings.openrouterKey);
          break;
        case 'chrome-ai':
          resultText = await handleChromeAI(systemPrompt, messages);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      sendResponse({ success: true, explanation: resultText, reply: resultText });
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Normalizes message list to guarantee it begins with 'user' role and alternates roles.
 * Prevents 400 Bad Request errors from Anthropic and Gemini APIs.
 */
function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return [{ role: 'user', content: 'Hello' }];
  }

  const cleaned = rawMessages.filter(m => m && typeof m.content === 'string' && m.content.trim() !== '');
  if (cleaned.length === 0) {
    return [{ role: 'user', content: 'Hello' }];
  }

  // Ensure first message is user role
  if (cleaned[0].role !== 'user') {
    cleaned.unshift({ role: 'user', content: 'Please summarize or answer based on the webpage context.' });
  }

  // Ensure strict alternation of user and assistant roles
  const result = [];
  cleaned.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'assistant';
    if (result.length > 0 && result[result.length - 1].role === role) {
      result[result.length - 1].content += `\n\n${msg.content}`;
    } else {
      result.push({ role, content: msg.content });
    }
  });

  return result;
}

/**
 * Routes requests to the appropriate AI provider handler.
 * @param {string} type - 'explain', 'explainSelection', 'explainPreset', or 'chat'
 * @param {object} payload - The content or message to process
 * @param {function} sendResponse - Chrome message response callback
 */
async function handleRequest(type, payload, sendResponse) {
  try {
    const settings = await chrome.storage.local.get([
      'provider', 'model', 'customModel',
      'anthropicKey', 'openaiKey', 'geminiKey', 'openrouterKey'
    ]);

    const provider = settings.provider && DEFAULT_MODELS[settings.provider] ? settings.provider : 'anthropic';
    let model = settings.model;
    
    // Validate model for current provider to prevent cross-provider model mismatch errors
    if (provider === 'openrouter') {
      if (model === 'custom') {
        if (!settings.customModel || !settings.customModel.trim()) {
          throw new Error('Please enter a custom model ID in the extension settings.');
        }
        model = settings.customModel.trim();
      } else if (!model || !model.includes('/')) {
        model = DEFAULT_MODELS.openrouter;
      }
    } else {
      const allowed = VALID_MODELS[provider] || [];
      if (!model || !allowed.includes(model)) {
        model = DEFAULT_MODELS[provider];
      }
    }

    const context = type === 'chat' ? payload.context : payload;
    const isSelection = type === 'explainSelection';
    const isPreset = type === 'explainPreset';

    let systemPrompt = `You are a helpful AI assistant that explains webpage content. 
Summarize the main points of the page provided. Be concise but thorough. 
Use markdown for formatting. 
Page Title: ${context?.title || 'Unknown Title'}
URL: ${context?.url || 'Unknown URL'}`;

    if (isSelection) {
      systemPrompt = `You are a helpful AI assistant. Explain the following text selection clearly and concisely in plain English. Use markdown formatting. Page Title: ${context?.title || 'Unknown Title'} (URL: ${context?.url || 'Unknown URL'})`;
    } else if (isPreset) {
      const mode = payload.mode;
      if (mode === 'summary') {
        systemPrompt = `You are an executive assistant. Provide a concise 3-sentence executive summary highlighting key facts and core impacts. Use markdown formatting. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'takeaways') {
        systemPrompt = `You are an analyst. Extract the top key takeaways and actionable bullet points from the page. Use clear bullet points and bold key terms. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'eli5') {
        systemPrompt = `You are an educator. Explain the content of this webpage in extremely simple, non-technical plain English as if explaining to a 5-year-old. Use relatable analogies. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'faqs') {
        systemPrompt = `You are a helpful assistant. Extract 3 to 5 key frequently asked questions (FAQs) and concise answers based on the page content. Format with bold Q: and A:. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'translate') {
        systemPrompt = `You are a linguist. Detect the primary language of this webpage and provide a dual-language summary: first a concise summary in its original language, followed by a clear English translation. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'diff') {
        systemPrompt = `You are a page diff and change tracker analyst. Compare the previous snapshot of this webpage against the current version. Identify what changed on this page since the last visit (e.g. policy updates, price changes, structural additions). Format as clear bullet points. Page Title: ${context?.title || 'Unknown Title'}`;
      } else if (mode === 'custom' && settings.customPresetPrompt) {
        systemPrompt = `${settings.customPresetPrompt}. Page Title: ${context?.title || 'Unknown Title'}`;
      }
    }

    let rawMessages = [];
    if (type === 'explain' || type === 'explainPreset') {
      let promptContent = `Please process the following content according to your instructions:\n\n${payload.content}`;
      if (payload.mode === 'diff' && payload.previousSnapshot) {
        promptContent = `Previous Snapshot:\n${payload.previousSnapshot}\n\nCurrent Version:\n${payload.content}`;
      }
      rawMessages = [{ role: 'user', content: promptContent }];
    } else if (type === 'explainSelection') {
      rawMessages = [{ role: 'user', content: `Please explain this selected text:\n\n"${payload.selectedText}"` }];
    } else {
      rawMessages = Array.isArray(payload.history) ? [...payload.history] : [];
      rawMessages.push({ role: 'user', content: payload.message });
    }

    const messages = normalizeMessages(rawMessages);

    let textResult;
    switch (provider) {
      case 'anthropic':
        textResult = await handleAnthropic(model, systemPrompt, messages, settings.anthropicKey);
        break;
      case 'openai':
        textResult = await handleOpenAI(model, systemPrompt, messages, settings.openaiKey);
        break;
      case 'gemini':
        textResult = await handleGemini(model, systemPrompt, messages, settings.geminiKey);
        break;
      case 'openrouter':
        textResult = await handleOpenRouter(model, systemPrompt, messages, settings.openrouterKey);
        break;
      case 'chrome-ai':
        textResult = await handleChromeAI(systemPrompt, messages);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    sendResponse({ success: true, explanation: textResult, reply: textResult });
  } catch (error) {
    console.error('API Request Failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Visual Analysis Capture Handler
 */
async function handleVisionRequest(payload, sendResponse) {
  try {
    const settings = await chrome.storage.local.get(['openaiKey', 'geminiKey', 'provider']);
    
    // Capture visible tab screenshot
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, async (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ success: false, error: 'Failed to capture tab screenshot. Please ensure active tab permission is enabled.' });
        return;
      }

      try {
        let resultText = '';
        const systemPrompt = `You are a visual web analyst. Analyze this screenshot of the webpage (${payload?.title || 'Webpage'}). Describe complex UI elements, charts, infographics, and embedded tables clearly in markdown.`;

        if (settings.openaiKey) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.openaiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Analyze this webpage screenshot and summarize visual layout, charts, and key elements.' },
                    { type: 'image_url', image_url: { url: dataUrl } }
                  ]
                }
              ],
              max_tokens: 1024
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || 'OpenAI Vision API Error');
          resultText = data.choices[0].message.content;
        } else if (settings.geminiKey) {
          const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { text: systemPrompt },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                ]
              }]
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error?.message || 'Gemini Vision API Error');
          resultText = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Visual analysis requires an OpenAI or Gemini API key in extension settings.');
        }

        sendResponse({ success: true, explanation: resultText, reply: resultText });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Built-in Chrome On-Device AI Handler (Gemini Nano)
 */
async function handleChromeAI(system, messages) {
  if (typeof self !== 'undefined' && self.ai && self.ai.languageModel) {
    try {
      const capabilities = await self.ai.languageModel.capabilities();
      if (capabilities.available !== 'no') {
        const session = await self.ai.languageModel.create({ systemPrompt: system });
        const lastMsg = messages[messages.length - 1].content;
        const result = await session.prompt(lastMsg);
        session.destroy();
        return result;
      }
    } catch (e) {
      console.warn('Chrome AI invocation warning:', e);
    }
  }

  return `⚡ **Built-in Chrome AI Notice**\n\nChrome On-Device AI (Gemini Nano) is currently not enabled or supported on your Chrome build.\n\n**To Enable Local Gemini Nano AI in Chrome:**\n1. Open \`chrome://flags/#optimization-guide-on-device-model\` and set to **Enabled BypassPerfRequirement**.\n2. Open \`chrome://flags/#prompt-api-for-gemini-nano\` and set to **Enabled**.\n3. Relaunch Chrome.\n\n*Alternatively, select Anthropic, OpenAI, or Gemini in extension settings.*`;
}

/**
 * Anthropic Claude API Handler
 */
async function handleAnthropic(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No Anthropic API key set. Please configure it in extension settings.');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Anthropic API Error (HTTP ${response.status})`);
  return data.content[0].text;
}

/**
 * OpenAI Chat Completions API Handler
 */
async function handleOpenAI(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No OpenAI API key set. Please configure it in extension settings.');

  const formattedMessages = [{ role: 'system', content: system }, ...messages];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages: formattedMessages, max_tokens: 1024 })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `OpenAI API Error (HTTP ${response.status})`);
  return data.choices[0].message.content;
}

/**
 * Google Gemini API Handler
 */
async function handleGemini(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No Gemini API key set. Please configure it in extension settings.');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 1024 }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini API Error (HTTP ${response.status})`);
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    const blockReason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Gemini request stopped: ${blockReason}` : (data.error?.message || 'Unexpected response format from Gemini API.'));
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * OpenRouter API Handler
 */
async function handleOpenRouter(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No OpenRouter API key set. Please configure it in extension settings.');
  if (!model) throw new Error('No model selected for OpenRouter.');

  const formattedMessages = [{ role: 'system', content: system }, ...messages];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'AI Webpage Explainer'
    },
    body: JSON.stringify({ model, messages: formattedMessages, max_tokens: 1024 })
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const errorMsg = typeof data.error === 'string' ? data.error : data.error?.message || `OpenRouter API Error (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Unexpected response format from OpenRouter API.');
  }
  return data.choices[0].message.content;
}
