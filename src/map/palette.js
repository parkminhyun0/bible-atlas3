/**
 * 배색 — 레반트 고도색.
 *
 * 노션 22번 문서 3.4 의 결정표를 그대로 구현한 것이다. 출발점은 버전 2 의
 * 저채도 세이지·황토였고, 거기에 Patterson & Jenny 의 **cross-blended
 * hypsometric tints** 논리를 얹었다.
 *
 * ## 왜 관습 배색을 못 쓰는가
 *
 * Bartholomew 가 대중화한 "저지대 짙은 초록 → 노랑 → 갈색 → 회색 → 흰색" 은
 * 스위스 알프스 풍경을 흉내낸 것이다. 독자는 고도색을 **기후·식생으로 오독**한다 —
 * Patterson & Jenny 가 지적하듯 페르시아만 연안이 울창한 숲으로 보인다.
 *
 * **성경 지도에서는 이것이 치명적이다.** 우리 무대의 상당 부분이 건조·반건조
 * 지대이고, 관습 배색을 그대로 쓰면 **네게브와 유대 광야가 초록으로 칠해진다.**
 * 본문이 "광야" 라 부르는 땅이 지도에서 목초지로 보이는 것은 미감 문제가 아니라
 * 본문 이해를 왜곡하는 오류다.
 *
 * ## 명도 — 규칙과, 우리가 택한 방향
 *
 * 순서 있는 자료(고도)는 색상이 아니라 **명도**로 순서를 전달해야 한다(Brewer).
 * 흑백 인쇄·적록색각이상(남성 8%)·저조도 화면에서 살아남는 유일한 방법이고,
 * 초록↔갈색은 색각이상자에게 가장 어려운 조합인데 하필 그것이 전통 고도색의 축이다.
 *
 * **그런데 '명도 단조 **증가**' 와 '고지대는 갈색' 은 원리적으로 충돌한다.**
 * 갈색은 어두운 주황이다. 밝게 만들면 살구색이 되고, 산지가 분홍빛으로 바랜다.
 * 실제로 단조 증가로 맞춰 보니 1,200 m 위가 전부 살구·분홍이 됐다.
 *
 * 그래서 **방향을 뒤집었다**: 해수면 66% → 2,150 m 17% 로 **단조 감소**한다.
 * "어두울수록 높다" 로 순서가 그대로 읽히고, 갈색이 있어야 할 자리에 있는다.
 * 건조지의 실제 땅빛과도 맞는다 — 평야는 밝은 모래·석회, 산지는 어두운 바위다.
 *
 * **암석대(2,200 m)에서 한 번 뒤집힌다**(17% → 92%). 흙과 관목이 끝나고 맨
 * 석회암과 눈이 시작되는 높이라 실제로 밝아진다. 결함이 아니라 지형이고,
 * `checkPalette()` 가 **그 한 번 말고 다른 뒤집힘이 없는지** 검사한다.
 *
 * ## 지킨 원칙 셋
 *
 * **① 저지대에 채도 높은 초록을 쓰지 않는다.** 해안평야·이스르엘은 실제로
 * 상대적 습윤·경작지라 **옅은 황록**까지만 간다. 남부 건조대는 같은 고도라도
 * 초록기를 빼고 카키·황갈로 간다 — cross-blend 원리의 국지 적용이다.
 *
 * **② 사해 바닥은 초록이 아니다.** 해수면 아래이지만 초록은 거짓이다.
 * 밝은 회백에 옅은 자홍기를 두어 **특이 지형임을 색으로 알린다.**
 * 이 구간은 순서가 아니라 **표식**이므로 단조 검사 바깥에 둔다.
 *
 * **③ 고도를 색으로만 말하지 않는다.** 등고선과 범례 구간표가 같은 정보를
 * 두 번째 경로로 전한다 — 색이 유일한 전달 수단인 정보를 만들지 않는다.
 * 그래서 색 배정이 관습을 조금 벗어나도 독자가 길을 잃지 않는다.
 *
 * ## V2 에서 물려받은 교훈 둘
 *
 * **고도색은 어디서나 불투명하다.** 0 m 를 투명하게 두면 DEM 이 '바다 0 m' 와
 * '나일 삼각주 육지 0 m'(실측 -0.2~+0.5 m)를 구분하지 못해 삼각주가 바다로
 * 칠해진다. 바다는 고도가 아니라 해안선 도형이 그린다.
 *
 * **수심색은 -800 m 아래로만.** 고도만 보고 칠하면 해수면 아래 **육지**까지
 * 바다가 된다 — 요단 지구대 -430 m, 카타라 -133 m.
 */

/** 평면 바다색. 얕은 바다와 호수를 이 한 색으로 칠한다. */
export const SEA_FLAT = '#3a7fb5';

