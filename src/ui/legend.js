import { LEGEND } from '../lib/certainty.js';

/**
 * 범례. **화면이 스스로 규칙을 밝히지 않으면 규칙이 없는 것과 같다.**
 *
 * 22번 문서가 요구하는 정직성 캡션 6항목의 자리도 여기에 둔다 —
 * 기법 · 커널 · 스트레치 · 과장 · 원 해상도 vs 표시 해상도 · 잡음 바닥.
 */
export function renderLegend({ exaggeration, sourceRes, shownRes, note }) {
  const el = document.getElementById('legend');
  if (!el) return;
  const rows = LEGEND.map(r => `
    <div class="legend-row">
      <span class="swatch" style="border-top-style:${r.dash === 'none' ? 'solid' : 'dashed'}"></span>
      <span>${r.ko} <small>${r.desc}</small></span>
    </div>`).join('');
  el.innerHTML = `
    <div class="legend-title">자리의 확실성</div>
    ${rows}
    <div class="legend-row"><span>이름 뒤 <b>?</b></span> <small>동일시가 갈린다</small></div>
    <div class="caption">
      음영 과장 ${exaggeration}× · 원 자료 ${sourceRes} · 표시 ${shownRes}<br>
      ${note}
    </div>`;
  el.hidden = false;
}
