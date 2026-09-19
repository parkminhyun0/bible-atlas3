/**
 * BibleAtlas 3 — 진입점.
 *
 * 하는 일은 셋뿐이다: 무엇을 그릴지 고르고, 지도를 띄우고, 실패를 화면에 말한다.
 * 그 밖의 것은 전부 모듈로 나간다 — 버전 2 가 한 덩어리였던 탓에 레이어 하나를
 * 끄는 것조차 못 했다.
 */

import maplibregl from './lib/maplibre.js';
import { buildStyle } from './map/style.js';
import { renderLegend } from './ui/legend.js';
import { banner, clearBanner } from './ui/banner.js';
import { drawStarfield, starOpacityForZoom } from './ui/starfield.js';
import { prepareContours } from './map/contours.js';
import { showGroundBar, hideGroundBar } from './ui/groundbar.js';
import { showSpot, hideSpot } from './ui/spot.js';
import { enterGroundView, turn, trueElevationAt } from './map/groundview.js';

const AOI_URL = new URL('data/aoi/index.json', location.href);

/** 지형 과장. 22번 문서 규약: 기본 1.5× · 상한 2.5× · 항상 밝힌다. */
const TERRAIN_EXAGGERATION = 1.5;

/**
 * 우주에서 그 자리로 들어간다.
 *
 * 한 번에 날아가면 어디로 가는지 알 수 없다. **두 걸음으로 나눈다** —
 * 먼저 지구를 돌려 그 반구를 보여 주고(무대가 어디인지), 그 다음 내려앉는다.
 * 내려앉을 때 기울기를 주어 땅이 솟은 것이 보이게 한다.
 */
function startFlight(map, aoi) {
  map.flyTo({ center: aoi.center, zoom: 2.6, pitch: 0, bearing: 0,
              duration: 3200, essential: true });
  map.once('moveend', () => {
    map.flyTo({ center: aoi.center, zoom: aoi.zoom, pitch: 58, bearing: -18,
                duration: 4200, essential: true, curve: 1.3 });
  });
}

async function loadAoi(name) {
  const res = await fetch(AOI_URL);
  if (!res.ok) throw new Error(`AOI 목록을 읽지 못했다 (HTTP ${res.status})`);
  const index = await res.json();
  const aoi = index.aois.find(a => a.id === name) || index.aois[0];
  if (!aoi) throw new Error('AOI 가 하나도 없다');
  return aoi;
}

