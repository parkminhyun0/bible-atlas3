import { RELIEF_TICKS, colorAt } from '../map/palette.js';

/**
 * 범례. **화면이 스스로 규칙을 밝히지 않으면 규칙이 없는 것과 같다.**
 *
 * 22번 문서가 요구하는 정직성 캡션의 자리도 여기에 둔다 —
 * 과장 · 원 해상도 vs 표시 해상도 · 등고선 간격과 그 근거.
 *
 * 왼쪽으로 **밀어 넣을 수 있다.** 지형을 보는 화면에서 설명이 늘 자리를
 * 차지하면 정작 볼 것을 가린다. 접은 상태는 기억한다.
 *
 * (지명을 뺀 뒤로 '자리의 확실성' 항목은 뜻이 없어 걷어냈다. 지명을 되살릴 때
 *  `lib/certainty.js` 의 `LEGEND` 로 다시 붙이면 된다.)
 */
export function renderLegend({ exaggeration, sourceRes, shownRes, note,
                               contourInterval = null, reliefM = null }) {
  const el = document.getElementById('legend');
  if (!el) return;
  // 고도 띠. 색만 두면 독자가 숫자를 읽을 수 없으므로 눈금을 같이 둔다.
  const band = [];
  for (let m = -450; m <= 2900; m += 30) band.push(colorAt(m));
  const ticks = RELIEF_TICKS.map(t => {
    const x = ((t.m + 450) / 3350 * 100).toFixed(1);
    return `<span class="tick" style="left:${x}%"><i></i>${t.ko}<br><small>${t.m} m</small></span>`;
  }).join('');

  el.innerHTML = `
    <div class="legend-title">고도</div>
    <div class="relief-band" style="background:linear-gradient(90deg,${band.join(',')})"></div>
    <div class="relief-ticks">${ticks}</div>
    ${contourInterval ? `
    <div class="legend-title" style="margin-top:12px">등고선</div>
    <div class="legend-row">
      <span class="swatch" style="border-top-width:2px"></span>
      <span>굵은 선 <small>${contourInterval * 5} m 마다</small></span>
    </div>
    <div class="legend-row">
      <span class="swatch" style="border-top-width:1px"></span>
      <span>가는 선 <small>${contourInterval} m 마다</small></span>
    </div>` : ''}
    <div class="caption">
      음영 과장 ${exaggeration}× · 원 자료 ${sourceRes} · 표시 ${shownRes}<br>
      ${contourInterval ? `등고선 간격 ${contourInterval} m — 이 구역에서 실측한 기복
        ${reliefM} m 에 맞춘 값이고 <b>지역마다 다르다</b>(바벨론 5 m · 시내 100 m).<br>` : ''}
      ${note}
    </div>`;
  el.hidden = false;

  // 손잡이. `innerHTML` 로 내용을 갈아 끼우므로 매번 다시 단다.
  const handle = document.createElement('button');
  handle.className = 'legend-handle';
  handle.setAttribute('aria-label', '설명 접기/펴기');
  const paintHandle = () => {
    const closed = el.classList.contains('is-closed');
    handle.textContent = closed ? '›' : '‹';
    handle.title = closed ? '설명 펴기' : '설명 접기';
    el.setAttribute('aria-expanded', String(!closed));
  };
  handle.addEventListener('click', () => {
    el.classList.toggle('is-closed');
    paintHandle();
    // 접은 상태를 기억한다 — 접어 두고 새로고침했는데 다시 펴져 있으면
    // 접은 뜻이 사라진다.
    try { localStorage.setItem('legend-closed',
                               el.classList.contains('is-closed') ? '1' : '0'); } catch (e) {}
  });
  el.appendChild(handle);

  try {
    if (localStorage.getItem('legend-closed') === '1') el.classList.add('is-closed');
  } catch (e) {}
  paintHandle();
}
