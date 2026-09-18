/**
 * 배색 — 버전 2 의 느낌을 물려받는다.
 *
 * 처음에 V3 는 "초록을 쓰지 않는다" 를 곧이곧대로 밀어 온 무대를 모래색 하나로
 * 칠했다. 노션 22번의 경고(관습 고도색의 짙은 초록이 네게브·유대 광야를
 * 목초지로 보이게 한다)는 옳지만, **버전 2 는 그 함정을 이미 피해 있었다** —
 * 선명한 초록이 아니라 **저채도 세이지**를 쓰고 그 까닭을 주석에 적어 두었다:
 *
 *   "저채도 황토색으로 사막·식생을 단정하지 않고 고도만 구분한다"
 *
 * 그래서 V2 의 값을 그대로 가져온다. 모래색 하나보다 땅의 높낮이가 읽히고,
 * 광야를 목초지로 보이게 하지도 않는다.
 *
 * ## V2 주석에 박혀 있던 교훈 둘 — 그대로 물려받는다
 *
 * **① 고도색은 어디서나 불투명하다.** 예전에 0 m 를 투명하게 두어 아래 바다색이
 * 비치게 했더니, DEM 이 '바다 0 m' 와 '나일 삼각주 육지 0 m'(실측 -0.2~+0.5 m)를
 * 구분하지 못해 **삼각주가 통째로 바다처럼 칠해졌다.** 바다는 고도가 아니라
 * 해안선 도형(OSM)이 그린다.
 *
 * **② 수심색은 -800 m 아래로만.** 고도만 보고 칠하면 해수면 아래 **육지**까지
 * 바다가 된다 — 요단 지구대 -200~-430 m, 카타라 -133 m. 지구상 해수면 아래
 * 육지의 최저점이 사해 수면(-430 m)이므로 -800 m 에서 자르면 걸리지 않는다.
 * 얕은 바다는 평면 바다색이 맡는다.
 */

/** 평면 바다색. 얕은 바다와 호수를 이 한 색으로 칠한다. */
export const SEA_FLAT = '#3a7fb5';

/**
 * 고도색. 설선을 인자로 받는다 — 위도에 따라 눈이 남는 높이가 다르다.
 * 레반트는 헤르몬(2,814 m)에 겨울 눈이 남으므로 2,400 쯤이 맞다.
 */
export function reliefRamp(snowLine = 2400) {
  const s = snowLine;
  // 암석대 시작. 401 하한은 저지대 스톱이 항상 살아남게 한다.
  const rock = Math.max(401, Math.min(2350, s - 250));
  // 저지대 색은 설선과 무관하게 고정한다. 설선이 내려오면 암석대에 먹히는
  // 스톱만 덜어낸다 — `interpolate` 는 입력이 강한 오름차순이어야 한다.
  const base = [
    [-450, '#b8c6a2'],   // 사해 주변 저지
    [0, '#c8d2a2'],
    [150, '#d5d2a0'],
    [400, '#d7c28f'],
    [800, '#c3a77f'],    // 저채도 황토 — 사막·식생을 단정하지 않고 고도만 구분
    [1300, '#a58e78'],
    [1900, '#8c7f73'],
  ].filter(([elev]) => elev < rock);

  return ['interpolate', ['linear'], ['elevation'],
    ...base.flat(),
    rock, '#7d7a74',      // 중립 회갈색 고산대
    s - 120, '#a9a59c',
    s, '#e9edf0',         // 설선
    s + 500, '#ffffff',
  ];
}

/** 기본 설선으로 만든 램프. 스타일이 이것을 쓴다. */
export const LEVANT_RELIEF = reliefRamp(2400);

/**
 * 해저 깊이색. **-800 m 아래로만** — 위 ② 의 까닭.
 * 지중해 최대 약 5,100 m, 홍해 약 2,500 m.
 */
export const BATHY_RAMP = ['interpolate', ['linear'], ['elevation'],
  -6000, '#0f2a4d',
  -4000, '#173b69',
  -2500, '#1e4f86',
  -1500, '#2a6aa5',
  -900, SEA_FLAT,             // 평면 바다색과 같게 두어 경계가 드러나지 않는다
  -800, 'rgba(0,0,0,0)',
];

/**
 * 하늘.
 *
 * V2 가 실측으로 얻은 값이다. **지표에서는 대기 산란을 완전히 끈다** —
 * 켜 두면 지평선 거리에 해당하는 화면 높이에 뚜렷한 가로 경계선이 생기고
 * (측정: 경계 강도 18.5, 끄면 6.1) 가까운 땅을 하얗게 덮는다.
 * 구형 뷰의 후광에는 필요하므로 저줌에만 남긴다.
 *
 * `fog-ground-blend: 1` 은 안개를 지평선 끝으로 민다 — 지형이 끝까지 선명하다.
 */
export const BASE_SKY = {
  'sky-color': '#4d8fd6',
  'horizon-color': '#cfe0ee',
  'fog-color': '#cfe0ee',
  'sky-horizon-blend': 0.7,
  'fog-ground-blend': 1,
  'horizon-fog-blend': 1,
  'atmosphere-blend': [
    'interpolate', ['linear'], ['zoom'],
    0, 0.9,     // 우주 — 지구 가장자리에 파란 테가 선다
    4, 0.6,
    6, 0.25,
    7, 0,       // 지표 — 완전히 끈다. 위 설명 참고
  ],
};

/** 범례 눈금. 색 띠만 두면 독자가 숫자를 읽을 수 없다. */
export const RELIEF_TICKS = [
  { m: -430, ko: '사해' },
  { m: 0, ko: '해수면' },
  { m: 760, ko: '예루살렘' },
  { m: 2814, ko: '헤르몬' },
];

/** 램프에서 그 고도의 색을 꺼낸다 — 범례 색 띠를 그리는 데 쓴다. */
export function colorAt(m) {
  const ramp = LEVANT_RELIEF;
  const stops = [];
  for (let i = 3; i < ramp.length; i += 2) stops.push([ramp[i], ramp[i + 1]]);
  const hex = c => (c.startsWith('rgba')
    ? [255, 255, 255]
    : [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)));
  if (m <= stops[0][0]) return stops[0][1];
  if (m >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i++) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i];
    if (m > b) continue;
    const t = (m - a) / (b - a);
    const A = hex(ca), B = hex(cb);
    const mix = A.map((v, k) => Math.round(v + (B[k] - v) * t));
    return '#' + mix.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return stops[stops.length - 1][1];
}
