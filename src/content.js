(() => {
  const site = ChatSites.forLocation(location);
  if (!site) return;
  if (document.getElementById('chatsweeper-root')) return;
  const host = document.createElement('div');
  host.id = 'chatsweeper-root';
  document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const ui = ChatSweeperUI;
  root.innerHTML = `<style>${ui.styles}</style>${ui.shells[site.name]}`;
  const $ = id => root.getElementById(id);
  const scrollbarObserver = new ResizeObserver(entries => {
    for (const {target} of entries) {
      if (!target.getClientRects().length) continue;
      const width = `${target.offsetWidth - target.clientWidth}px`;
      if (target.style.getPropertyValue('--scrollbar-width') !== width) {
        target.style.setProperty('--scrollbar-width', width);
      }
    }
  });
  for (const section of [root.querySelector('.controls'), $('list')]) scrollbarObserver.observe(section);
  const chats = new Map();
  const selected = new Set();
  const savingProtection = new Set();
  const rowViews = new Map();
  let emptyListMessage = null;
  const PAGE_SIZE = 50, TITLE_MAX_CHARS = 80;
  let currentPage = 0;
  let busy = false, stopped = false, deletionRun = null;
  let scheduled = null, needsSidebarRefresh = false;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const visible = el => !!el && el.getClientRects().length > 0;
  const setText = (id, value) => {
    const node = $(id), text = String(value);
    if (node.textContent !== text) node.textContent = text;
  };
  let statusSource = 'protection';
  function briefStatus(message, source) {
    const text = String(message || '').replace(/\s+/g, ' ').trim().replace(/…$/, '');
    const fits = value => value.split(/\s+/).filter(Boolean).length <= 5 && Array.from(value).length <= 32;
    if (fits(text)) return text;
    const offPage = text.match(/^Deletion is permanent · (\d+) off-page\.$/);
    if (offPage) {
      const summary = `Permanent; ${offPage[1]} off-page.`;
      return fits(summary) ? summary : 'Off-page selections. Review.';
    }
    const summaries = [
      [/^Protection changed/i, 'Protection changed. Review.'],
      [/^Loading protection/i, 'Loading protection.'],
      [/^Scan limit reached/i, 'Scan limit reached. Load more.'],
      [/identifiers could not be read/i, 'Chat IDs unavailable.'],
      [/^No chats detected/i, 'No chats found. Check sidebar.'],
      [/is protected.*Deletion stopped/i, 'Chat protected. Stopped.'],
      [/^Close the open/i, 'Close the open popup.'],
      [/^Stopped before|^Deletion stopped/i, 'Deletion stopped.'],
      [/^Cannot locate/i, 'Chat not found. Stopped.'],
      [/expected control did not appear/i, 'Site control missing. Stopped.'],
      [/^Could not identify this chat/i, 'Chat menu unavailable.'],
      [/^Unrecognised confirmation/i, 'Confirmation not recognised.'],
      [/^Could not identify.*Delete confirmation/i, 'Delete confirmation unavailable.'],
      [/^Theme changed/i, 'Theme preference not saved.'],
      [/^Theme preference/i, 'Theme preference unavailable.'],
    ];
    return summaries.find(([pattern]) => pattern.test(text))?.[1]
      || (source === 'deletion' ? 'Deletion failed. Check details.' : 'Action stopped. Check details.');
  }
  const status = (message, source = null, detail = message) => {
    setText('status', briefStatus(message, source));
    $('status').title = detail;
    if (detail) $('status').setAttribute('aria-label', detail);
    else $('status').removeAttribute('aria-label');
    statusSource = source;
  };
  const protectionError = error => status(error.message, null, 'Protection unavailable. Deletion is disabled; reload this tab to retry.' + (error.cause?.message ? ' Browser error: ' + error.cause.message : ''));
  ChatSweeperTheme.mount(host, $('theme'), status);
  const protection = ChatProtection.create(site.name.toLowerCase(), changedIds => {
    for (const id of selected) if (protection.has(id)) selected.delete(id);
    if (busy) stopped = true;
    if (!changedIds.every(id => savingProtection.has(id))) status('Protection changed; review selection.');
    render();
  });
  protection.refresh().then(render).catch(e => { protectionError(e); render(); });
  const chatId = site.id;
  const links = site.links;
  function discover({prioritizeTop = false} = {}) {
    const seen = [];
    for (const link of links()) {
      const id = chatId(link);
      const title = (link.querySelector(site.title)?.textContent || link.getAttribute('title') || link.textContent || link.getAttribute('aria-label') || '').trim();
      if (!title) continue;
      const previous = chats.get(id);
      if (previous?.unresolved) chats.delete(id); // Restore actual sidebar order when a saved ID is discovered.
      chats.set(id, { id, title, url: site.url(link) });
      seen.push(id);
    }
    if (prioritizeTop && seen.length) {
      const container = scroller();
      if (!container || container.scrollTop <= 4) {
        const ordered = new Map(seen.map(id => [id, chats.get(id)]));
        for (const [id, chat] of chats) if (!ordered.has(id)) ordered.set(id, chat);
        chats.clear();
        for (const [id, chat] of ordered) chats.set(id, chat);
      }
    }
  }
  function filtered() {
    if (deletionRun) return deletionRun.rows;
    const query = $('search').value.toLocaleLowerCase().trim(), filter = $('filter').value;
    const rows = [...chats.values()].filter(c => (!c.unresolved || filter === 'protected') && c.title.toLocaleLowerCase().includes(query) && (filter === 'all' || filter === 'selected' && selected.has(c.id) || filter === 'protected' && protection.has(c.id) || filter === 'unprotected' && !protection.has(c.id)));
    return orderRows(rows);
  }
  function orderRows(rows) {
    const sort = $('sort').value;
    if (sort === 'az' || sort === 'za') rows.sort((a,b) => a.title.localeCompare(b.title) * (sort === 'az' ? 1 : -1));
    return rows;
  }
  function syncSavedProtection() {
    for (const [id, chat] of chats) if (chat.unresolved && !protection.has(id)) chats.delete(id);
    for (const id of protection.ids) if (!chats.has(id)) {
      chats.set(id, {id, title:'Protected chat · ' + id, url:site.urlForId(id), unresolved:true});
    }
  }
  function pageRows(rows = filtered()) { return rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE); }
  function shortTitle(value) {
    const characters = Array.from(value.replace(/\s+/g, ' ').trim());
    return characters.length > TITLE_MAX_CHARS ? characters.slice(0, TITLE_MAX_CHARS - 3).join('').trimEnd() + '...' : characters.join('');
  }
  function render() {
    syncSavedProtection();
    const rows = filtered();
    currentPage = Math.max(0, Math.min(currentPage, Math.ceil(rows.length / PAGE_SIZE) - 1));
    const visibleRows = pageRows(rows);
    const selectable = visibleRows.filter(c => !protection.has(c.id) && !savingProtection.has(c.id));
    const navigatingLocked = busy || $('aboutDialog').open;
    const locked = navigatingLocked || !!deletionRun;
    setText('count', [...chats.values()].filter(c => !c.unresolved).length);
    setText('protectedCount', protection.count);
    setText('selectionMetricLabel', deletionRun ? 'Deleted' : 'Selected');
    setText('pageInfo', rows.length ? 'Page ' + (currentPage + 1) + ' of ' + Math.ceil(rows.length / PAGE_SIZE) : 'No chats');
    $('previousPage').disabled = navigatingLocked || currentPage === 0;
    $('nextPage').disabled = navigatingLocked || (currentPage + 1) * PAGE_SIZE >= rows.length;
    $('about').disabled = busy;
    $('all').checked = selectable.length > 0 && selectable.every(c => selected.has(c.id));
    $('all').indeterminate = selectable.some(c => selected.has(c.id)) && !$('all').checked;
    const eligible = [...selected].filter(id => chats.has(id) && !protection.has(id) && !savingProtection.has(id));
    const shown = new Set(visibleRows.map(c => c.id));
    const hidden = eligible.filter(id => !shown.has(id)).length;
    setText('selection', deletionRun ? deletionRun.done + '/' + deletionRun.total : eligible.length);
    $('delete').disabled = locked || !protection.ready || !eligible.length;
    setText('deleteLabel', deletionRun ? 'Deleting chats…' : 'Delete selected chats');
    if (statusSource === 'selection') {
      status(eligible.length ? 'Deletion is permanent' + (hidden ? ' · ' + hidden + ' off-page' : '') + '.' : '', 'selection');
    }
    for (const id of ['search','filter','sort','all','scan']) $(id).disabled = locked;
    for (const id of ['delete','scan']) $(id).setAttribute('aria-disabled', String($(id).disabled || savingProtection.size > 0));
    $('all').disabled = locked || !protection.ready || !selectable.length;
    if (statusSource === 'protection') {
      status(protection.ready ? 'Protected chats excluded.' : 'Loading protection; deletion disabled.', 'protection');
    }
    $('stop').disabled = !busy;
    renderChatRows(visibleRows, locked);
  }
  function createChatRow(id) {
    const row = document.createElement('div');
    const check = document.createElement('input'); check.type = 'checkbox';
    check.onchange = () => {
      check.checked && !protection.has(id) && !savingProtection.has(id) ? selected.add(id) : selected.delete(id);
      status('', 'selection');
      render();
    };
    const a = document.createElement('a');
    const title = document.createElement('span'); title.className = 'chat-title';
    const metadata = document.createElement('small'); metadata.className = 'chat-meta'; metadata.id = 'chat-meta-' + id;
    const savedLabel = document.createElement('span'); savedLabel.className = 'chat-note'; savedLabel.hidden = true;
    const stateLabel = document.createElement('span'); stateLabel.className = 'chat-state'; stateLabel.hidden = true;
    metadata.append(savedLabel, stateLabel); metadata.hidden = true;
    const idLabel = document.createElement('small'); idLabel.className = 'chat-id'; idLabel.id = 'chat-id-' + id; idLabel.textContent = 'ID: ' + id;
    a.append(title, metadata, idLabel);
    a.setAttribute('aria-describedby', metadata.id + ' ' + idLabel.id);
    const lock = document.createElement('button'); lock.className = 'lock'; lock.innerHTML = ui.icons.shield;
    lock.onclick = () => setProtection(id, !protection.has(id));
    row.append(check, a, lock);
    return {row, check, a, title, metadata, savedLabel, stateLabel, lock};
  }
  function renderChatRows(visibleRows, locked) {
    const list = $('list');
    list.setAttribute('aria-busy', String(savingProtection.size > 0 || busy && !!deletionRun));
    const visibleIds = new Set(visibleRows.map(chat => chat.id));
    for (const [id, view] of rowViews) if (!visibleIds.has(id)) {
      view.row.remove(); rowViews.delete(id);
    }
    if (!visibleRows.length) {
      if (!emptyListMessage) emptyListMessage = document.createElement('p');
      const message = ![...chats.values()].some(c => !c.unresolved) && $('filter').value === 'all' && !$('search').value.trim() ? site.emptyMessage() : 'No chats match the current search or filter.';
      if (emptyListMessage.textContent !== message) emptyListMessage.textContent = message;
      if (emptyListMessage.parentNode !== list) list.append(emptyListMessage);
      return;
    }
    emptyListMessage?.remove();
    visibleRows.forEach((chat, index) => {
      let view = rowViews.get(chat.id);
      if (!view) { view = createChatRow(chat.id); rowViews.set(chat.id, view); }
      const {row, check, a, title, metadata, savedLabel, stateLabel, lock} = view;
      const protectedChat = protection.has(chat.id), saving = savingProtection.has(chat.id);
      row.className = protectedChat ? 'chat protected' : 'chat';
      row.dataset.chatId = chat.id;
      const recordedState = deletionRun?.states.get(chat.id);
      const state = recordedState === 'deleted' ? 'deleted' : protectedChat ? 'protected' : recordedState || '';
      row.dataset.state = state;
      if (state === 'deleting') row.setAttribute('aria-current', 'step'); else row.removeAttribute('aria-current');
      const stateText = {protected:deletionRun ? 'Protected · skipped' : 'Protected', queued:'Queued', deleting:'Deleting…', deleted:'Deleted', error:'Check required', stopped:'Not deleted'}[state] || '';
      stateLabel.hidden = !stateText;
      if (stateLabel.textContent !== stateText) stateLabel.textContent = stateText;
      savedLabel.hidden = !chat.unresolved;
      const savedText = chat.unresolved ? 'Saved protection · not loaded in this sidebar' : '';
      if (savedLabel.textContent !== savedText) savedLabel.textContent = savedText;
      metadata.hidden = !stateText && !chat.unresolved;
      check.checked = selected.has(chat.id); check.disabled = locked || !protection.ready || protectedChat || saving;
      check.setAttribute('aria-label', 'Select ' + chat.title);
      const displayedTitle = shortTitle(chat.title);
      if (title.textContent !== displayedTitle) title.textContent = displayedTitle;
      a.title = chat.title; a.setAttribute('aria-label', chat.title);
      if (a.getAttribute('href') !== chat.url) a.setAttribute('href', chat.url);
      a.onclick = locked ? e => e.preventDefault() : null;
      lock.title = saving ? 'Saving protection…' : protectedChat ? 'Unprotect chat' : 'Protect chat (prevent deletion)';
      lock.disabled = locked || !protection.ready;
      lock.setAttribute('aria-disabled', String(lock.disabled || saving));
      lock.setAttribute('aria-busy', String(saving));
      lock.setAttribute('aria-pressed', String(protectedChat));
      lock.setAttribute('aria-label', (protectedChat ? 'Unprotect ' : 'Protect ') + chat.title);
      // Keep unchanged rows mounted so updates preserve focus, scroll and layout.
      if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
    });
  }
  async function setProtection(id, protect) {
    if (busy || deletionRun || !protection.ready || savingProtection.has(id)) return;
    savingProtection.add(id); selected.delete(id); render();
    try { await protection.set(id, protect); }
    catch (e) { protectionError(e); }
    finally { savingProtection.delete(id); render(); resumeSidebarRefresh(); }
  }
  function toggle() {
    $('panel').hidden = !$('panel').hidden;
    if (!$('panel').hidden) {
      if (!deletionRun) { needsSidebarRefresh = false; currentPage = 0; discover({prioritizeTop:true}); }
      render();
    }
  }
  $('launch').onclick = toggle; $('close').onclick = () => { $('panel').hidden = true; };
  chrome.runtime.onMessage.addListener(message => { if (message.type === 'toggle-manager') toggle(); });
  for (const id of ['search','filter','sort']) $(id).addEventListener('input', () => {
    currentPage = 0;
    status('', 'sort');
    if (id === 'sort') {
      discover();
    }
    render();
  });
  $('all').onchange = () => { for (const c of pageRows()) $('all').checked && !protection.has(c.id) && !savingProtection.has(c.id) ? selected.add(c.id) : selected.delete(c.id); status('', 'selection'); render(); };
  $('previousPage').onclick = () => { if (currentPage > 0) currentPage--; render(); };
  $('nextPage').onclick = () => { if ((currentPage + 1) * PAGE_SIZE < filtered().length) currentPage++; render(); };
  const openAbout = ChatSweeperDialogs.anchor($('aboutDialog'), $('about'), $('panel'));
  $('about').onclick = () => { openAbout(); render(); };
  $('aboutClose').onclick = () => $('aboutDialog').close();
  $('aboutDialog').addEventListener('close', render);
  $('stop').onclick = () => { stopped = true; status('Stopping…'); };
  function scroller() {
    for (const link of links()) for (let el = link.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 30 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return el;
    }
    return null;
  }
  $('scan').onclick = async () => {
    if (busy || deletionRun || savingProtection.size) return;
    const scanStatus = message => status(message, 'scan');
    const knownIds = new Set([...chats.values()].filter(c => !c.unresolved).map(c => c.id));
    const completionMessage = () => {
      const added = [...chats.values()].filter(c => !c.unresolved && !knownIds.has(c.id)).length;
      return added ? 'Found ' + added + ' new ' + (added === 1 ? 'chat.' : 'chats.') : 'No new chats found.';
    };
    busy = true; stopped = false; currentPage = 0; render();
    try {
      scanStatus('Checking for new chats…');
      discover({prioritizeTop:true});
      const container = scroller();
      if (!container) {
        render();
        scanStatus(links().some(visible) ? completionMessage() : site.emptyMessage());
        return;
      }
      const resumeScrollTop = container.scrollTop;
      container.scrollTop = 0;
      // Let the site mount and update the latest rows before scanning older history.
      for (let pass = 0; pass < 4 && !stopped; pass++) {
        await sleep(300);
        discover({prioritizeTop:true}); render();
      }
      if (stopped) { scanStatus('Scan stopped.'); return; }
      scanStatus('Loading older chats…');
      if (resumeScrollTop > 4) {
        container.scrollTop = resumeScrollTop;
        await sleep(300); discover(); render();
      }
      let stable = 0, reachedEnd = false;
      for (let i = 0; i < 150 && !stopped; i++) {
        const before = chats.size, height = container.scrollHeight;
        container.scrollTop += Math.max(200, container.clientHeight * .8);
        await sleep(700); discover(); render();
        scanStatus('Loading older chats…');
        const bottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
        stable = bottom && before === chats.size && height === container.scrollHeight ? stable + 1 : 0;
        if (stable >= 4) { reachedEnd = true; break; }
      }
      scanStatus(stopped ? 'Scan stopped.' : reachedEnd ? completionMessage() : 'Scan limit reached; load more to resume.');
    } catch (e) { scanStatus(e.message); } finally { busy = false; render(); resumeSidebarRefresh(); }
  };
  async function waitFor(find, timeout = 5000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { const result = find(); if (result) return result; await sleep(100); }
    throw new Error(`${site.name}’s expected control did not appear. Deletion stopped; check the page before retrying.`);
  }
  const label = site.label;
  const menuSelector = '[role="menu"], .mat-mdc-menu-panel';
  const dialogSelector = '[role="dialog"], [role="alertdialog"], dialog[open]';
  async function assertUnprotected(chat) {
    await protection.refresh();
    if (protection.has(chat.id)) throw new Error(`“${shortTitle(chat.title)}” is protected. Deletion stopped.`);
  }
  function assertNoSitePopup() {
    if ([...document.querySelectorAll(dialogSelector + ', ' + menuSelector)].some(visible)) throw new Error(`Close the open ${site.name} dialog or menu before deleting.`);
  }
  async function openDeleteDialog(link) {
    link.scrollIntoView({block:'nearest'});
    const menu = site.menu(link);
    if (!menu) throw new Error(`Could not identify this chat’s menu. Expand the sidebar and try again.`);
    menu.click();
    const popup = await waitFor(() => {
      const controlled = menu.getAttribute('aria-controls');
      if (controlled) { const el = document.getElementById(controlled); return visible(el) && el.matches(menuSelector) ? el : null; }
      const menus = [...document.querySelectorAll(menuSelector)].filter(el => visible(el) && !el.parentElement?.closest(menuSelector));
      return menus.length === 1 ? menus[0] : null;
    });
    const remove = await waitFor(() => {
      const pattern = /^(?:delete|delete chat|delete conversation)$/i;
      const buttons = [...popup.querySelectorAll('[role="menuitem"], button')].filter(el => visible(el) && pattern.test(label(el)));
      return buttons.length === 1 ? buttons[0] : null;
    });
    if (stopped) throw new Error('Stopped before deletion. Close the open menu to cancel.');
    remove.click();
    const dialog = await waitFor(() => {
      const dialogs = [...document.querySelectorAll(dialogSelector)].filter(visible);
      return dialogs.length === 1 ? dialogs[0] : null;
    });
    const pattern = /delete\s+(?:this\s+)?(?:chat|conversation)/i;
    if (!pattern.test(dialog.textContent)) throw new Error('Unrecognised confirmation dialog. Deletion stopped.');
    return dialog;
  }
  async function deleteChat(chat) {
    await assertUnprotected(chat);
    assertNoSitePopup();
    let link = links().find(a => chatId(a) === chat.id && visible(a));
    if (!link) {
      const container = scroller();
      if (container) {
        container.scrollTop = 0; await sleep(500);
        for (let i = 0; i < 150 && !stopped; i++) {
          link = links().find(a => chatId(a) === chat.id && visible(a));
          if (link) break;
          const top = container.scrollTop; container.scrollTop += Math.max(200,container.clientHeight * .8); await sleep(400);
          if (container.scrollTop === top) break;
        }
      }
    }
    if (stopped) throw new Error('Deletion stopped.');
    if (!link) throw new Error(`Cannot locate “${shortTitle(chat.title)}” in the sidebar. Deletion stopped.`);
    const dialog = await openDeleteDialog(link);
    const confirmations = [...dialog.querySelectorAll('button')].filter(b => /^(delete|delete chat|delete conversation)$/i.test(label(b)) && !b.disabled && visible(b));
    if (confirmations.length !== 1) throw new Error(`Could not identify ${site.name}’s Delete confirmation.`);
    await assertUnprotected(chat);
    if (stopped) throw new Error(`Stopped before confirmation. Close the ${site.name} dialog to cancel.`);
    confirmations[0].click();
    await waitFor(() => !visible(dialog) && !links().some(a => chatId(a) === chat.id), 10000);
    chats.delete(chat.id); selected.delete(chat.id);
  }
  function followDeletion(id) {
    const index = deletionRun.rows.findIndex(chat => chat.id === id);
    currentPage = Math.floor(index / PAGE_SIZE);
    render();
    const row = rowViews.get(id)?.row;
    if (!row) return;
    const list = $('list'), rowBounds = row.getBoundingClientRect(), listBounds = list.getBoundingClientRect();
    if (rowBounds.top < listBounds.top || rowBounds.bottom > listBounds.bottom) {
      list.scrollTop += rowBounds.top - listBounds.top - Math.max(0, (list.clientHeight - rowBounds.height) / 2);
    }
  }
  $('delete').onclick = async () => {
    if (busy || savingProtection.size || $('aboutDialog').open) return;
    if (!protection.ready) return;
    const targets = new Set([...selected].filter(id => chats.has(id) && !protection.has(id)));
    if (!targets.size) { status('No unprotected chats selected.'); return; }
    // Keep a fixed view, including protected neighbours, while site rows disappear.
    const rows = orderRows([...chats.values()].filter(c => !c.unresolved).map(c => ({...c})));
    const queue = rows.filter(chat => targets.has(chat.id));
    const run = {rows, states:new Map(queue.map(c => [c.id, 'queued'])), total:queue.length, done:0, activeId:null};
    deletionRun = run; busy = true; stopped = false;
    status('Starting deletion…', 'deletion'); render();
    try {
      await protection.refresh();
      for (const chat of queue) {
        if (stopped) break;
        if (protection.has(chat.id)) {
          selected.delete(chat.id); run.states.set(chat.id, 'protected');
          followDeletion(chat.id); await sleep(250); continue;
        }
        run.activeId = chat.id; run.states.set(chat.id, 'deleting');
        status('Deleting…', 'deletion');
        followDeletion(chat.id);
        await sleep(150);
        if (stopped) break;
        await deleteChat(chat);
        run.done++; run.states.set(chat.id, 'deleted'); run.activeId = null;
        render(); await sleep(400);
      }
      status(stopped ? 'Deletion stopped.' : 'Deletion finished.', 'deletion');
    } catch (e) {
      if (run.activeId) run.states.set(run.activeId, protection.has(run.activeId) ? 'protected' : 'error');
      status(e.message, 'deletion');
    } finally {
      busy = false; deletionRun = null;
      render();
      resumeSidebarRefresh();
    }
  };
  function scheduleSidebarRefresh() {
    needsSidebarRefresh = true;
    if (scheduled !== null) return;
    scheduled = setTimeout(() => {
      scheduled = null;
      if (!needsSidebarRefresh || busy || deletionRun || $('panel').hidden) return;
      needsSidebarRefresh = false;
      discover({prioritizeTop:true}); render();
    }, 250);
  }
  function resumeSidebarRefresh() {
    if (needsSidebarRefresh && !busy && !deletionRun && !$('panel').hidden) scheduleSidebarRefresh();
  }
  new MutationObserver(records => {
    if (records.some(site.isRelevantMutation)) scheduleSidebarRefresh();
  }).observe(document.body, {
    childList:true, subtree:true, characterData:true, attributes:true,
    attributeFilter:['href','data-conversation-id','data-chat-id','data-test-id','data-testid','jslog','id','title','aria-label','class']
  });
  window.addEventListener('focus',scheduleSidebarRefresh);
  window.addEventListener('popstate',scheduleSidebarRefresh);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) scheduleSidebarRefresh(); });
})();
