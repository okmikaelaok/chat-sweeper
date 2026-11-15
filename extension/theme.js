globalThis.ChatSweeperTheme = {
  mount(target, select, onError = () => {}) {
    const key = 'chatsweeper:theme', media = matchMedia('(prefers-color-scheme: dark)');
    let mode = 'system', revision = 0;
    const valid = value => ['system', 'light', 'dark'].includes(value) ? value : 'system';
    function apply() {
      target.dataset.themeMode = mode;
      target.dataset.theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
      select.value = mode;
    }
    apply();
    const initialRevision = revision;
    chrome.storage.local.get(key).then(values => { if (revision === initialRevision) { mode = valid(values[key]); apply(); } }).catch(() => onError('Theme preference could not be loaded.'));
    select.addEventListener('change', () => {
      revision++; mode = valid(select.value); apply();
      chrome.storage.local.set({[key]: mode}).catch(() => onError('Theme changed for this tab, but could not be saved.'));
    });
    media.addEventListener('change', () => { if (mode === 'system') apply(); });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[key]) { revision++; mode = valid(changes[key].newValue); apply(); }
    });
  }
};
