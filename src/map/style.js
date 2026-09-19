/**
 * 스타일을 **자료로** 다룬다.
 *
 * ## 지금은 지명을 그리지 않는다 (2026-09-18)
 *
 * 박 목사님 지시. **좌표를 정확히 넣기 전에는 지명을 올리지 않는다.**
 * 지금 핵심은 지질·지형·등고선·고도 표현이 사실적으로 만들어지는 것이고,
 * 자리가 불확실한 점을 먼저 뿌리면 그 위에 올릴 땅이 흐려진다.
 * 지명을 굽는 스크립트(`build_aoi.py`)와 자료는 그대로 남겨 두었다.
 *
 * 버전 2 는 스타일이 코드 안에 박혀 있어서, 화면이 이상할 때 레이어를 하나씩 끄며
 * 범인을 좁히는 일이 불가능했다. 여기서는 스타일이 그냥 객체이므로
 * `layers.filter(...)` 로 반을 잘라 이분탐색할 수 있다.
 */

import { LEVANT_RELIEF, BATHY_RAMP, SEA_FLAT, BASE_SKY } from './palette.js';
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
 * @param {number} opts.demMaxZoom 이 지역에 실제로 있는 최대 줌
 * @param {{url:string,maxzoom:number}|null} opts.contour 등고선 소스. 없으면 없는 채로 그린다
 */
