/** 화면에 한 줄 띄운다. 조용히 실패하는 것이 가장 나쁘다. */
export function banner(text, kind = 'info') {
  const el = document.getElementById('banner');
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
  el.hidden = false;
}
export function clearBanner() {
  const el = document.getElementById('banner');
  if (el) el.hidden = true;
}
