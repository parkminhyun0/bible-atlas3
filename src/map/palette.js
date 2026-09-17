/**
 * 레반트 고도색.
 *
 * ## 관습 배색을 그대로 쓰면 본문을 왜곡한다
 *
 * 일반 지도책의 고도색은 저지대를 **짙은 초록**으로 칠한다. 습윤 온대를 전제한
 * 배색이다. 그것을 우리 무대에 그대로 얹으면 **네게브와 유대 광야가 초록으로
 * 칠해진다** — 본문이 "광야" 라 부르는 땅이 화면에서 목초지로 보인다.
 * 미감 문제가 아니라 본문 왜곡이다(노션 22번 2장).
 *
 * 그래서 **초록을 쓰지 않는다.** 모래·황토·바위의 색으로 간다.
 *
 * ## 고도만으로는 물을 알 수 없다
 *
 * 사해는 -430 m 이고 여리고는 -258 m 인데 **여리고는 마른 땅이다.**
 * "해수면 아래는 파랑" 으로 칠하면 요단 골짜기가 통째로 물이 된다.
 * 그래서 이 램프는 **물을 칠하지 않는다.** 물은 따로 온다(Natural Earth, 퍼블릭 도메인).
 * 그 전까지는 화면이 물을 모르는 채로 둔다 — 모르는 것을 아는 척하지 않는다.
 *
 * ## 기준 고도
 *
 * 우리 무대의 실제 값에 맞춘다. 알프스용 눈금을 쓰면 온 무대가 한 색이 된다.
 *   사해 -430 · 여리고 -258 · 해수면 0 · 브엘세바 260 · 예루살렘 760
 *   헤브론 930 · 갈릴리 산지 1,200 · 헤르몬 2,814 · 시내 2,285
 */

/** 고도(m) → 색. `color-relief-color` 는 이것을 `["elevation"]` 으로 보간한다. */
export const LEVANT_RELIEF = [
  'interpolate', ['linear'], ['elevation'],
  -450, '#6b6a63',   // 사해 바닥 — 회색빛. 파랑이 아니다(물은 따로 온다)
  -260, '#8c8371',   // 요단 골짜기 바닥 · 여리고
   -60, '#a89a80',
     0, '#c9bb9c',   // 해수면
   120, '#d9cba8',   // 해안 평야 · 세벨라
   300, '#d8c091',   // 구릉
   600, '#cbab76',   // 유대 산지 언저리
   800, '#bd9a63',
  1000, '#ab8553',   // 산지
  1400, '#977048',
  1900, '#856243',
  2400, '#8d7b6b',   // 바위 · 눈이 오래 남는 높이
  2900, '#cfc9c2',   // 헤르몬 꼭대기
];

/**
 * 이 램프가 무엇을 말하는지 화면이 밝히도록 범례에 쓸 눈금.
 * 색 띠만 두면 독자는 숫자를 읽을 수 없다.
 */
export const RELIEF_TICKS = [
  { m: -430, ko: '사해' },
  { m: 0, ko: '해수면' },
  { m: 760, ko: '예루살렘' },
  { m: 2814, ko: '헤르몬' },
];

/** 램프에서 그 고도의 색을 꺼낸다 — 범례 색 띠를 그리는 데 쓴다. */
export function colorAt(m) {
  const stops = [];
  for (let i = 3; i < LEVANT_RELIEF.length; i += 2) {
    stops.push([LEVANT_RELIEF[i], LEVANT_RELIEF[i + 1]]);
  }
  if (m <= stops[0][0]) return stops[0][1];
  if (m >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i++) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i];
    if (m > b) continue;
    const t = (m - a) / (b - a);
    const hex = c => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
    const A = hex(ca), B = hex(cb);
    const mix = A.map((v, k) => Math.round(v + (B[k] - v) * t));
    return '#' + mix.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return stops[stops.length - 1][1];
}
