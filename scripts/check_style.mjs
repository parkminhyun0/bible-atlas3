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
  placesUrl: 'https://example/places.json',
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

// ── 런타임에 갈아 끼우는 칠 ────────────────────────────────────────────
//
// 실제 스타일에 그 표현식을 심어 넣고 통째로 검사한다. 표현식만 따로 검사하는
// 공개 API 가 마땅치 않아, 스타일 검사기를 그대로 쓴다 — 어차피 같은 길이다.
{
  const { applyTimeFilter } = await import('../src/map/timefilter.js');
  const st = buildStyle(BASE);
  const byId = Object.fromEntries(st.layers.map(l => [l.id, l]));

  // `applyTimeFilter` 가 지도에 하는 일을 그대로 흉내 내는 가짜 지도.
  const fake = {
    getLayer: id => byId[id],
    getSource: () => null,
    setPaintProperty(id, prop, value) {
      if (!byId[id]) throw new Error(`없는 레이어에 칠을 걸었다: ${id}`);
      byId[id].paint = { ...(byId[id].paint || {}), [prop]: value };
    },
  };

  for (const [label, state] of [
    ['시대 끔', { enabled: false, year: -1000 }],
    ['시대 켬 BC 1000', { enabled: true, year: -1000 }],
  ]) {
    applyTimeFilter(fake, state);
    const errs = validateStyleMin(st);
    console.log('%s — 검사', label);
    for (const e of errs) console.error('  ✗ %s', e.message);
    failed += errs.length;
  }
}

console.log(failed ? `실패 — 문제 ${failed}건` : '통과 — 문제 없음');
process.exit(failed ? 1 : 0);
