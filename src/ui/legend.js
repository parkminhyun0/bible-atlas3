import { LEGEND } from '../lib/certainty.js';
import { RELIEF_TICKS, colorAt } from '../map/palette.js';

/**
 * 범례. **화면이 스스로 규칙을 밝히지 않으면 규칙이 없는 것과 같다.**
 *
 * 22번 문서가 요구하는 정직성 캡션 6항목의 자리도 여기에 둔다 —
 * 기법 · 커널 · 스트레치 · 과장 · 원 해상도 vs 표시 해상도 · 잡음 바닥.
 */
export function renderLegend({ exaggeration, sourceRes, shownRes, note,
                               contourInterval = null, reliefM = null }) {
  const el = document.getElementById('legend');
  if (!el) return;
  const rows = LEGEND.map(r => `
    <div class="legend-row">
      <span class="swatch" style="border-top-style:${r.dash === 'none' ? 'solid' : 'dashed'}"></span>
      <span>${r.ko} <small>${r.desc}</small></span>
    </div>`).join('');
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
    <div class="legend-title" style="margin-top:12px">자리의 확실성</div>
    ${rows}
    <div class="legend-row"><span>이름 뒤 <b>?</b></span> <small>동일시가 갈린다</small></div>
    <div class="caption">
      음영 과장 ${exaggeration}× · 원 자료 ${sourceRes} · 표시 ${shownRes}<br>
      ${contourInterval ? `등고선 간격 ${contourInterval} m — 이 구역에서 실측한 기복
        ${reliefM} m 에 맞춘 값이고 <b>지역마다 다르다</b>(바벨론 5 m · 시내 100 m).<br>` : ''}
      ${note}
    </div>`;
  el.hidden = false;
}
