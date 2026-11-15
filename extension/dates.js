/* Only explicit date metadata is used. Sidebar order and chat titles are not dates. */
globalThis.ChatDates = (() => {
  const attributes = Object.freeze(['datetime', 'data-date', 'data-timestamp', 'data-update-time', 'data-updated-at', 'data-create-time', 'data-created-at']);
  function day(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? value : null;
  }
  function parse(value) {
    if (!value) return null;
    value = String(value).trim();
    if (day(value)) return value;
    // Accept only explicit ISO timestamps with timezone or Unix second/millisecond metadata.
    let date;
    if (/^\d{10}$|^\d{13}$/.test(value)) date = new Date(Number(value) * (value.length === 10 ? 1000 : 1));
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && day(value.slice(0, 10))) date = new Date(value);
    if (!date || !Number.isFinite(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function read(row) {
    for (const el of [row, ...row.querySelectorAll(attributes.map(a => `[${a}]`).join(','))]) {
      for (const attr of attributes) {
        const value = parse(el.getAttribute(attr));
        if (value) return value;
      }
    }
    return null;
  }
  function compare(a, b, direction) {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return a.date.localeCompare(b.date) * (direction === 'oldest' ? 1 : -1);
  }
  return { attributes, day, parse, read, compare };
})();
