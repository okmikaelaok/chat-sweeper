globalThis.ChatSites = (() => {
  const geminiRows = '[data-test-id="conversation"], [data-conversation-id], [data-chat-id], .conversation[jslog], .conversation[id^="c_"]';
  const configs = {
    'gemini.google.com': {
      name:'Gemini', home:'https://gemini.google.com/app',
      path:/^(?:\/u\/\d+)?\/(?:app|conversation)\/([\w-]+)\/?$/,
      sidebar:'nav, aside, mat-sidenav, bard-sidenav, .sidenav, conversations-list, .chat-history-list, .conversation-items-container, [data-test-id="conversation"], .conversation, .conversation-item',
      row:'.conversation-items-container, [data-test-id="conversation"], .conversation, .conversation-item, [role="listitem"]',
      title:'.conversation-title, [data-test-id="conversation-title"]'
    },
    'chatgpt.com': {
      name:'ChatGPT', home:'https://chatgpt.com/',
      path:/^\/(?:g\/[^/]+\/)?c\/([\w-]+)\/?$/,
      sidebar:'nav, aside, #history, #history-list, #history-sidebar, #stage-slideover-sidebar, [data-testid="left-sidebar"]',
      row:'[data-testid^="history-item-"], [data-sidebar-item], li, [role="listitem"]',
      title:'[data-testid="conversation-title"], .truncate'
    }
  };
  configs['chat.openai.com'] = configs['chatgpt.com'];
  function label(el) {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    const copy = el.cloneNode(true);
    copy.querySelectorAll('mat-icon, .mat-icon, .material-icons, .material-symbols-outlined, .google-symbols, svg, [aria-hidden="true"], kbd').forEach(icon => icon.remove());
    return (copy.textContent || '').replace(/\s+/g,' ').trim();
  }
  function forLocation(loc) {
    const config = configs[loc.hostname];
    if (!config || loc.protocol !== 'https:') return null;
    const origin = loc.origin, gemini = config.name === 'Gemini';
    const targets = gemini ? 'a[href], ' + geminiRows : 'a[href]';
    const explicitSidebar = 'nav, aside, mat-sidenav, bard-sidenav, .sidenav, conversations-list, .chat-history-list';
    function hrefId(value) {
      try { const url = new URL(value,origin); return url.origin === origin ? url.pathname.match(config.path)?.[1] || null : null; }
      catch { return null; }
    }
    function id(el) {
      const href = el.getAttribute?.('href') || el.href;
      if (href) return hrefId(href);
      if (!gemini || !el.matches?.(geminiRows)) return null;
      const values = new Set();
      for (const attr of ['data-conversation-id','data-chat-id']) {
        const value = el.getAttribute(attr)?.trim();
        if (!value) continue;
        const parsed = hrefId(value) || (/^(?:c_)?[\w-]+$/.test(value) ? value.replace(/^c_/,'') : null);
        if (parsed) values.add(parsed);
      }
      const elementId = el.id?.match(/^c_([\w-]+)$/)?.[1];
      if (elementId) values.add(elementId);
      for (const match of (el.getAttribute('jslog') || '').matchAll(/\bc_([\w-]+)/g)) values.add(match[1]);
      // A title is never used as an ID, and conflicting metadata is not safe for deletion.
      return values.size === 1 ? [...values][0] : null;
    }
    function inSidebar(el) {
      return !!el.closest(config.sidebar) && (!el.closest('main, [role="main"]') || !!el.closest(explicitSidebar));
    }
    function candidates(container = document) { return [...container.querySelectorAll(targets)]; }
    function links() {
      const found = new Map();
      for (const el of candidates()) {
        const key = id(el);
        if (!key || !inSidebar(el)) continue;
        const previous = found.get(key);
        if (!previous || (!previous.getClientRects().length && el.getClientRects().length)) found.set(key,el);
      }
      return [...found.values()];
    }
    function urlForId(key) {
      const account = gemini ? loc.pathname.match(/^\/u\/\d+/)?.[0] || '' : '';
      return new URL((gemini ? account + '/app/' : '/c/') + encodeURIComponent(key),origin).href;
    }
    function url(el) {
      const href = el.getAttribute?.('href') || el.href;
      return href && hrefId(href) ? new URL(href,origin).href : urlForId(id(el));
    }
    function row(el) {
      const candidate = (gemini && el.closest('.conversation-items-container')) || el.closest(config.row);
      return candidate && !candidates(candidate).some(other => id(other) && id(other) !== id(el)) ? candidate : el;
    }
    function projectId(el) {
      if (gemini) return null;
      try { const parsed = new URL(el.href,origin); return parsed.origin === origin ? parsed.pathname.match(/^\/g\/(g-p-[\w-]+)(?:\/project)?\/?$/)?.[1] || null : null; }
      catch { return null; }
    }
    function menu(el) {
      let current = row(el);
      for (let i=0;current && i<5;i++,current=current.parentElement) {
        const ids = new Set(candidates(current).map(item => id(item) || projectId(item)).filter(Boolean));
        if (ids.size>1 || current.matches('nav, aside, body, main')) break;
        const controls = [...current.querySelectorAll('button, [role="button"]')].filter(button =>
          /^(?:more(?: options)?|options|conversation actions|open menu|open (?:conversation|chat) options)(?:\b|$)/i.test(label(button)) ||
          /more_vert|more_horiz/.test(button.textContent) ||
          button.getAttribute('data-testid') === 'history-item-options' ||
          (gemini && (button.getAttribute('data-test-id') === 'actions-menu-button' || button.classList.contains('conversation-actions-menu-button'))) ||
          button.getAttribute('aria-haspopup') === 'menu');
        if (controls.length===1) return controls[0];
        if (controls.length>1) return null;
      }
      return null;
    }
    function emptyMessage() {
      if (gemini) {
        const rows = [...document.querySelectorAll(geminiRows)].filter(inSidebar);
        if (rows.some(el => el.querySelector(config.title) && !id(el))) return 'Gemini chat rows were found, but their identifiers could not be read. This layout needs an update; these chats cannot be deleted.';
      }
      return 'No chats detected. Expand ' + config.name + '’s sidebar and Recent chats, then try Load more chats. Refresh the page after updating ChatSweeper.';
    }
    function isRelevantMutation(record) {
      const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (element && inSidebar(element)) return true;
      if (record.type !== 'childList') return false;
      return [...record.addedNodes, ...record.removedNodes].some(node =>
        node.nodeType === Node.ELEMENT_NODE && (
          inSidebar(node) || [...node.querySelectorAll(config.sidebar)].some(inSidebar)
        ));
    }
    return {...config,id,links,row,menu,label,url,urlForId,emptyMessage,isRelevantMutation};
  }
  return {forLocation};
})();
