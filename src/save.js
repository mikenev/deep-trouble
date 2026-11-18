// Pearls and upgrades persist between runs in localStorage, like the mute choice.
const KEY = 'deeptrouble.save';
const fresh = () => ({ pearls: 0, spear: 0, air: 0, remora: false });
let data = null;

export function load() {
  if (data) return data;
  try { data = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { data = fresh(); }
  const n = (v, max) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0);
  data.pearls = n(data.pearls, 1e6); data.spear = n(data.spear, 2); data.air = n(data.air, 2); data.remora = data.remora === true;
  return data;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(load())); } catch { /* private mode */ }
}
export function addPearls(n) { load().pearls += n; save(); return data.pearls; }
// for tests: forget the cached copy so a changed localStorage is read again
export function reload() { data = null; return load(); }
