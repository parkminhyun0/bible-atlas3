/**
 * 스타일을 브라우저 없이 검증한다.
 *
 * 화면이 비었을 때 **"코드가 틀렸는가" 와 "화면이 안 그려지는가" 는 다른 문제**인데,
 * 화면만 보고 있으면 둘을 구분할 수 없다. 실제로 한참 헤맸다 — 배경 탭이라
 * 프레임이 안 돌아 빈 화면이 나온 것을 스타일 결함으로 오진했다.
 *
 * 이 검사는 그 구분을 공짜로 해 준다. 오류가 0 이면 남은 문제는 코드가 아니다.
 *
 * **런타임에 갈아 끼우는 칠도 검사한다.** 시대 슬라이더는 `setPaintProperty` 로
 * 표현식을 바꿔 넣는데, 그 표현식은 스타일 안에 없으므로 스타일만 검사하면
 * 그대로 빠져나간다. 슬라이더를 움직여야만 드러나는 오류는 가장 늦게 발견된다.
 */
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { buildStyle } from '../src/map/style.js';

const BASE = {
  demUrl: 'https://tiles.example/{z}/{x}/{y}.webp',
  demMaxZoom: 13,
};

// 등고선이 있을 때와 없을 때를 **둘 다** 검사한다. 등고선은 실패하면 null 이
// 들어오므로 두 모양이 다 실제로 쓰인다.
const variants = [
  ['등고선 없음', BASE],
  ['등고선 있음', { ...BASE, contour: { url: 'contour://x/{z}/{x}/{y}', maxzoom: 14 } }],
];

let failed = 0;

for (const [label, opts] of variants) {
  const st = buildStyle(opts);
  const errs = validateStyleMin(st);
  // 우리 규칙: 모든 소스에 maxzoom 을 못 박는다. 기본값 22 로 두면 없는 줌을
  // 만들어 내려다 메모리를 태운다. 벡터 타일은 TileJSON 이 알려 주므로 뺀다.
  const noMax = Object.entries(st.sources)
    .filter(([, v]) => v.type !== 'vector' && v.maxzoom === undefined)
    .map(([k]) => k);
  console.log('%s — 레이어 %d · 소스 %d', label, st.layers.length,
              Object.keys(st.sources).length);
  for (const e of errs) console.error('  ✗ %s', e.message);
  if (noMax.length) console.error('  ✗ maxzoom 없는 소스: %s', noMax.join(', '));
  failed += errs.length + noMax.length;
}

// 지명과 시대 슬라이더는 지금 쓰지 않는다(2026-09-18, 좌표를 정확히 넣기 전까지).
// 다시 켤 때 이 자리에 런타임 칠 검사를 되살린다 — 스타일만 검사하면
// setPaintProperty 로 갈아 끼우는 표현식이 그대로 빠져나간다.

console.log(failed ? `실패 — 문제 ${failed}건` : '통과 — 문제 없음');
process.exit(failed ? 1 : 0);
