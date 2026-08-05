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

  // HTML Structure using DOM APIs to avoid CSP issues with innerHTML
  const container = document.createElement('div');
  container.id = 'ai-explainer-root';

  // FAB
  const fab = document.createElement('div');
  fab.id = 'fab';
  fab.className = 'fab';
  fab.title = 'Explain this page';
  const svgNS = "http://www.w3.org/2000/svg";
  const fabSvg = document.createElementNS(svgNS, 'svg');
  fabSvg.setAttribute('width', '24');
  fabSvg.setAttribute('height', '24');
  fabSvg.setAttribute('viewBox', '0 0 24 24');
  fabSvg.setAttribute('fill', 'none');
  fabSvg.setAttribute('stroke', 'currentColor');
  fabSvg.setAttribute('stroke-width', '2');
  fabSvg.setAttribute('stroke-linecap', 'round');
  fabSvg.setAttribute('stroke-linejoin', 'round');
  const fabPath = document.createElementNS(svgNS, 'path');
  fabPath.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
  fabSvg.appendChild(fabPath);
  fab.appendChild(fabSvg);
  container.appendChild(fab);

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.className = 'sidebar';

  // Sidebar Header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-header';
  const headerTitle = document.createElement('div');
  headerTitle.className = 'header-title-container';
  const h3 = document.createElement('h3');
  h3.textContent = 'AI Explainer';
  const historyBtn = document.createElement('button');
  historyBtn.id = 'history-btn';
  historyBtn.className = 'icon-btn';
  historyBtn.title = 'View Summary History';
  historyBtn.textContent = '📜';
  headerTitle.appendChild(h3);
  headerTitle.appendChild(historyBtn);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-btn';
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  sidebarHeader.appendChild(headerTitle);
  sidebarHeader.appendChild(closeBtn);
  sidebar.appendChild(sidebarHeader);

  // History Drawer Overlay
  const historyDrawer = document.createElement('div');
  historyDrawer.id = 'history-drawer';
  historyDrawer.className = 'history-drawer hidden';
  sidebar.appendChild(historyDrawer);

  // Preset Actions Bar
  const presetBar = document.createElement('div');
  presetBar.className = 'preset-bar';

  const presets = [
    { id: 'summary', label: '📌 Summary' },
    { id: 'takeaways', label: '💡 Takeaways' },
    { id: 'eli5', label: '👶 ELI5' },
    { id: 'faqs', label: '❓ FAQs' },
    { id: 'translate', label: '🌐 Translate' },
    { id: 'vision', label: '📸 Vision' },
    { id: 'compare', label: '📊 Compare Tabs' }
  ];

  presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-pill';
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      if (p.id === 'vision') {
        startVisionExplanation();
      } else if (p.id === 'compare') {
        startCompareTabsExplanation();
      } else {
        startPresetExplanation(p.id);
      }
    });
    presetBar.appendChild(btn);
  });

  // Check for previous snapshot to render '🔄 What Changed?' button
  let previousSnapshotContent = null;
  chrome.storage.local.get(['pageSnapshots'], (res) => {
    const snapshots = res.pageSnapshots || {};
    const currentUrl = window.location.href;
    if (snapshots[currentUrl] && snapshots[currentUrl].content) {
      previousSnapshotContent = snapshots[currentUrl].content;
      const diffBtn = document.createElement('button');
      diffBtn.className = 'preset-pill';
      diffBtn.textContent = '🔄 What Changed?';
      diffBtn.addEventListener('click', () => startPresetExplanation('diff', previousSnapshotContent));
      presetBar.appendChild(diffBtn);
    }
  });

  // Load custom preset from chrome.storage.local if configured
  chrome.storage.local.get(['customPresetTitle'], (result) => {
    if (result.customPresetTitle && result.customPresetTitle.trim()) {
      const customBtn = document.createElement('button');
      customBtn.className = 'preset-pill';
      customBtn.textContent = `⚙️ ${result.customPresetTitle.trim()}`;
      customBtn.addEventListener('click', () => startPresetExplanation('custom'));
      presetBar.appendChild(customBtn);
    }
  });

  sidebar.appendChild(presetBar);

  // Chat Container
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chat-container';
  chatContainer.className = 'chat-container';
  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'messages';
  messagesDiv.className = 'messages';
  const systemMsg = document.createElement('div');
  systemMsg.className = 'message system';
  systemMsg.textContent = 'Click the button below to get an explanation of this page.';
  messagesDiv.appendChild(systemMsg);
  chatContainer.appendChild(messagesDiv);
  sidebar.appendChild(chatContainer);

  // Sidebar Footer
  const sidebarFooter = document.createElement('div');
  sidebarFooter.className = 'sidebar-footer';
  
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.className = 'loading-indicator hidden';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  const spinnerText = document.createElement('span');
  spinnerText.textContent = 'Thinking...';
  loadingIndicator.appendChild(spinner);
  loadingIndicator.appendChild(spinnerText);
  sidebarFooter.appendChild(loadingIndicator);

  const inputArea = document.createElement('div');
  inputArea.id = 'input-area';
  inputArea.className = 'input-area hidden';
  const chatInput = document.createElement('textarea');
  chatInput.id = 'chat-input';
  chatInput.placeholder = 'Ask a follow-up question...';
  const sendBtn = document.createElement('button');
  sendBtn.id = 'send-btn';
  sendBtn.className = 'send-btn';
  const sendSvg = document.createElementNS(svgNS, 'svg');
  sendSvg.setAttribute('width', '18');
  sendSvg.setAttribute('height', '18');
  sendSvg.setAttribute('viewBox', '0 0 24 24');
  sendSvg.setAttribute('fill', 'none');
  sendSvg.setAttribute('stroke', 'currentColor');
  sendSvg.setAttribute('stroke-width', '2');
  sendSvg.setAttribute('stroke-linecap', 'round');
  sendSvg.setAttribute('stroke-linejoin', 'round');
  const sendLine = document.createElementNS(svgNS, 'line');
  sendLine.setAttribute('x1', '22');
  sendLine.setAttribute('y1', '2');
  sendLine.setAttribute('x2', '11');
  sendLine.setAttribute('y2', '13');
  const sendPoly = document.createElementNS(svgNS, 'polygon');
  sendPoly.setAttribute('points', '22 2 15 22 11 13 2 9 22 2');
  sendSvg.appendChild(sendLine);
  sendSvg.appendChild(sendPoly);
  sendBtn.appendChild(sendSvg);
  inputArea.appendChild(chatInput);
  inputArea.appendChild(sendBtn);
  sidebarFooter.appendChild(inputArea);

  const explainBtn = document.createElement('button');
  explainBtn.id = 'explain-btn';
  explainBtn.className = 'primary-btn';
  explainBtn.textContent = 'Explain Page';
  sidebarFooter.appendChild(explainBtn);
  
  // Floating Selection Tooltip
  const tooltip = document.createElement('button');
  tooltip.id = 'selection-tooltip';
  tooltip.className = 'selection-tooltip hidden';
  tooltip.textContent = '✨ Explain Selection';
  container.appendChild(tooltip);

  sidebar.appendChild(sidebarFooter);
  container.appendChild(sidebar);

  shadowRoot.appendChild(container);

  // 2. Event Listeners
  fab.addEventListener('click', toggleSidebar);
  closeBtn.addEventListener('click', toggleSidebar);
  historyBtn.addEventListener('click', toggleHistoryDrawer);
  explainBtn.addEventListener('click', startExplanation);
  
  sendBtn.addEventListener('click', handleChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  });

  let activeSelectionText = '';

  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);

  tooltip.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeSelectionText) {
      const textToExplain = activeSelectionText;
      hideTooltip();
      startSelectionExplanation(textToExplain);
    }
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'triggerSelectionExplanation' && request.selectionText) {
      startSelectionExplanation(request.selectionText);
    }
  });

  function handleTextSelection(e) {
    if (host.contains(e.target)) return;

    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';

      if (text.length >= 3 && sel.rangeCount > 0) {
        activeSelectionText = text;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          tooltip.style.top = `${window.scrollY + rect.top - 44}px`;
          tooltip.style.left = `${window.scrollX + rect.left + (rect.width / 2) - 65}px`;
          tooltip.classList.remove('hidden');
          return;
        }
      }
      hideTooltip();
    }, 10);
  }

  function hideTooltip() {
    activeSelectionText = '';
    tooltip.classList.add('hidden');
  }

  function toggleHistoryDrawer() {
    const isHidden = historyDrawer.classList.contains('hidden');
    if (isHidden) {
      renderHistoryList();
      historyDrawer.classList.remove('hidden');
    } else {
      historyDrawer.classList.add('hidden');
    }
  }

  function renderHistoryList() {
    historyDrawer.textContent = '';
    
    const drawerHeader = document.createElement('div');
    drawerHeader.className = 'drawer-header';
    const drawerTitle = document.createElement('h4');
    drawerTitle.textContent = '📜 Saved Explanations';
    const drawerClose = document.createElement('button');
    drawerClose.className = 'close-btn';
    drawerClose.textContent = '×';
    drawerClose.addEventListener('click', toggleHistoryDrawer);
    drawerHeader.appendChild(drawerTitle);
    drawerHeader.appendChild(drawerClose);
    historyDrawer.appendChild(drawerHeader);

    const historyList = document.createElement('div');
    historyList.className = 'history-list';

    chrome.storage.local.get(['explanationHistory'], (result) => {
      const items = Array.isArray(result.explanationHistory) ? result.explanationHistory : [];
      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'No saved explanations yet.';
        historyList.appendChild(empty);
      } else {
        items.forEach((item) => {
          const card = document.createElement('div');
          card.className = 'history-card';

          const cardTitle = document.createElement('div');
          cardTitle.className = 'history-card-title';
          cardTitle.textContent = item.title || 'Untitled Webpage';

          const cardMeta = document.createElement('div');
          cardMeta.className = 'history-card-meta';
          cardMeta.textContent = item.timestamp || '';

          const cardPreview = document.createElement('div');
          cardPreview.className = 'history-card-preview';
          cardPreview.textContent = item.explanation ? (item.explanation.substring(0, 110) + '...') : '';

          card.appendChild(cardTitle);
          card.appendChild(cardMeta);
          card.appendChild(cardPreview);

          card.addEventListener('click', () => {
            toggleHistoryDrawer();
            messagesDiv.textContent = '';
            addMessage('assistant', item.explanation);
            inputArea.classList.remove('hidden');
            chatHistory = [
              { role: 'user', content: `Loaded explanation for: ${item.title}` },
              { role: 'assistant', content: item.explanation }
            ];
          });

          historyList.appendChild(card);
        });
      }
    });

    historyDrawer.appendChild(historyList);
  }

  function saveToHistory(title, url, explanation) {
    chrome.storage.local.get(['explanationHistory'], (result) => {
      const history = Array.isArray(result.explanationHistory) ? result.explanationHistory : [];
      history.unshift({
        title: title || document.title || 'Untitled Page',
        url: url || window.location.href,
        explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      chrome.storage.local.set({ explanationHistory: history.slice(0, 20) });
    });
  }

  // 3. Logic Functions
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    fab.classList.toggle('hidden', sidebarOpen);
  }

  function chunkText(fullText, chunkSize = 1500, overlap = 200) {
    if (!fullText) return [];
    const chunks = [];
    let start = 0;
    while (start < fullText.length) {
      const end = Math.min(start + chunkSize, fullText.length);
      chunks.push(fullText.substring(start, end));
      if (end >= fullText.length) break;
      start += (chunkSize - overlap);
    }
    return chunks;
  }

  function retrieveRelevantChunks(userQuery, textChunks, maxChunks = 3) {
    if (!textChunks || textChunks.length <= maxChunks) return textChunks.join('\n\n--- Chunk Break ---\n\n');
    const queryTerms = userQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTerms.length === 0) return textChunks.slice(0, maxChunks).join('\n\n--- Chunk Break ---\n\n');

    const scored = textChunks.map((chunk, idx) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      queryTerms.forEach(term => {
        const matches = (lower.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });
      return { chunk, score, idx };
    });

    scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
    const topChunks = scored.slice(0, maxChunks).sort((a, b) => a.idx - b.idx);
    return topChunks.map(c => c.chunk).join('\n\n--- Retrieved Segment ---\n\n');
  }

  function extractContent(userQuery = '') {
    const title = document.title;
    const url = window.location.href;
    
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
      mainElement = document.body || document.documentElement;
    }

    const clone = mainElement.cloneNode(true);
    const toRemove = clone.querySelectorAll('script, style, nav, footer, iframe, noscript, .ads, .sidebar');
    toRemove.forEach(el => el.remove());

    // Insert spaces around block elements so adjacent headers/paragraphs do not smash together
    const blockElements = clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, div, tr, br');
    blockElements.forEach(el => {
      el.prepend(document.createTextNode('\n'));
      el.append(document.createTextNode('\n'));
    });

    let fullRawText = clone.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    // Save snapshot locally for change tracking diffing
    savePageSnapshot(url, fullRawText);

    let processedContent = fullRawText;
    if (fullRawText.length > 15000) {
      const chunks = chunkText(fullRawText);
      processedContent = retrieveRelevantChunks(userQuery, chunks);
    }

    return {
      title,
      url,
      content: processedContent
    };
  }

  function sanitizePII(text, maskEnabled) {
    if (!maskEnabled || !text) return text;
    let sanitized = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
    sanitized = sanitized.replace(/\b\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '[REDACTED_PHONE]');
    return sanitized;
  }

  async function startCompareTabsExplanation() {
    sidebarOpen = true;
    sidebar.classList.add('open');
    fab.classList.add('hidden');

    messagesDiv.textContent = '';
    const sysMsg = document.createElement('div');
    sysMsg.className = 'message system';
    sysMsg.textContent = '📊 Synthesizing and comparing open browser tabs...';
    messagesDiv.appendChild(sysMsg);

    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.runtime.sendMessage({ action: 'compareTabs' }, (response) => {
      setLoading(false);
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        addMessage('system error', 'Extension context error. Please refresh the page.');
        explainBtn.classList.remove('hidden');
        return;
      }
      if (response && response.success) {
        addMessage('assistant', response.explanation);
        inputArea.classList.remove('hidden');
        saveToHistory('Multi-Tab Comparison', window.location.href, response.explanation);
        chatHistory = [
          { role: 'user', content: 'Compare active browser tabs' },
          { role: 'assistant', content: response.explanation }
        ];
      } else {
        addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
        explainBtn.classList.remove('hidden');
      }
    });
  }

  function savePageSnapshot(url, content) {
    chrome.storage.local.get(['pageSnapshots'], (res) => {
      const snapshots = res.pageSnapshots || {};
      snapshots[url] = {
        content: content.substring(0, 10000),
        timestamp: Date.now()
      };
      chrome.storage.local.set({ pageSnapshots: snapshots });
    });
  }

  function highlightSelectionRange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    try {
      const range = sel.getRangeAt(0);
      const mark = document.createElement('mark');
      mark.className = 'ai-explainer-highlight';
      mark.title = 'AI Explained Selection';
      range.surroundContents(mark);
    } catch (e) {
      console.warn('Inline highlight wrap exception:', e);
    }
  }

  async function startVisionExplanation() {
    pageContext = { title: document.title, url: window.location.href };
    sidebarOpen = true;
    sidebar.classList.add('open');
    fab.classList.add('hidden');

    messagesDiv.textContent = '';
    const sysMsg = document.createElement('div');
    sysMsg.className = 'message system';
    sysMsg.textContent = '📸 Capturing page screenshot for Visual Analysis...';
    messagesDiv.appendChild(sysMsg);

    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'explainVision',
      payload: {
        title: document.title,
        url: window.location.href
      }
    }, (response) => {
      setLoading(false);
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        addMessage('system error', 'Extension context error. Please refresh the page.');
        explainBtn.classList.remove('hidden');
        return;
      }
      if (response && response.success) {
        addMessage('assistant', response.explanation);
        inputArea.classList.remove('hidden');
        saveToHistory(pageContext.title, pageContext.url, response.explanation);
        chatHistory = [
          { role: 'user', content: 'Analyze visual layout and charts of this webpage' },
          { role: 'assistant', content: response.explanation }
        ];
      } else {
        addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
        explainBtn.classList.remove('hidden');
      }
    });
  }

  async function startExplanation() {
    pageContext = extractContent();
    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.storage.local.get(['maskPII'], (res) => {
      if (res.maskPII) {
        pageContext.content = sanitizePII(pageContext.content, true);
      }

      chrome.runtime.sendMessage({
        action: 'explainContent',
        payload: pageContext
      }, (response) => {
        setLoading(false);
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          addMessage('system error', 'Extension context error. Please refresh the page.');
          explainBtn.classList.remove('hidden');
          return;
        }
        if (response && response.success) {
          addMessage('assistant', response.explanation);
          inputArea.classList.remove('hidden');
          saveToHistory(pageContext.title, pageContext.url, response.explanation);
          chatHistory = [
            { role: 'user', content: `Please explain this page: ${pageContext.title}` },
            { role: 'assistant', content: response.explanation }
          ];
        } else {
          addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
          explainBtn.classList.remove('hidden');
        }
      });
    });
  }

  async function startSelectionExplanation(selectionText) {
    pageContext = { title: document.title, url: window.location.href };
    sidebarOpen = true;
    sidebar.classList.add('open');
    fab.classList.add('hidden');

    // Highlight text on active webpage
    highlightSelectionRange();

    messagesDiv.textContent = '';
    const sysMsg = document.createElement('div');
    sysMsg.className = 'message system';
    sysMsg.textContent = `Explaining selected text: "${selectionText.length > 80 ? selectionText.substring(0, 80) + '...' : selectionText}"`;
    messagesDiv.appendChild(sysMsg);

    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'explainSelection',
      payload: {
        title: document.title,
        url: window.location.href,
        selectedText: selectionText
      }
    }, (response) => {
      setLoading(false);
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        addMessage('system error', 'Extension context error. Please refresh the page.');
        explainBtn.classList.remove('hidden');
        return;
      }
      if (response && response.success) {
        addMessage('assistant', response.explanation);
        inputArea.classList.remove('hidden');
        saveToHistory(pageContext.title, pageContext.url, response.explanation);
        chatHistory = [
          { role: 'user', content: `Please explain this selected text:\n\n"${selectionText}"` },
          { role: 'assistant', content: response.explanation }
        ];
      } else {
        addMessage('system error', `Error: ${response?.error || 'Unknown error occurred'}`);
        explainBtn.classList.remove('hidden');
      }
    });
  }

  async function startPresetExplanation(mode, previousSnapshot = null) {
    pageContext = extractContent();
    sidebarOpen = true;
    sidebar.classList.add('open');
    fab.classList.add('hidden');

    messagesDiv.textContent = '';
    const sysMsg = document.createElement('div');
    sysMsg.className = 'message system';
    const modeTitles = {
      summary: 'Generating Executive Summary...',
      takeaways: 'Extracting Key Takeaways...',
      eli5: 'Generating ELI5 Explanation...',
      faqs: 'Extracting FAQs...',
      translate: 'Generating Dual-Language Summary...',
      diff: 'Comparing Page Snapshot Changes...'
    };
    sysMsg.textContent = modeTitles[mode] || 'Processing page with AI...';
    messagesDiv.appendChild(sysMsg);

    explainBtn.classList.add('hidden');
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'explainPreset',
      payload: {
        ...pageContext,
        mode,
        previousSnapshot
      }
    }, (response) => {
      setLoading(false);
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        addMessage('system error', 'Extension context error. Please refresh the page.');
        explainBtn.classList.remove('hidden');
        return;
      }
      if (response && response.success) {
        addMessage('assistant', response.explanation);
        inputArea.classList.remove('hidden');
        saveToHistory(pageContext.title, pageContext.url, response.explanation);
        chatHistory = [
          { role: 'user', content: `Generate ${modeTitles[mode] || mode} for this page` },
          { role: 'assistant', content: response.explanation }
        ];
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
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        addMessage('system error', 'Extension context error. Please refresh the page.');
        return;
      }
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
    
    if (role === 'assistant') {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'message-body';
      buildSafeMarkdown(text, bodyEl);
      msgEl.appendChild(bodyEl);

      const actionsBar = document.createElement('div');
      actionsBar.className = 'msg-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn';
      copyBtn.textContent = '📋 Copy';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      });

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'action-btn';
      downloadBtn.textContent = '📥 Download';
      downloadBtn.addEventListener('click', () => {
        downloadTextAsFile(text, pageContext?.title || document.title);
      });

      const speakBtn = document.createElement('button');
      speakBtn.className = 'action-btn';
      speakBtn.textContent = '🔊 Listen';
      speakBtn.addEventListener('click', () => {
        toggleSpeech(text, speakBtn);
      });

      const exportBtn = document.createElement('button');
      exportBtn.className = 'action-btn';
      exportBtn.textContent = '🔗 Export';
      exportBtn.addEventListener('click', async () => {
        chrome.storage.local.get(['webhookUrl'], async (res) => {
          if (!res.webhookUrl) {
            alert('Please configure your Workspace Export Webhook URL in extension settings.');
            return;
          }
          try {
            exportBtn.textContent = '⏳ Exporting...';
            await fetch(res.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: pageContext?.title || document.title,
                url: pageContext?.url || window.location.href,
                explanation: text,
                timestamp: new Date().toISOString()
              })
            });
            exportBtn.textContent = '✅ Exported!';
            setTimeout(() => { exportBtn.textContent = '🔗 Export'; }, 2000);
          } catch (err) {
            alert(`Export failed: ${err.message}`);
            exportBtn.textContent = '🔗 Export';
          }
        });
      });

      actionsBar.appendChild(copyBtn);
      actionsBar.appendChild(downloadBtn);
      actionsBar.appendChild(speakBtn);
      actionsBar.appendChild(exportBtn);
      msgEl.appendChild(actionsBar);
    } else {
      msgEl.textContent = text;
    }
    
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function downloadTextAsFile(text, title) {
    const safeTitle = (title || 'summary').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_summary.md`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  let activeUtterance = null;
  function toggleSpeech(text, btn) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btn.textContent = '🔊 Listen';
      return;
    }
    const cleanText = text.replace(/[#*`_\[\]]/g, '');
    activeUtterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterance.onend = () => { btn.textContent = '🔊 Listen'; };
    activeUtterance.onerror = () => { btn.textContent = '🔊 Listen'; };
    btn.textContent = '⏹️ Stop';
    window.speechSynthesis.speak(activeUtterance);
  }

  function setLoading(loading) {
    loadingIndicator.classList.toggle('hidden', !loading);
    if (loading) {
      inputArea.classList.add('disabled');
    } else {
      inputArea.classList.remove('disabled');
    }
  }

  function buildSafeMarkdown(text, container) {
    container.textContent = '';
    const blocks = text.split('\n\n');
    blocks.forEach(block => {
      block = block.trim();
      if (!block) return;
      
      if (block.startsWith('#')) {
        const match = block.match(/^(#{1,3})\s+(.*)/);
        if (match) {
          const level = match[1].length;
          const h = document.createElement(`h${level}`);
          buildInline(match[2], h);
          container.appendChild(h);
          return;
        }
      }
      
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const ul = document.createElement('ul');
        const items = block.split('\n');
        items.forEach(item => {
          const li = document.createElement('li');
          buildInline(item.replace(/^[-*]\s+/, ''), li);
          ul.appendChild(li);
        });
        container.appendChild(ul);
        return;
      }
      
      const p = document.createElement('p');
      const lines = block.split('\n');
      lines.forEach((line, idx) => {
        if (idx > 0) p.appendChild(document.createElement('br'));
        buildInline(line, p);
      });
      container.appendChild(p);
    });
  }

  function buildInline(text, parent) {
    let current = 0;
    const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|\[(.*?)\]\((.*?)\))/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > current) {
        parent.appendChild(document.createTextNode(text.substring(current, match.index)));
      }
      if (match[1].startsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = match[2];
        parent.appendChild(strong);
      } else if (match[1].startsWith('*')) {
        const em = document.createElement('em');
        em.textContent = match[3];
        parent.appendChild(em);
      } else if (match[1].startsWith('`')) {
        const code = document.createElement('code');
        code.textContent = match[4];
        parent.appendChild(code);
      } else if (match[1].startsWith('[')) {
        const a = document.createElement('a');
        a.textContent = match[5];
        if (match[6].startsWith('http://') || match[6].startsWith('https://')) {
          a.href = match[6];
        } else {
          a.href = '#';
        }
        a.target = '_blank';
        parent.appendChild(a);
      }
      current = regex.lastIndex;
    }
    if (current < text.length) {
      parent.appendChild(document.createTextNode(text.substring(current)));
    }
  }

})();
