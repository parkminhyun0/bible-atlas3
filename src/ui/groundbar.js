/**
 * 서서 보기 막대 — 선 자리와 바라보는 쪽을 보여 주고, 몸을 돌린다.
 *
 * 서서 보는 화면에서는 **어디에 서 있고 어느 쪽을 보는지**를 화면이 말해야 한다.
 * 그것이 없으면 독자는 방향 감각을 잃는다 — 위에서 내려다볼 때와 달리
 * 눈높이에서는 지도 전체가 보이지 않기 때문이다.
 */

const DIRS = [
  [0, '북'], [45, '북동'], [90, '동'], [135, '남동'],
  [180, '남'], [225, '남서'], [270, '서'], [315, '북서'],
];

function dirName(bearing) {
  const b = ((bearing % 360) + 360) % 360;
  let best = DIRS[0];
  let bestD = 360;
  for (const d of DIRS) {
    const diff = Math.min(Math.abs(d[0] - b), 360 - Math.abs(d[0] - b));
    if (diff < bestD) { bestD = diff; best = d; }
  }
  return best[1];
}

export function showGroundBar({ where, bearing, onTurn, onExit }) {
  const el = document.getElementById('groundbar');
  if (!el) return;
  el.innerHTML = `
    <button class="gb-left" title="왼쪽으로 돌기">↺</button>
    <span class="gb-where"></span>
    <span class="gb-dir"></span>
    <button class="gb-right" title="오른쪽으로 돌기">↻</button>
    <button class="gb-exit">위에서 보기</button>`;
  el.hidden = false;

  const whereEl = el.querySelector('.gb-where');
  const dirEl = el.querySelector('.gb-dir');
  let b = bearing;

  const paint = () => {
    whereEl.textContent = where;
    dirEl.textContent = `${dirName(b)} ${Math.round(((b % 360) + 360) % 360)}°`;
  };
  paint();

  const step = delta => {
    b = ((b + delta) % 360 + 360) % 360;
    paint();
    onTurn(b);
  };
  el.querySelector('.gb-left').addEventListener('click', () => step(-30));
  el.querySelector('.gb-right').addEventListener('click', () => step(30));
  el.querySelector('.gb-exit').addEventListener('click', onExit);

  // 화살표로도 돌 수 있게 — 눈높이에서는 이것이 가장 자연스럽다.
  const onKey = e => {
    if (el.hidden) return;
    if (e.key === 'ArrowLeft') { step(-15); e.preventDefault(); }
    if (e.key === 'ArrowRight') { step(15); e.preventDefault(); }
    if (e.key === 'Escape') onExit();
  };
  window.addEventListener('keydown', onKey);
  el._cleanup = () => window.removeEventListener('keydown', onKey);
}

export function hideGroundBar() {
  const el = document.getElementById('groundbar');
  if (!el) return;
  if (el._cleanup) el._cleanup();
  el.hidden = true;
}
