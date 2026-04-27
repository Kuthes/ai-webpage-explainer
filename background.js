/**
 * AI Webpage Explainer - Background Service Worker
 * Handles multi-provider API communication with normalized responses.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'explainContent') {
    handleRequest('explain', request.payload, sendResponse);
    return true; // Mandatory for async sendResponse
  }
  if (request.action === 'chat') {
    handleRequest('chat', request.payload, sendResponse);
    return true; // Mandatory for async sendResponse
  }
});

/**
 * Routes requests to the appropriate AI provider handler.
 * @param {string} type - 'explain' or 'chat'
 * @param {object} payload - The content or message to process
 * @param {function} sendResponse - Chrome message response callback
 */
async function handleRequest(type, payload, sendResponse) {
  try {
    const settings = await chrome.storage.local.get([
      'provider', 'model', 'customModel',
      'anthropicKey', 'openaiKey', 'geminiKey', 'openrouterKey'
    ]);

    const provider = settings.provider || 'anthropic';
    let model = settings.model || 'claude-sonnet-4-20250514';
    
    if (provider === 'openrouter' && model === 'custom') {
      model = settings.customModel;
    }

    const context = type === 'explain' ? payload : payload.context;
    const systemPrompt = `You are a helpful AI assistant that explains webpage content. 
Summarize the main points of the page provided. Be concise but thorough. 
Use markdown for formatting. 
Page Title: ${context.title}
URL: ${context.url}`;

    let messages = [];
    if (type === 'explain') {
      messages = [{ role: 'user', content: `Please explain the following content:\n\n${payload.content}` }];
    } else {
      messages = payload.history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      messages.push({ role: 'user', content: payload.message });
    }

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
 * Anthropic Claude API Handler
 */
async function handleAnthropic(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No Anthropic API key set. Please configure it in extension settings.');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Anthropic API Error');
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
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI API Error');
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

  // Gemini URL uses encodeURIComponent(model)
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
  if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');
  return data.candidates[0].content.parts[0].text;
}

/**
 * OpenRouter API Handler
 */
async function handleOpenRouter(model, system, messages, apiKey) {
  if (!apiKey) throw new Error('No OpenRouter API key set. Please configure it in extension settings.');

  const formattedMessages = [{ role: 'system', content: system }, ...messages];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // OpenRouter HTTP-Referer set to chrome.runtime.getURL('')
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'AI Webpage Explainer'
    },
    body: JSON.stringify({ model, messages: formattedMessages, max_tokens: 1024 })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'OpenRouter API Error');
  return data.choices[0].message.content;
}