function start(aoi, contour) {
  const map = new maplibregl.Map({
    container: 'map',
    style: buildStyle({
      contour,
      demUrl: aoi.dem_url,
      demMaxZoom: aoi.dem_max_zoom,
      lakesUrl: new URL('data/water/water-lakes.json', location.href).href,
    }),
    center: aoi.center,
    // **우주에서 시작한다.** 곧바로 AOI 로 날아간다(startFlight).
    // 주소에 #줌/위도/경도 가 있으면 그쪽이 이긴다 — 링크를 받은 사람은
    // 그 자리를 보려는 것이지 연출을 보려는 것이 아니다.
    zoom: location.hash ? aoi.zoom : 0.35,
    maxZoom: aoi.dem_max_zoom + 2,   // 자료가 없는 줌까지 열어 두지 않는다
    // **기본으로 기울여 둔다.** 기울기 0 이면 3D 지형을 걸어 놓고도 평면으로
    // 보인다 — 기울이려면 오른쪽 드래그를 해야 하는데 그것을 아는 사람은 드물다.
    // 주소에 pitch 가 있으면 그쪽이 이긴다.
    pitch: 55,
    hash: true,
    // 한글 라벨은 기기 글꼴로 그린다 — 글리프 서버에 한글을 요구하지 않는다.
    localIdeographFontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    // 아이폰에서 죽던 자리. 픽셀 비율을 올리면 같은 화면에 4배 메모리를 쓴다.
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  });

  // **생성자의 `maxPitch` 는 먹지 않는다.** 85 로 넣었는데 `getMaxPitch()` 가
  // 60 을 돌려주는 것을 실측으로 확인했다. `setMaxPitch()` 는 먹는다.
  // 기본 상한 60° 로는 '서서 보기' 가 불가능하다 — 눈높이 시점은 거의 수평이다.
  map.setMaxPitch(85);

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  // 조용히 실패하지 않게 한다. **다만 타일 하나가 빈 것으로 놀라게 하지도 않는다.**
  //
  // 버전 2 가 배운 것을 내가 빠뜨렸다 — 타일 단위 오류(`sourceId` 가 붙는다)는
  // 외부 서비스가 이따금 실패하거나 **그 자리에 자료가 없는** 것이고, 지도는
  // 그래도 그려진다. 그것으로 붉은 배너를 띄우면 독자는 지도가 망가진 줄 안다.
  //
  // 실제로 겪었다: `404 for tiles.mapterhorn.com/13/...` — z13 타일은 우리 무대
  // 어디에도 없는데(실측) AOI 명세가 13 을 요구하고 있었다. 명세는 12 로 고쳤고,
  // 자료 경계 밖으로 나가면 여전히 404 가 나므로 그것은 조용히 넘긴다.
  //
  // `sourceId` 가 **없는** 오류는 스타일·표현식 결함이라 반드시 보여야 한다.
  map.on('error', e => {
    if (e?.sourceId) {
      console.warn('[타일]', e.sourceId, e?.error?.message || e);
      return;
    }
    banner(`지도 오류: ${e?.error?.message || '까닭 미상'}`, 'error');
  });
  // **범례를 `load` 에 매달지 않는다.** 글꼴 하나가 404 나면 `load` 가 영영
  // 안 오는 일이 실제로 있었다(글꼴 출처를 잘못 잡았을 때). 그때 범례까지 같이
  // 사라지면 화면은 규칙 없는 그림이 된다. 범례는 지도와 무관한 DOM 이다.
  renderLegend({
    exaggeration: 0.5,
    sourceRes: aoi.source_res,
    shownRes: `z${aoi.dem_max_zoom} 까지`,
    // **등고선 간격을 화면이 밝힌다.** 간격을 모르면 등고선은 무늬일 뿐이다.
    // 값은 이 AOI 에서 실측한 것이고 지역마다 다르다(바벨론 5 m ~ 시내 100 m).
    contourInterval: contour ? aoi.contour_interval_m : null,
    reliefM: aoi.relief_m,
    note: aoi.caption_note || '',
  });
  // **`load` 가 아니라 `styledata` 에 건다.**
  //
  // `load` 는 첫 렌더 프레임까지 기다리므로, 화면이 보이지 않는 상태에서는
  // (배경 탭 등 `requestAnimationFrame` 이 멈춘 곳) 영영 나지 않는다.
  // 지형을 올리는 데 필요한 것은 렌더가 아니라 **스타일 파싱**뿐이다.
  // `isStyleLoaded()` 를 기다리는 것도 답이 아니다 — 그것은 타일까지 다 받아야
  // 참이 되어 우주 줌에서 15초를 넘긴다.
  //
  // (앞서 이것을 'load 가 나지 않는 버그' 로 잘못 진단했다. 실제로는 자동화
  //  브라우저의 탭이 `hidden` 이라 rAF 가 초당 0프레임이었다. 다만 `styledata`
  //  에 거는 쪽이 어느 경우에도 더 튼튼하므로 그대로 둔다.)
  map.once('styledata', () => {
    try {
      // **진짜 3D 지형.** 음영기복은 그림자일 뿐이고, 이것이 땅을 들어올린다.
      // 과장은 화면에만 쓴다 — 거리·경사 계산은 언제나 1.0× 기하로 한다.
      map.setTerrain({ source: 'terrain', exaggeration: TERRAIN_EXAGGERATION });
    } catch (e) {
      banner(`지형을 올리지 못했습니다 — ${e.message}`, 'error');
    }
  });
  map.once('idle', clearBanner);

  // 비행은 지형과 무관하다. 지형이 늦어도 화면은 먼저 움직인다.
  if (!location.hash) startFlight(map, aoi);

  // 별은 지도 캔버스 뒤에 깔린다. 줌이 올라가면 대기가 덮으므로 흐려 준다.
  const stars = document.getElementById('stars');
  if (stars) {
    drawStarfield(stars);
    const syncStars = () => { stars.style.opacity = starOpacityForZoom(map.getZoom()); };
    syncStars();
    map.on('move', syncStars);
    window.addEventListener('resize', () => { drawStarfield(stars); syncStars(); });
  }

  // ── 땅을 눌러 본다 ────────────────────────────────────────────────
  //
  // 지명을 빼 두었으므로 누를 것이 땅밖에 없다. 그리고 지금 핵심이 지형이니
  // 그것이 옳다 — **누른 자리의 해발 고도를 읽고, 거기 설 수 있게 한다.**
  //
  // 고도는 반드시 **과장 1.0 기준**으로 읽는다. `queryTerrainElevation` 은
  // 과장이 걸린 값을 돌려주므로(감람산 1.5× 에서 1,199 m · 1.0× 에서 801 m),
  // 화면에 적을 때는 과장을 나눠 준다.
  map.on('click', e => {
    const raw = map.queryTerrainElevation(e.lngLat);
    if (typeof raw !== 'number' || !isFinite(raw)) {
      showSpot(null, e.lngLat, () => {});
      return;
    }
    const m = raw / TERRAIN_EXAGGERATION;
    showSpot(m, e.lngLat, () => goGround(map, [e.lngLat.lng, e.lngLat.lat],
                                         `해발 ${Math.round(m)} m 지점`));
  });

  // WebGL 문맥이 날아가면 흰 화면만 남는다. 무슨 일인지 말해 준다.
  map.getCanvas().addEventListener('webglcontextlost', ev => {
    ev.preventDefault();
    banner('그래픽 문맥이 끊겼습니다. 새로고침하면 돌아옵니다.', 'error');
  });

  window.__map = map;   // 콘솔에서 레이어를 하나씩 끄며 범인을 좁히기 위해
  return map;
}

