/**
 * AI Webpage Explainer - Settings Popup Logic
 * Handles dynamic UI updates and multi-provider settings storage.
 */

const PROVIDER_MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet' },
    { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku' }
  ],
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o-mini' }
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
  ],
  openrouter: [
    { id: 'openai/gpt-4.1', name: 'OpenAI GPT-4.1' },
    { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'custom', name: 'Custom Model ID...' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const customModelContainer = document.getElementById('custom-model-container');
  const customModelInput = document.getElementById('custom-model');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  const keyInputs = {
    anthropic: document.getElementById('anthropicKey'),
    openai: document.getElementById('openaiKey'),
    gemini: document.getElementById('geminiKey'),
    openrouter: document.getElementById('openrouterKey')
  };

  const keyContainers = {
    anthropic: document.getElementById('anthropic-key-container'),
    openai: document.getElementById('openai-key-container'),
    gemini: document.getElementById('gemini-key-container'),
    openrouter: document.getElementById('openrouter-key-container')
  };

  // Load and Restore Settings
  chrome.storage.local.get([
    'provider', 'model', 'customModel',
    'anthropicKey', 'openaiKey', 'geminiKey', 'openrouterKey'
  ], (result) => {
    if (result.provider) {
      providerSelect.value = result.provider;
    }
    
    // Model list repopulates before model restoration
    updateModelOptions(providerSelect.value);
    
    if (result.model) {
      modelSelect.value = result.model;
    }
    
    if (result.customModel) {
      customModelInput.value = result.customModel;
    }
    
    // Restore all 4 keys on open
    Object.keys(keyInputs).forEach(p => {
      if (result[`${p}Key`]) {
        keyInputs[p].value = result[`${p}Key`];
      }
    });

    updateUI();
  });

  // Dynamic UI update on provider change
  providerSelect.addEventListener('change', () => {
    updateModelOptions(providerSelect.value);
    updateUI();
  });

  modelSelect.addEventListener('change', updateUI);

  // All 4 keys saved on save click
  saveBtn.addEventListener('click', () => {
    const settings = {
      provider: providerSelect.value,
      model: modelSelect.value,
      customModel: customModelInput.value.trim(),
      anthropicKey: keyInputs.anthropic.value.trim(),
      openaiKey: keyInputs.openai.value.trim(),
      geminiKey: keyInputs.gemini.value.trim(),
      openrouterKey: keyInputs.openrouter.value.trim()
    };

    chrome.storage.local.set(settings, () => {
      showStatus('Settings saved!', 'success');
    });
  });

  function updateModelOptions(provider) {
    modelSelect.innerHTML = '';
    const models = PROVIDER_MODELS[provider] || [];
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      modelSelect.appendChild(opt);
    });
  }

  function updateUI() {
    const provider = providerSelect.value;
    
    Object.values(keyContainers).forEach(c => c.classList.remove('active'));
    if (keyContainers[provider]) {
      keyContainers[provider].classList.add('active');
    }

    if (provider === 'openrouter' && modelSelect.value === 'custom') {
      customModelContainer.style.display = 'block';
    } else {
      customModelContainer.style.display = 'none';
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  }
});