export function buildStyle({ demUrl, demMaxZoom = 13, contour = null,
                             lakesUrl = 'data/water/water-lakes.json' }) {
  return {
    version: 8,
    // **구형 지구.** 버전 1·2 가 하던 것이고 V3 도 이것으로 간다.
    // 낮은 줌에서는 공처럼, 가까이 가면 저절로 평면처럼 보인다 —
    // MapLibre 가 줌에 따라 알아서 섞는다.
    projection: { type: 'globe' },
    // 하늘·대기·안개. 지구 밖 빈 곳의 색이 여기서 정해진다.
    // MapLibre 6 에는 `star-intensity` 가 없으므로 별은 우리가 따로 그린다.
    sky: BASE_SKY,
    // **글꼴 출처를 잘못 잡으면 라벨이 사라지는 데서 끝나지 않는다.**
    // 처음에 `demotiles.maplibre.org` 의 `Open Sans Regular` 를 썼는데 그곳에는
    // `Open Sans Semibold` 밖에 없다. 모든 글리프 범위가 404 를 내자 지도가
    // **`load` 도 `idle` 도 영영 내지 않았다** — 범례가 안 뜨고, 뒤에 달린 일이
    // 전부 멈췄다. 라벨만 빠지는 게 아니라 화면 전체가 반쯤 죽는다.
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
      terrain: { ...TERRARIUM, tiles: [demUrl], maxzoom: demMaxZoom },
      // **해저 지형.** Mapterhorn 은 육지만 담는다. 바다 깊이는 AWS Terrain Tiles
      // (Terrarium)에서 온다. 저줌에서만 쓴다 — 확대하면 해안선 도형이 맡고,
      // DEM 을 두 벌 해독하는 것이 아이폰을 죽이던 자리이기도 하다.
      bathy: {
        type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 8,
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        attribution:
          '해저: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a> · ' +
          'ETOPO1 (NOAA) · SRTM·GMTED2010 (USGS)',
      },
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
      // 우리가 고른 호수. HydroLAKES v1.0 에서 무대만 잘라, **성경 시대에 없던
      // 물을 빼고**, QGIS 로 깨진 도형을 고친 것이다(build_lakes.py ·
      // qgis_polish_lakes.sh). 자세한 까닭은 PROVENANCE.md 10장.
      lakes: {
        type: 'geojson', data: lakesUrl, maxzoom: 12,
        attribution:
          '호수: <a href="https://www.hydrosheds.org/products/hydrolakes">HydroLAKES</a> ' +
          '(Messager et al. 2016, CC BY 4.0)',
      },
      // 등고선은 **처음부터 스타일 안에** 둔다. 버전 2 는 켤 때 addSource 를
      // 불렀다가 스타일 로딩과 경합해 라이브에서 끝내 켜지지 않았다.
      ...(contour ? { contours: { type: 'vector', tiles: [contour.url],
                                  maxzoom: contour.maxzoom } } : {}),
    },
    layers: [
      { id: 'bg', type: 'background',
        // **바다색으로 깔지 않는다.** 처음에 그렇게 했더니 타일이 들어오기 전
        // 화면이 통째로 파랬다 — 아직 아무것도 못 그렸는데 "여기는 바다" 라고
        // 말하는 셈이다. 바다는 해저색(bathy)과 해안선 도형(OSM)이 그린다.
        // 이 색은 "아직 아무것도 없다" 를 뜻하는 중립색이다.
        paint: { 'background-color': '#efece4' } },
      {
        // **고도색.** `color-relief` 는 DEM 값을 그대로 색으로 바꾼다 —
        // 우리가 따로 구울 것이 없다. 배색은 palette.js 에 있고 버전 2 의 값을
        // 물려받았다(저채도 세이지 → 황토 → 회갈 → 설선).
        //
        // **어디서나 불투명하다.** 0 m 를 투명하게 두면 DEM 이 '바다 0 m' 와
        // '나일 삼각주 육지 0 m' 를 구분하지 못해 삼각주가 바다로 칠해진다.
        id: 'relief',
        type: 'color-relief',
        source: 'terrain',
        paint: {
          'color-relief-color': LEVANT_RELIEF,
          // 멀리서는 또렷하게, 가까이서는 옅게 — 가까이서는 등고선이
          // 주인공이고 색은 배경이어야 한다(22번 문서의 공중원근).
          'color-relief-opacity': [
            'interpolate', ['linear'], ['zoom'],
            0, 1, 8, 0.9, 12, 0.55, 14, 0.4,
          ],
        },
      },
      {
        // 해저 깊이색. **-800 m 아래로만** 칠한다(palette.js ② 참고) —
        // 고도만 보고 칠하면 요단 지구대(-430 m)까지 바다가 된다.
        //
        // **고도색보다 위에 둔다.** 아래에 두면 덮인다 — 바다 위 DEM 은 0 m 라
        // 고도색이 그것을 육지색(#c8d2a2)으로 칠해 버리기 때문이다. 실제로
        // 지중해 전체가 세이지색으로 나왔고, OSM 바다 타일이 들어온 조각만
        // 파랗게 보였다. 순서가 곧 뜻이다.
        id: 'bathy', type: 'color-relief', source: 'bathy', maxzoom: 8,
        paint: { 'color-relief-color': BATHY_RAMP },
      },
      {
        // ── 음영 ①: 부드러운 바탕 (Igor 기법) ──────────────────────────
        //
        // **음영기복은 물보다 아래에 둔다.** 위에 두면 물을 회색으로 덮는다 —
        // 실제로 갈릴리 호수가 회색으로 나왔다. 순서가 곧 뜻이다.
        //
        // `igor` 는 Igor Drecki 의 기법으로, 그늘을 **검게 만들지 않고** 부드럽게
        // 낮춘다. 고도색 위에 얹어도 색을 죽이지 않아 지도책의 음영에 가깝다.
        // 기본 `standard` 는 대비가 세서 색을 회색으로 밀어 버린다.
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-method': 'igor',
          // 과장은 화면에만 쓴다. 측정은 언제나 1.0× 기하로 한다.
          'hillshade-exaggeration': 0.45,
          'hillshade-shadow-color': '#6b6357',
          'hillshade-highlight-color': '#fffdf6',
          'hillshade-accent-color': '#8a7f6e',
          // **빛은 화면이 아니라 지도에 고정한다.** 기본값(`viewport`)이면
          // 지도를 돌릴 때 해가 같이 돌아 산이 뒤집혀 보인다.
          // 지도책의 관습은 왼쪽 위(북서)에서 오는 빛이다.
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': 315,
          'hillshade-illumination-altitude': 45,
        },
      },
      {
        // ── 음영 ②: 능선을 집어내는 다방향 음영 ────────────────────────
        //
        // 빛이 한 방향이면 그 방향과 나란한 능선은 **평평하게 보인다.**
        // 다방향 음영은 여러 방위에서 비춰 그 손실을 메운다 — swisstopo·USGS
        // 계열이 쓰는 기법이다. 옅게 얹어 ① 의 부드러움을 깨지 않는다.
        id: 'hillshade-multi',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-method': 'multidirectional',
          'hillshade-exaggeration': ['interpolate', ['linear'], ['zoom'],
            4, 0.10, 9, 0.22, 13, 0.30],
          'hillshade-shadow-color': '#5e564a',
          'hillshade-highlight-color': 'rgba(255,255,255,0)',
          'hillshade-illumination-anchor': 'map',
        },
      },
      // 물은 고도색과 음영기복 **위**에 온다.
      { id: 'ocean', type: 'fill', source: 'water', 'source-layer': 'water',
        filter: ['==', ['get', 'class'], 'ocean'],
        paint: { 'fill-color': SEA_FLAT } },
      {
        // **호수는 우리가 고른 것만 그린다.** 세 번 갈아탄 끝의 자리다.
        //
        // ① OSM — 매끄럽지만 **현대 양어장·저수지를 가릴 수 없다.** 갈릴리 일대
        //    호수 279개 중 269개가 1 km² 미만이었다(중앙값 8헥타르).
        // ② Natural Earth 1:10m — 큰 것만 주지만 **갈릴리와 사해가 직각으로
        //    꺾였다.** 축척이 1:10,000,000 이라 위치 한계가 약 1 km 다.
        // ③ **HydroLAKES** — 둘 다 푼다. 면적으로 거르고, `Lake_type` 으로
        //    저수지를 가르고, 윤곽이 상세하다(갈릴리 211점 · 사해 625점).
        //
        // 거기서 다시 **성경 시대에 없던 물**을 이름과 연대로 뺐다 — 나세르호
        // (1964~76, 누비아 수몰) · 앗사드호(1974) · 아타튀르크호(1992) ·
        // Toshka(1998~2001) · 사해 남부 증발지(1960~80년대 공업용) 등 154개.
        // 그것들을 그리면 없던 물을 그리는 것이고, 그 아래 잠긴 유적과 옛 물길을
        // 지우는 일이기도 하다.
        id: 'lake', type: 'fill', source: 'lakes',
        paint: { 'fill-color': SEA_FLAT } },
      { id: 'lake-edge', type: 'line', source: 'lakes', minzoom: 6,
        paint: { 'line-color': '#2a6aa5', 'line-width': 0.6, 'line-opacity': 0.55 } },
      { id: 'coast-edge', type: 'line', source: 'water', 'source-layer': 'water',
        minzoom: 5,
        filter: ['==', ['get', 'class'], 'ocean'],
        paint: { 'line-color': '#2a6aa5', 'line-width': 0.7, 'line-opacity': 0.6 } },
      { id: 'river', type: 'line', source: 'water', 'source-layer': 'waterway',
        minzoom: 5,
        // **운하를 그리지 않는다.** OSM 의 `canal` 은 대부분 현대 관개수로다 —
        // 애굽 삼각주와 메소포타미아에서 특히 심해서, 그리면 고대 무대가
        // 20세기 수로망으로 덮인다. `stream` 도 뺀다: 대부분 마른 와디인데
        // 선으로 그으면 광야가 물길로 덮인다.
        //
        // 간헐천은 남기되 옅은 선으로 둔다 — 성경 무대에서 늘 흐르는 물과
        // 겨울에만 흐르는 물의 구분은 그 자체로 중요한 정보다.
        filter: ['==', ['get', 'class'], 'river'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#5a90c0',
          'line-opacity': ['case', ['==', ['get', 'intermittent'], 1], 0.45, 1],
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1.6, 14, 3.0],
        } },
      // 등고선이 맨 위다. 지금은 그 위에 올릴 것이 없다 — 지명을 뺐으므로.
      ...contourLayers(contour),
    ],
  };
}
