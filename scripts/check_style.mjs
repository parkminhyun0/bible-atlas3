/**
 * 스타일을 브라우저 없이 검증한다.
 *
 * 화면이 비었을 때 **"코드가 틀렸는가" 와 "화면이 안 그려지는가" 는 다른 문제**인데,
 * 화면만 보고 있으면 둘을 구분할 수 없다. 실제로 한참 헤맸다 — 배경 탭이라
 * 프레임이 안 돌아 빈 화면이 나온 것을 스타일 결함으로 오진했다.
 *
 * 이 검사는 그 구분을 공짜로 해 준다. 오류가 0 이면 남은 문제는 코드가 아니다.
 */
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { buildStyle } from '../src/map/style.js';

// 등고선이 있을 때와 없을 때를 **둘 다** 검사한다. 등고선은 실패하면 null 이
// 들어오므로 두 모양이 다 실제로 쓰인다.
const variants = [
  ['등고선 없음', { demUrl: 'https://tiles.example/{z}/{x}/{y}.webp',
                  placesUrl: 'https://example/places.json', demMaxZoom: 13 }],
  ['등고선 있음', { demUrl: 'https://tiles.example/{z}/{x}/{y}.webp',
                  placesUrl: 'https://example/places.json', demMaxZoom: 13,
                  contour: { url: 'contour://x/{z}/{x}/{y}', maxzoom: 14 } }],
];

let failed = 0;
for (const [label, opts] of variants) {
  const st = buildStyle(opts);
  const errs = validateStyleMin(st);
  const noMaxV = Object.entries(st.sources)
    .filter(([, v]) => v.type !== 'vector' && v.maxzoom === undefined)
    .map(([k]) => k);
  console.log('%s — 레이어 %d · 소스 %d', label, st.layers.length,
              Object.keys(st.sources).length);
  for (const e of errs) console.error('  ✗ %s', e.message);
  if (noMaxV.length) console.error('  ✗ maxzoom 없는 소스: %s', noMaxV.join(', '));
  failed += errs.length + noMaxV.length;
}
console.log(failed ? `실패 — 문제 ${failed}건` : '통과 — 문제 없음');
process.exit(failed ? 1 : 0);

// 아래는 쓰지 않는다 (위에서 종료)
const style = buildStyle({
  demUrl: 'https://tiles.example/{z}/{x}/{y}.webp',
  placesUrl: 'https://example/places.json',
  demMaxZoom: 13,
});

const errors = validateStyleMin(style);
console.log('레이어 %d개 · 소스 %d개',
            style.layers.length, Object.keys(style.sources).length);

// 우리 규칙: 모든 소스에 maxzoom 을 못 박는다. 기본값 22 로 두면 없는 줌을
// 만들어 내려다 메모리를 태운다. 벡터 타일 소스는 TileJSON 이 알려 주므로 뺀다.
const noMax = Object.entries(style.sources)
  .filter(([, v]) => v.type !== 'vector' && v.maxzoom === undefined)
  .map(([k]) => k);
if (noMax.length) {
  console.error('✗ maxzoom 이 없는 소스: %s', noMax.join(', '));
}

for (const e of errors) console.error('✗ %s', e.message);

const bad = errors.length + noMax.length;
console.log(bad ? `실패 — 문제 ${bad}건` : '통과 — 문제 없음');
process.exit(bad ? 1 : 0);