/**
 * 암석대 시작 높이. **램프의 방향이 뒤집히는 유일한 자리**다.
 * 아래는 흙·관목이라 높을수록 어둡고, 위는 맨 석회암과 눈이라 높을수록 밝다.
 * 설선에서 200 m 아래로 둔다 — 헤르몬에서 식생 한계가 대략 그 높이다.
 */
export const rockLine = (snowLine = 2400) => snowLine - 200;

/**
 * 고도색 구간표. **이 표가 범례에 그대로 나간다** —
 * 색은 해석이지만 구간표는 사실이고, 구간표가 있으면 색이 거짓말이 되지 않는다.
 *
 * 설선을 인자로 받는다. 레반트는 헤르몬(2,814 m)에 겨울 눈이 남으므로 2,400 이다.
 */
export function reliefStops(snowLine = 2400) {
  return [
    // ── 해수면 아래: 순서 밖의 특이 지형 ──────────────────────────────
    // 사해·요단 지구대 저부. **초록 금지** — 해수면 아래이지만 초록은 거짓이다.
    // 밝은 회백에 옅은 자홍기를 두어 특이 지형임을 색으로 알린다.
    // 이 구간은 아래 '명도 단조' 규칙의 **바깥**이다(순서가 아니라 표식이다).
    [-430, '#d3c9cc', '사해 바닥'],
    [-250, '#d5cdc6', '여리고'],
    [-60, '#dcd5bd', ''],

    // ── 해수면 위: 실제 땅빛 ──────────────────────────────────────────
    // 해안평야·이스르엘은 상대적 습윤·경작지라 **옅은 황록**까지만 간다.
    // 채도 높은 초록은 쓰지 않는다 — 광야가 목초지로 보인다.
    [0, '#d8d7ab', '해수면'],
    [120, '#dad3a1', ''],
    [250, '#d9cb93', ''],
    // 셰펠라 — 황갈
    [400, '#d5c084', '셰펠라'],
    [550, '#cdb175', ''],
    // 유다·에브라임 산지 — 담갈
    [750, '#c2a169', '예루살렘 760'],
    [950, '#b5905f', ''],
    // 갈릴리 상부·트란스요르단 고원 — 갈색
    [1250, '#a67f57', ''],
    [1600, '#967152', ''],
    // 적갈 → 회갈. 1,000 m 이상은 지역과 무관하게 관습 색을 유지한다
    // (Patterson & Jenny — 독자가 붉은기·회색·흰색을 선호한다).
    [rockLine(snowLine) - 50, '#8d6b55', ''],

    // ── 암석대 위: 여기서 방향이 **한 번** 뒤집힌다 ────────────────────
    // 흙과 관목이 끝나고 맨 석회암이 드러나는 높이다. 위로 갈수록 밝아진다 —
    // 회갈 → 회색 → 눈. 이 뒤집힘이 램프 전체에서 유일하고, 그것을
    // `checkPalette()` 가 확인한다.
    [rockLine(snowLine), '#9a8d83', '암석대'],
    [snowLine - 100, '#bdb6b0', ''],
    // 실제로 적설
    [snowLine, '#ddd9d5', '설선'],
    [snowLine + 400, '#f7f5f3', '헤르몬 2814'],
  ];
}

/** MapLibre `color-relief-color` 가 먹는 꼴. 연속 보간이라 계단이 보이지 않는다. */
export function reliefRamp(snowLine = 2400) {
  const out = ['interpolate', ['linear'], ['elevation']];
  for (const [m, c] of reliefStops(snowLine)) out.push(m, c);
  return out;
}

export const LEVANT_RELIEF = reliefRamp(2400);

/**
 * 해저 깊이색. **-800 m 아래로만** — 고도만 보고 칠하면 요단 지구대가 바다가 된다.
 * 지중해 최대 약 5,100 m · 홍해 약 2,500 m.
 */
export const BATHY_RAMP = ['interpolate', ['linear'], ['elevation'],
  -6000, '#123457',
  -4000, '#1a456f',
  -2500, '#225a8d',
  -1500, '#2c6da4',
  -900, SEA_FLAT,             // 평면 바다색과 같게 두어 경계가 드러나지 않는다
  -800, 'rgba(0,0,0,0)',
];

/**
 * 하늘.
 *
 * V2 가 실측으로 얻은 값이다. **지표에서는 대기 산란을 완전히 끈다** —
 * 켜 두면 지평선 거리에 뚜렷한 가로 경계선이 생기고(측정: 경계 강도 18.5,
 * 끄면 6.1) 가까운 땅을 하얗게 덮는다. 구형 뷰의 후광에는 필요하므로 저줌에만.
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
    0, 0.9, 4, 0.6, 6, 0.25, 7, 0,
  ],
};

/** 범례 눈금. 구간표에서 이름이 붙은 것만 낸다. */
export const RELIEF_TICKS = reliefStops()
  .filter(s => s[2])
  .map(s => ({ m: s[0], ko: s[2] }));

