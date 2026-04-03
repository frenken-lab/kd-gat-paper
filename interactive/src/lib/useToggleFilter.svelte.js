/**
 * Reusable toggle-filter state for data figures.
 * Tracks which categories are visible and filters data accordingly.
 *
 * @param {() => any[]} getData - reactive getter for the raw data array
 * @param {(d: any) => string} getKey - function to extract the category key from a datum
 */
export function useToggleFilter(getData, getKey) {
  // Eagerly initialize visible from the initial data so $derived works on first render
  const initData = getData();
  const initKeys = Array.isArray(initData) ? [...new Set(initData.map(getKey))] : [];
  let visible = $state(Object.fromEntries(initKeys.map((k) => [k, true])));

  $effect(() => {
    const data = getData();
    if (!Array.isArray(data) || data.length === 0) return;
    const keys = [...new Set(data.map(getKey))];
    // Only initialise keys that aren't already tracked
    for (const k of keys) {
      if (!(k in visible)) visible[k] = true;
    }
  });

  function toggle(key) {
    visible[key] = !visible[key];
  }

  const types = $derived(
    Array.isArray(getData()) ? [...new Set(getData().map(getKey))] : [],
  );

  const filtered = $derived(
    Array.isArray(getData()) ? getData().filter((d) => visible[getKey(d)]) : [],
  );

  return {
    visible,
    toggle,
    get types() {
      return types;
    },
    get filtered() {
      return filtered;
    },
  };
}
