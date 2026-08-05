/**
 * AI Webpage Explainer - Settings Popup Logic
 * Handles dynamic UI updates and multi-provider settings storage.
 */

const PROVIDER_MODELS = {
  anthropic: [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o-mini' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' }
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ],
  openrouter: [
    { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o' },
    { id: 'openai/gpt-4.1', name: 'OpenAI GPT-4.1' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
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
    if (result.provider && PROVIDER_MODELS[result.provider]) {
      providerSelect.value = result.provider;
    }
    
    // Model list repopulates before model restoration
    updateModelOptions(providerSelect.value);
    
    if (result.model) {
      const exists = Array.from(modelSelect.options).some(opt => opt.value === result.model);
      if (exists) {
        modelSelect.value = result.model;
      }
    }
    if (!modelSelect.value && modelSelect.options.length > 0) {
      modelSelect.selectedIndex = 0;
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
    if (modelSelect.options.length > 0) {
      modelSelect.selectedIndex = 0;
    }
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
    modelSelect.textContent = '';
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