function hexToRgb(c) {
  if (c.startsWith('rgba')) return [255, 255, 255];
  return [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
}

/** 램프에서 그 고도의 색을 꺼낸다 — 범례 색 띠를 그리는 데 쓴다. */
export function colorAt(m) {
  const stops = reliefStops();
  if (m <= stops[0][0]) return stops[0][1];
  if (m >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i++) {
    const [a, ca] = stops[i - 1];
    const [b, cb] = stops[i];
    if (m > b) continue;
    const t = (m - a) / (b - a);
    const A = hexToRgb(ca);
    const B = hexToRgb(cb);
    const mix = A.map((v, k) => Math.round(v + (B[k] - v) * t));
    return '#' + mix.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return stops[stops.length - 1][1];
}

/** 상대 명도(WCAG). 색상이 아니라 이 값이 순서를 전달해야 한다. */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 배색이 규칙을 지키는지 검산한다. **눈으로 보고 "괜찮네" 하지 않는다.**
 *
 * 검사하는 것은 '명도가 올라가는가' 가 아니라 **'순서가 한 방향으로 읽히는가'** 다.
 * 우리 램프는 아래로 간다(밝은 평야 → 어두운 산지). 방향은 규약이고, 규약을
 * 지키는지가 규칙이다.
 *
 *   ① 0 m 부터 암석대 직전까지 명도가 **단조 감소**하는가
 *   ② 암석대에서 **한 번만** 뒤집히는가 (맨바위와 눈은 밝다 — 관습이고 예외다)
 *   ③ 해수면 아래는 검사 밖 — 순서가 아니라 특이 지형 표식이다
 *   ④ 대비 폭이 충분한가 (해수면↔암석대 명도차가 너무 좁으면 순서가 안 보인다)
 *   ⑤ 저지대에 채도 높은 초록이 없는가 (광야가 목초지로 보이지 않는가)
 */
export function checkPalette(snowLine = 2400) {
  const stops = reliefStops(snowLine);
  const problems = [];

  // ── ③ 해수면 아래를 뺀다. 그 구간은 '낮다' 가 아니라 '여기는 다르다' 를 말한다.
  const rl = rockLine(snowLine);
  const ordered = stops.filter(s => s[0] >= 0 && s[0] < rl);
  const snowy = stops.filter(s => s[0] >= rl);

  // ── ① 0 m ~ 암석대 직전: 단조 감소
  for (let i = 1; i < ordered.length; i++) {
    const [pm, pc] = ordered[i - 1];
    const [m, c] = ordered[i];
    if (luminance(c) > luminance(pc) + 1e-6) {
      problems.push(
        `${pm}→${m} m (${pc}→${c}) 명도가 올라간다 — 이 구간은 내려가야 순서가 읽힌다`);
    }
  }

  // ── ② 암석대 위: 다시 단조 증가. 뒤집힘은 암석대 그 한 자리뿐이어야 한다
  for (let i = 1; i < snowy.length; i++) {
    const [pm, pc] = snowy[i - 1];
    const [m, c] = snowy[i];
    if (luminance(c) < luminance(pc) - 1e-6) {
      problems.push(`${pm}→${m} m (${pc}→${c}) 암석대 위에서 명도가 내려간다`);
    }
  }
  if (snowy.length && ordered.length) {
    const below = luminance(ordered[ordered.length - 1][1]);
    const above = luminance(snowy[0][1]);
    if (above <= below) {
      problems.push(`암석대(${rl} m)에서 색이 밝아지지 않는다 — 뒤집힘이 보이지 않는다`);
    }
  }

  // ── ④ 대비 폭. 해수면과 최고 산지(설선 아래)의 명도차가 25%p 는 돼야
  //     흑백에서도 '어디가 높은가' 가 보인다.
  if (ordered.length > 1) {
    const span = (luminance(ordered[0][1]) - luminance(ordered[ordered.length - 1][1])) * 100;
    if (span < 25) {
      problems.push(`해수면↔암석대 명도차 ${span.toFixed(0)}%p — 25%p 미만이면 순서가 안 보인다`);
    }
  }

  // ── ⑤ 저지대 초록. 500 m 아래에서 초록이 우세하면 광야가 목초지로 보인다.
  for (const [m, c] of stops) {
    const [r, g, b] = hexToRgb(c);
    if (m < 500 && g > r + 12 && g > b + 12) {
      problems.push(`${m} m (${c}) 저지대에 초록이 우세하다`);
    }
  }
  return problems;
}
