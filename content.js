/* content.js */

(function() {
  // Prevent multiple injections
  if (window.aiExplainerInjected) return;
  window.aiExplainerInjected = true;

  let sidebarOpen = false;
  let chatHistory = [];
  let pageContext = null;

  // 1. UI Injection
  const host = document.createElement('div');
  host.id = 'ai-explainer-extension-host';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Load Styles
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles.css');
  shadowRoot.appendChild(styleLink);

  // HTML Structure
  const container = document.createElement('div');
  container.id = 'ai-explainer-root';
  container.innerHTML = `
    <div id="fab" class="fab" title="Explain this page">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </div>
    <div id="sidebar" class="sidebar">
      <div class="sidebar-header">
        <h3>AI Explainer</h3>
        <button id="close-btn" class="close-btn">&times;</button>
      </div>
      <div id="chat-container" class="chat-container">
        <div id="messages" class="messages">
          <div class="message system">
            Click the button below to get an explanation of this page.
          </div>
        </div>
      </div>
      <div class="sidebar-footer">
        <div id="loading-indicator" class="loading-indicator hidden">
          <div class="spinner"></div>
          <span>Thinking...</span>
        </div>
        <div id="input-area" class="input-area hidden">
          <textarea id="chat-input" placeholder="Ask a follow-up question..."></textarea>
          <button id="send-btn" class="send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <button id="explain-btn" class="primary-btn">Explain Page</button>
      </div>
    </div>
  `;
  shadowRoot.appendChild(container);

  // Element Selectors
  const fab = shadowRoot.getElementById('fab');
  const sidebar = shadowRoot.getElementById('sidebar');
  const closeBtn = shadowRoot.getElementById('close-btn');
  const explainBtn = shadowRoot.getElementById('explain-btn');
  const messagesDiv = shadowRoot.getElementById('messages');
  const chatInput = shadowRoot.getElementById('chat-input');
  const sendBtn = shadowRoot.getElementById('send-btn');
  const loadingIndicator = shadowRoot.getElementById('loading-indicator');
  const inputArea = shadowRoot.getElementById('input-area');

  // 2. Event Listeners
  fab.addEventListener('click', toggleSidebar);
  closeBtn.addEventListener('click', toggleSidebar);
  explainBtn.addEventListener('click', startExplanation);
  
  sendBtn.addEventListener('click', handleChat);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  });

  // 3. Logic Functions
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    fab.classList.toggle('hidden', sidebarOpen);
  }

  function extractContent() {
    // Basic extraction logic
    const title = document.title;
    const url = window.location.href;
    
    // Select main content
    const selectors = ['article', 'main', '.content', '#content', '.post', '.article'];
    let mainElement = null;
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        mainElement = el;
        break;
      }
    }
    
    if (!mainElement) {
      mainElement = document.body;
    }

    // Clean content
    const clone = mainElement.cloneNode(true);
    const toRemove = clone.querySelectorAll('script, style, nav, footer, iframe, noscript, .ads, .sidebar');
    toRemove.forEach(el => el.remove());

    return {
      title,
      url,
      content: clone.innerText.replace(/\s+/g, ' ').trim().substring(0, 15000) // Limit content size
    };
  }

  async function startExplanation() {
    pageContext = extractContent();
    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'explainContent',
      payload: pageContext
    }, (response) => {
      setLoading(false);
      if (response && response.success) {
        addMessage('assistant', response.explanation);
        inputArea.classList.remove('hidden');
        chatHistory.push({ role: 'assistant', content: response.explanation });
      } else {
        addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
        explainBtn.classList.remove('hidden');
      }
    });
  }

  async function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    addMessage('user', text);
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'chat',
      payload: {
        history: chatHistory,
        message: text,
        context: pageContext
      }
    }, (response) => {
      setLoading(false);
      if (response && response.success) {
        addMessage('assistant', response.reply);
        chatHistory.push({ role: 'user', content: text });
        chatHistory.push({ role: 'assistant', content: response.reply });
      } else {
        addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
      }
    });
  }

  function addMessage(role, text) {
    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;
    
    // Simple markdown-ish rendering for assistant
    if (role === 'assistant') {
      msgEl.innerHTML = renderMarkdown(text);
    } else {
      msgEl.textContent = text;
    }
    
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function setLoading(loading) {
    loadingIndicator.classList.toggle('hidden', !loading);
    if (loading) {
      inputArea.classList.add('disabled');
    } else {
      inputArea.classList.remove('disabled');
    }
  }

  function renderMarkdown(text) {
    // Basic markdown renderer with support for common patterns
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .trim();
  }

})();
