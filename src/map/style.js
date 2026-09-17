/**
 * 스타일을 **자료로** 다룬다.
 *
 * 버전 2 는 스타일이 코드 안에 박혀 있어서, 화면이 이상할 때 레이어를 하나씩 끄며
 * 범인을 좁히는 일이 불가능했다. 여기서는 스타일이 그냥 객체이므로
 * `layers.filter(...)` 로 반을 잘라 이분탐색할 수 있다.
 */

import { dashExpression } from '../lib/certainty.js';

/** Terrarium 인코딩. `R*256 + G + B/256 - 32768`. */
export const TERRARIUM = {
  type: 'raster-dem',
  encoding: 'terrarium',
  tileSize: 256,
  // **maxzoom 을 반드시 못 박는다.** 기본값 22 로 두면 없는 줌을 만들어 내려다
  // 메모리를 태운다. 실제 있는 것은 지역마다 다르다 — 자료에 적힌 값을 넣는다.
  maxzoom: 13,
  attribution:
    'DEM: <a href="https://mapterhorn.com/">Mapterhorn</a> · ' +
    'Copernicus GLO-30 · TINITALY (INGV, CC BY 4.0) · ASTER GDEM (METI/NASA)',
};

/**
 * @param {object} opts
 * @param {string} opts.demUrl   DEM 타일 주소 틀
 * @param {string} opts.placesUrl 구운 지명 자료 주소
 * @param {number} opts.demMaxZoom 이 지역에 실제로 있는 최대 줌
 */
export function buildStyle({ demUrl, placesUrl, demMaxZoom = 13 }) {
  return {
    version: 8,
    // 글꼴은 로컬에서 찾지 못하면 라벨이 통째로 사라진다. 출처를 못 박는다.
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      terrain: { ...TERRARIUM, tiles: [demUrl], maxzoom: demMaxZoom },
      places: {
        type: 'geojson',
        data: placesUrl,
        // 런타임에 큰 GeoJSON 을 파싱하지 않는 것이 원칙이지만, AOI 하나의
        // 지명은 수백 건이라 이 크기에서는 타일보다 단순한 쪽이 낫다.
        // **AOI 전체(수천 건)로 넘어가면 타일로 바꾼다** — 그 경계는 측정해서 정한다.
        maxzoom: 14,
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f4f1ea' } },
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        // 과장은 화면에만 쓴다. 측정은 언제나 1.0× 기하로 한다.
        paint: { 'hillshade-exaggeration': 0.5, 'hillshade-shadow-color': '#6b6357' },
      },
      {
        id: 'place-dot',
        type: 'circle',
        source: 'places',
        minzoom: 5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2.5, 12, 5],
          'circle-color': '#ffffff',
          'circle-stroke-color': '#222222',
          // 굵기는 확실성에 쓰지 않는다 — 전부 같다(FGDC 가 .375 mm 로 통일한 까닭).
          'circle-stroke-width': 1.2,
          // 정확도를 모르는 자리는 옅게 둔다. 실선으로 그리지 않는다.
          'circle-opacity': ['case', ['has', 'accuracy_m'], 1, 0.55],
        },
      },
      {
        id: 'place-label',
        type: 'symbol',
        source: 'places',
        minzoom: 6,
        layout: {
          // 정체가 불확실하면 라벨 뒤에 `?`. 자료가 아니라 스타일이 붙인다.
          'text-field': ['concat', ['get', 'ko'],
            ['case',
              ['==', ['get', 'id_certainty'], 'uncertain'], ' ?',
              ['==', ['get', 'id_certainty'], 'less-certain'], ' (?)',
              '']],
          'text-font': ['Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 12, 13],
          'text-offset': [0, 0.9],
          'text-anchor': 'top',
          // 라벨이 겹치면 키우지 않는다 — 22번 문서의 되먹임 규칙.
          'text-allow-overlap': false,
          'text-padding': 3,
        },
        paint: {
          'text-color': '#222222',
          'text-halo-color': '#f4f1ea',
          'text-halo-width': 1.4,
        },
      },
    ],
    // 참고용으로 남긴다 — 화면에 쓰지 않아도 규칙이 어디서 왔는지 보이게.
    metadata: { 'bibleatlas:dash-rule': dashExpression },
  };
}