/**
 * 서서 보기로 들어간다 — **이것이 이 지도의 핵심이다.**
 *
 * 위에서 내려다보는 지도는 "어디에 있는가" 에 답한다. 그러나 성경을 읽는 사람이
 * 묻는 것은 흔히 "거기 서면 무엇이 보이는가" 다 — 감람산에서 성전 터가 보이는가,
 * 기드론 골짜기가 얼마나 깊은가. 기울이는 것만으로는 여전히 위에서 보는 눈이다.
 */
async function goGround(map, lngLat, name) {
  banner(`${name} 에 서는 중…`);
  let bearing = 90;
  const ok = await enterGroundView(map, lngLat, bearing);
  if (!ok) {
    banner('지형 자료가 아직 도착하지 않아 서지 못했습니다. 잠시 뒤 다시 눌러 주세요.',
           'error');
    return;
  }
  clearBanner();
  hideSpot();
  // 고도는 **과장 1.0 기준**으로 읽은 값이다. 서서 보기는 과장을 되돌린 뒤
  // 서므로 그대로 적어도 된다 — 과장이 걸린 값을 적으면 거짓말이 된다.
  const elev = trueElevationAt(map, lngLat);
  showGroundBar({
    where: name + (elev !== null ? ` · 해발 ${Math.round(elev)} m` : ''),
    bearing,
    onTurn: b => { bearing = b; turn(map, lngLat, b); },
    onExit: () => {
      hideGroundBar();
      // 위에서 볼 때는 과장을 다시 건다. 서서 볼 때만 1.0× 였다.
      map.setTerrain({ source: 'terrain', exaggeration: TERRAIN_EXAGGERATION });
      map.easeTo({ center: lngLat, zoom: 13, pitch: 55, duration: 900 });
    },
  });
}

loadAoi(new URLSearchParams(location.search).get('aoi'))
  .then(async aoi => {
    // 등고선 생성기는 **지도를 만들기 전에** 준비한다. 그래야 스타일 안에 넣을 수
    // 있고, 버전 2 가 겪은 "Style is not done loading" 경합이 아예 생기지 않는다.
    // 실패하면 null 이 오고, 등고선 없이 그린다 — 등고선 하나로 지도를 못 띄우면
    // 안 된다.
    const contour = await prepareContours({
      demUrl: aoi.dem_url,
      demMaxZoom: aoi.dem_max_zoom,
      lakesUrl: new URL('data/water/water-lakes.json', location.href).href,
      intervalM: aoi.contour_interval_m,
    });
    return start(aoi, contour);
  })
  .catch(err => banner(`띄우지 못했습니다 — ${err.message}`, 'error'));
