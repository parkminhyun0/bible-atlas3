/**
 * 등고선.
 *
 * MapLibre 코어에는 등고선이 없다. `maplibre-contour` 가 DEM 타일을 워커에서
 * 벡터 타일로 바꿔 준다.
 *
 * ## 버전 2 가 걸려 넘어진 자리 둘 — 그대로 물려받지 않는다
 *
 * **① 나중에 끼워 넣다 스타일 로딩과 경합했다.** 버전 2 는 체크박스를 켤 때
 * `map.addSource` 를 불렀고, 스타일이 아직이면 거절당해 "Style is not done
 * loading" 으로 죽었다. 재시도 루프까지 붙였으나 라이브에서 끝내 켜지지 않았다.
 * **V3 는 처음부터 스타일 안에 넣는다.** 경합할 자리를 없앤다.
 *
 * **② `cacheSize` 가 아이폰을 죽였다.** 적지 않으면 100 이고, 그 값이
 * tileCache·parsedCache·contourCache **세 곳에 각각** 쓰인다. 해독된 DEM 한 장이
 * 512×512 실수 배열(약 1 MB)이라 parsedCache 만으로 100 MB 에 이른다. 게다가 이
 * 캐시는 라이브러리가 따로 쥐고 있어 지도의 `maxTileCacheSize` 가 미치지 않는다.
 * 실제 강제종료 기록: 3D 지형 켬 · 등고선 켬 · 기울기 64° · 확대 14.52 —
 * **같은 DEM 을 지형과 등고선이 두 경로로 동시에 해독**하고 있었다.
 *
 * ## 간격은 지역마다 다르다
 *
 * 실측값(`measure_relief.py`)이 바벨론 5 m 부터 시내 100 m 까지 **20배** 벌어진다.
 * 한 값을 온 무대에 쓰면 평야에서는 선이 한 줄도 없고 산지에서는 새까매진다.
 * 그래서 AOI 가 제 간격을 들고 온다.
 */

const LIB = 'https://cdn.jsdelivr.net/npm/maplibre-contour@0.1.1/+esm';

/**
 * 터치 기기는 캐시를 크게 줄인다. 위 ② 의 까닭.
 *
 * 모듈 맨 위에서 `matchMedia` 를 부르면 브라우저 밖(검사기·CI)에서 통째로 터진다.
 * 실제로 터졌다 — 스타일 검사기가 잡았다. 부를 때 본다.
 */
function isTouch() {
  return typeof matchMedia === 'function' &&
         matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * 줌별 간격을 AOI 의 실측 간격에서 만든다.
 *
 * 값은 `[가는 선, 굵은 선]`. 굵은 선은 가는 선의 5배 — 지형도 관습이다.
 * 멀리서 실측 간격을 그대로 쓰면 선이 뭉개지므로 줌이 낮을수록 넓힌다.
 */
export function thresholdsFor(intervalM, touch = isTouch()) {
  const I = intervalM;
  const t = {
    9: [I * 10, I * 50],
    10: [I * 5, I * 25],
    11: [I * 2, I * 10],
    12: [I, I * 5],
    13: [I, I * 5],
  };
  // 터치 기기는 z13 에서 멈춘다. z14 의 가장 촘촘한 간격이 만들기에 가장 무겁고,
  // 실제 강제종료도 z14.52 에서 났다. DEM 원본이 z13 이라 z14 는 이미 늘여 그린
  // 것이어서 멈춰도 새로 드러나는 지형은 없다.
  if (!touch) t[14] = [I, I * 5];
  return t;
}

/**
 * 등고선 소스를 준비한다. **스타일을 만들기 전에** 부른다 — 그래야 스타일 안에
 * 넣을 수 있고, 버전 2 가 겪은 경합이 아예 생기지 않는다.
 *
 * @returns {Promise<{url: string} | null>} 실패하면 null. 등고선이 없다고
 *   지도가 못 뜨는 것은 아니므로 **던지지 않는다** — 없는 채로 그린다.
 */
export async function prepareContours({ demUrl, demMaxZoom, intervalM }) {
  try {
    const mod = await import(LIB);
    const mlcontour = mod.default || mod;
    const maplibregl = (await import('../lib/maplibre.js')).default;

    const dem = new mlcontour.DemSource({
      url: demUrl,
      encoding: 'terrarium',
      maxzoom: demMaxZoom,
      worker: true,
      // 위 ② — 기본값 100 을 그대로 두지 않는다.
      cacheSize: isTouch() ? 8 : 40,
    });
    dem.setupMaplibre(maplibregl);

    return {
      url: dem.contourProtocolUrl({
        thresholds: thresholdsFor(intervalM),
        elevationKey: 'ele',
        levelKey: 'level',
        contourLayer: 'contours',
        overzoom: 1,
      }),
      maxzoom: isTouch() ? 13 : 14,
    };
  } catch (err) {
    console.warn('[등고선] 생성기를 불러오지 못했다:', err.message);
    return null;
  }
}

/** 스타일에 넣을 레이어 둘. 소스가 없으면 빈 배열. */
export function contourLayers(contour) {
  if (!contour) return [];
  return [
    {
      id: 'contour-line',
      type: 'line',
      source: 'contours',
      'source-layer': 'contours',
      minzoom: 9,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(120, 92, 56, 0.55)',
        // level 1 이 굵은 등고선. 지형도 관습대로 굵게 긋는다.
        'line-width': ['case', ['>', ['get', 'level'], 0], 1.2, 0.55],
      },
    },
    {
      id: 'contour-label',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      minzoom: 12,
      filter: ['>', ['get', 'level'], 0],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['concat', ['to-string', ['get', 'ele']], ' m'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10.5,
        'symbol-spacing': 220,
        // 등고선은 굽이가 촘촘하다. 각도 제한을 조이면 글자가 **한 개도** 놓이지
        // 않는다(버전 2 에서 30도일 때 0개였다). 90도로 연다.
        'text-max-angle': 90,
        'text-padding': 3,
      },
      paint: {
        'text-color': '#6b5232',
        'text-halo-color': '#fbf7f0',
        'text-halo-width': 1.6,
      },
    },
  ];
}
