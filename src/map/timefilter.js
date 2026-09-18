/**
 * 시대 거르기 — 고른 해에 무엇이 있었는가.
 *
 * **표현식 안에 해를 박아 넣고 `setPaintProperty` 로 갈아 끼운다.**
 * MapLibre 6 에 전역 상태(`setGlobalStateProperty`)가 있지만, 표현식 연산자가
 * 실재하는지 확인하지 못했다. 확인하지 못한 것에 기대지 않는다 — 슬라이더가
 * 움직일 때마다 칠을 갈아 끼우는 비용은 이 규모(수백 점)에서 문제가 되지 않는다.
 *
 * ## 세 상태
 *
 *   연대 있음 + 그 해에 존재  → 1.0
 *   연대 있음 + 그 해에 없음  → 0   (숨긴다)
 *   **연대 없음**             → 0.3 (**숨기지 않는다**)
 *
 * 마지막이 이 파일의 요점이다. 연대를 모르는 곳을 숨기면 화면이
 * "그때 거기 없었다" 고 말하게 된다 — 우리는 그것을 모른다.
 */

/** 연대가 없을 때의 흐림. 0 으로 두면 모르는 것이 없었던 것이 된다. */
const UNKNOWN_OPACITY = 0.3;

/** 한쪽 끝만 있는 연대도 받는다. 없는 쪽은 열린 것으로 본다. */
function inYear(year) {
  return [
    'all',
    ['<=', ['coalesce', ['get', 'p_from'], -1e9], year],
    ['>=', ['coalesce', ['get', 'p_to'], 1e9], year],
  ];
}

function opacityExpr(year, base) {
  return [
    'case',
    // 연대를 아예 모르는 곳 — 옅게 두되 지우지 않는다.
    ['all', ['!', ['has', 'p_from']], ['!', ['has', 'p_to']]], UNKNOWN_OPACITY,
    inYear(year), base,
    0,
  ];
}

/**
 * @param {object} map
 * @param {{enabled:boolean, year:number}} state
 */
export function applyTimeFilter(map, { enabled, year }, features = null) {
  if (!map.getLayer('place-dot')) return null;

  if (!enabled) {
    // 원래대로. 정확도를 모르는 자리를 옅게 두던 규칙으로 되돌린다.
    map.setPaintProperty('place-dot', 'circle-opacity',
      ['case', ['has', 'accuracy_m'], 1, 0.55]);
    map.setPaintProperty('place-label', 'text-opacity', 1);
    if (map.getLayer('alt-dot')) {
      map.setPaintProperty('alt-dot', 'circle-opacity', 0.9);
      map.setPaintProperty('alt-label', 'text-opacity', 1);
      map.setPaintProperty('alt-link', 'line-opacity', 0.25);
    }
    return null;
  }

  map.setPaintProperty('place-dot', 'circle-opacity', opacityExpr(year, 1));
  map.setPaintProperty('place-label', 'text-opacity', opacityExpr(year, 1));
  // 대안 후보는 연대를 갖지 않는다. 으뜸과 같은 잣대로 옅게 둔다.
  if (map.getLayer('alt-dot')) {
    map.setPaintProperty('alt-dot', 'circle-opacity', UNKNOWN_OPACITY);
    map.setPaintProperty('alt-label', 'text-opacity', UNKNOWN_OPACITY);
    map.setPaintProperty('alt-link', 'line-opacity', UNKNOWN_OPACITY * 0.5);
  }
  return countAt(features, year);
}

/**
 * 그 해의 숫자를 센다. **세 값을 다 보인다** — 모르는 곳이 몇인지가
 * 가장 중요한 정보다.
 *
 * 자료는 **우리가 들고 있는 것**을 센다. 처음에는 `source._data` 를 읽었는데
 * 그것은 사설 필드라 MapLibre 6 에서 비어 있었고, 숫자가 조용히 빈 칸으로
 * 나왔다 — 오류도 나지 않았다. 남의 속을 들여다보는 코드는 이렇게 조용히 죽는다.
 */
export function countAt(features, year) {
  if (!Array.isArray(features)) return null;
  const feats = features.filter(f => !f.properties?.is_alt);
  let present = 0, absent = 0, unknown = 0;
  for (const f of feats) {
    const p = f.properties || {};
    const has = p.p_from !== undefined || p.p_to !== undefined;
    if (!has) { unknown++; continue; }
    const from = p.p_from ?? -1e9;
    const to = p.p_to ?? 1e9;
    if (from <= year && to >= year) present++; else absent++;
  }
  return { present, absent, unknown, total: feats.length };
}
