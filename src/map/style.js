/**
 * 스타일을 **자료로** 다룬다.
 *
 * 버전 2 는 스타일이 코드 안에 박혀 있어서, 화면이 이상할 때 레이어를 하나씩 끄며
 * 범인을 좁히는 일이 불가능했다. 여기서는 스타일이 그냥 객체이므로
 * `layers.filter(...)` 로 반을 잘라 이분탐색할 수 있다.
 */

import { dashExpression } from '../lib/certainty.js';
import { LEVANT_RELIEF } from './palette.js';
import { contourLayers } from './contours.js';

/** Terrarium 인코딩. `R*256 + G + B/256 - 32768`. */
export const TERRARIUM = {
  type: 'raster-dem',
  encoding: 'terrarium',
  // **512 다.** 내려받아 디코딩해 확인했다(512×512, z2 고도 -345~6288 m).
  // 256 으로 선언하면 MapLibre 가 한 단계 어긋난 줌을 요청하고 고도 규모도
  // 어긋난다 — 오류는 나지 않고 결과만 조용히 틀린다.
  tileSize: 512,
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
 * @param {{url:string,maxzoom:number}|null} opts.contour 등고선 소스. 없으면 없는 채로 그린다
 */
export function buildStyle({ demUrl, placesUrl, demMaxZoom = 13, contour = null }) {
  return {
    version: 8,
    // **구형 지구.** 버전 1·2 가 하던 것이고 V3 도 이것으로 간다.
    // 낮은 줌에서는 공처럼, 가까이 가면 저절로 평면처럼 보인다 —
    // MapLibre 가 줌에 따라 알아서 섞는다.
    projection: { type: 'globe' },
    // 하늘·대기·안개. 지구 밖 빈 곳의 색이 여기서 정해진다.
    // MapLibre 6 에는 `star-intensity` 가 없으므로 별은 우리가 따로 그린다.
    sky: {
      'sky-color': '#0a1330',
      'sky-horizon-blend': 0.55,
      'horizon-color': '#8fb2d8',
      'horizon-fog-blend': 0.6,
      'fog-color': '#d8e2ee',
      'fog-ground-blend': 0.7,
      // 0 이면 우주에서도 대기가 안 보이고, 1 이면 지표에서도 뿌옇다.
      'atmosphere-blend': [
        'interpolate', ['linear'], ['zoom'],
        0, 0.9,     // 우주 — 지구 가장자리에 파란 테가 선다
        4, 0.6,
        8, 0.15,    // 지역 — 거의 걷힌다
        12, 0,
      ],
    },
    // **글꼴 출처를 잘못 잡으면 라벨이 사라지는 데서 끝나지 않는다.**
    // 처음에 `demotiles.maplibre.org` 의 `Open Sans Regular` 를 썼는데 그곳에는
    // `Open Sans Semibold` 밖에 없다. 모든 글리프 범위가 404 를 내자 지도가
    // **`load` 도 `idle` 도 영영 내지 않았다** — 범례가 안 뜨고, 뒤에 달린 일이
    // 전부 멈췄다. 라벨만 빠지는 게 아니라 화면 전체가 반쯤 죽는다.
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
      terrain: { ...TERRARIUM, tiles: [demUrl], maxzoom: demMaxZoom },
      // 물. **고도만으로는 물과 마른 땅을 구분할 수 없어서** 따로 온다 —
      // 여리고는 -258 m 인데 마른 땅이다.
      //
      // 처음에 Natural Earth 1:10m 를 썼다가 되돌렸다. 그것은 축척이
      // **1:10,000,000** 이라 위치 한계가 약 1 km 다. 세계 지도용으로 **의도적으로
      // 일반화된** 자료이므로 지구 뷰에서는 맞지만, 확대하면 해안선과 강이
      // 각진 다각형이 된다. 자료가 그만큼밖에 없어서지 그리는 법이 틀려서가 아니다.
      // (원본과 굽는 스크립트는 남겨 두었다 — 권리가 깨끗한 유일한 물 자료다.)
      //
      // 화면에는 OpenStreetMap 기반 벡터 타일(OpenFreeMap)을 쓴다. 버전 2 가
      // 쓰던 것이고 z14 까지 있어 골목 수준에서도 매끄럽다.
      //
      // **라이선스 경계:** OSM 은 ODbL 이다. 우리는 그 타일을 **화면에 표시**할 뿐
      // OSM 자료를 우리 자료에 합치거나 재배포하지 않는다. 우리가 굽는 파일
      // (지명·AOI)에는 OSM 이 한 줄도 들어가지 않는다. 출처 표기는 반드시 남긴다.
      water: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자 · ' +
          '<a href="https://openfreemap.org">OpenFreeMap</a> · ' +
          '<a href="https://www.openmaptiles.org/">OpenMapTiles</a>',
      },
      places: {
        type: 'geojson',
        data: placesUrl,
        // 런타임에 큰 GeoJSON 을 파싱하지 않는 것이 원칙이지만, AOI 하나의
        // 지명은 수백 건이라 이 크기에서는 타일보다 단순한 쪽이 낫다.
        // **AOI 전체(수천 건)로 넘어가면 타일로 바꾼다** — 그 경계는 측정해서 정한다.
        maxzoom: 14,
      },
      // 등고선은 **처음부터 스타일 안에** 둔다. 버전 2 는 켤 때 addSource 를
      // 불렀다가 스타일 로딩과 경합해 라이브에서 끝내 켜지지 않았다.
      ...(contour ? { contours: { type: 'vector', tiles: [contour.url],
                                  maxzoom: contour.maxzoom } } : {}),
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#f4f1ea' } },
      {
        // **고도색.** `color-relief` 는 DEM 값을 그대로 색으로 바꾼다 —
        // 우리가 따로 구울 것이 없다. 배색은 palette.js 에 있고 초록을 쓰지 않는다.
        id: 'relief',
        type: 'color-relief',
        source: 'terrain',
        paint: {
          'color-relief-color': LEVANT_RELIEF,
          // 멀리서는 또렷하게, 가까이서는 옅게 — 가까이서는 등고선과 지명이
          // 주인공이고 색은 배경이어야 한다(22번 문서의 공중원근).
          'color-relief-opacity': [
            'interpolate', ['linear'], ['zoom'],
            0, 1, 8, 0.9, 12, 0.55, 14, 0.4,
          ],
        },
      },
      {
        // **음영기복은 물보다 아래에 둔다.** 위에 두면 물을 회색으로 덮는다 —
        // 실제로 갈릴리 호수가 회색으로 나왔다. 음영은 땅의 굴곡을 말하는 것이지
        // 물에 얹을 것이 아니다. 순서가 곧 뜻이다.
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        // 과장은 화면에만 쓴다. 측정은 언제나 1.0× 기하로 한다.
        paint: { 'hillshade-exaggeration': 0.5, 'hillshade-shadow-color': '#6b6357' },
      },
      // 물은 고도색과 음영기복 **위**에 온다.
      { id: 'ocean', type: 'fill', source: 'water', 'source-layer': 'water',
        filter: ['==', ['get', 'class'], 'ocean'],
        paint: { 'fill-color': '#8fa9c4' } },
      { id: 'lake', type: 'fill', source: 'water', 'source-layer': 'water',
        filter: ['!=', ['get', 'class'], 'ocean'],
        paint: { 'fill-color': '#8fa9c4' } },
      { id: 'water-edge', type: 'line', source: 'water', 'source-layer': 'water',
        minzoom: 6,
        paint: { 'line-color': '#5f7d9c', 'line-width': 0.6, 'line-opacity': 0.6 } },
      { id: 'river', type: 'line', source: 'water', 'source-layer': 'waterway',
        minzoom: 5,
        // 마른 와디까지 다 굵게 그으면 광야가 물길로 덮인다. 늘 흐르는 것과
        // 간헐천(intermittent)을 갈라 놓는다 — 성경 무대에서는 이 구분이 크다.
        filter: ['in', ['get', 'class'], ['literal', ['river', 'canal', 'stream']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#7e9bb8',
          'line-opacity': ['case', ['==', ['get', 'intermittent'], 1], 0.45, 1],
          'line-width': ['interpolate', ['linear'], ['zoom'],
            5, ['case', ['==', ['get', 'class'], 'river'], 0.6, 0],
            10, ['case', ['==', ['get', 'class'], 'river'], 1.6, 0.6],
            14, ['case', ['==', ['get', 'class'], 'river'], 3.0, 1.2]],
        } },
      // 등고선은 물 위, 지명 아래. 물을 가리지 않고 지명에 가리지 않는다.
      ...contourLayers(contour),
      {
        id: 'place-dot',
        type: 'circle',
        source: 'places',
        minzoom: 5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3, 12, 5.5],
          // 흰 점 + 얇은 테두리는 밝은 음영기복 위에서 사실상 보이지 않는다.
          // 실제로 갈릴리에서 80개가 그려졌는데도 화면에서는 한 개도 안 보였다.
          'circle-color': '#8c3a22',
          'circle-stroke-color': '#ffffff',
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
          // 이 출처에 실재하는 이름이어야 한다. 한글은 `localIdeographFontFamily`
          // 가 기기 글꼴로 그리므로 여기에 한글 글꼴을 넣지 않는다.
          'text-font': ['Noto Sans Regular'],
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
