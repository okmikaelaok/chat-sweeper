/* Store IDs only, per provider. One key per chat avoids lost updates between tabs. */
globalThis.ChatProtection = {
  create(provider, onChange) {
    // Keep the legacy namespace so a ChatSweeper upgrade preserves existing protection.
    const prefix = `chat-manager:protected:${provider}:`;
    const ids = new Set();
    let loaded = false,
      error = null;
    async function refresh() {
      try {
        const values = await chrome.storage.local.get(null);
        ids.clear();
        for (const [key, value] of Object.entries(values))
          if (key.startsWith(prefix) && value === true)
            ids.add(key.slice(prefix.length));
        loaded = true;
        error = null;
      } catch (cause) {
        loaded = false;
        error = cause;
        throw new Error("Read failed. Reload tab.", { cause });
      }
    }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      const changedIds = [];
      for (const [key, value] of Object.entries(changes)) {
        if (!key.startsWith(prefix)) continue;
        const id = key.slice(prefix.length),
          protect = value.newValue === true;
        if (ids.has(id) !== protect) changedIds.push(id);
        protect ? ids.add(id) : ids.delete(id);
      }
      if (changedIds.length) onChange(changedIds);
    });
    return {
      refresh,
      get ready() {
        return loaded && !error;
      },
      get count() {
        return ids.size;
      },
      get ids() {
        return [...ids];
      },
      has(id) {
        return ids.has(id);
      },
      async set(id, protect) {
        try {
          if (protect) await chrome.storage.local.set({ [prefix + id]: true });
          else await chrome.storage.local.remove(prefix + id);
          protect ? ids.add(id) : ids.delete(id);
        } catch (cause) {
          loaded = false;
          error = cause;
          throw new Error("Save failed. Reload tab.", { cause });
        }
      },
    };
  },
};
