/* Local test double only; never loaded by the extension manifest. */
(() => {
  const data = {},
    listeners = [];
  globalThis.storageFixture = {
    data,
    failReads: false,
    failWrites: false,
    writeDelayMs: 0,
  };
  chrome.storage = {
    onChanged: {
      addListener(listener) {
        listeners.push(listener);
      },
    },
    local: {
      async get() {
        if (storageFixture.failReads) throw new Error("Read failure");
        return { ...data };
      },
      async set(values) {
        if (storageFixture.writeDelayMs)
          await new Promise((resolve) =>
            setTimeout(resolve, storageFixture.writeDelayMs),
          );
        if (storageFixture.failWrites) throw new Error("Write failure");
        const changes = {};
        for (const [key, value] of Object.entries(values)) {
          changes[key] = { oldValue: data[key], newValue: value };
          data[key] = value;
        }
        listeners.forEach((listener) => listener(changes, "local"));
      },
      async remove(key) {
        if (storageFixture.writeDelayMs)
          await new Promise((resolve) =>
            setTimeout(resolve, storageFixture.writeDelayMs),
          );
        if (storageFixture.failWrites) throw new Error("Write failure");
        const oldValue = data[key];
        delete data[key];
        listeners.forEach((listener) =>
          listener({ [key]: { oldValue } }, "local"),
        );
      },
    },
  };
})();
