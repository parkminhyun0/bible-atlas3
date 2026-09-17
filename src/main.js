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

const AOI_URL = new URL('data/aoi/index.json', location.href);

async function loadAoi(name) {
  const res = await fetch(AOI_URL);
  if (!res.ok) throw new Error(`AOI 목록을 읽지 못했다 (HTTP ${res.status})`);
  const index = await res.json();
  const aoi = index.aois.find(a => a.id === name) || index.aois[0];
  if (!aoi) throw new Error('AOI 가 하나도 없다');
  return aoi;
}

function start(aoi) {
  const map = new maplibregl.Map({
    container: 'map',
    style: buildStyle({
      demUrl: aoi.dem_url,
      placesUrl: new URL(aoi.places, AOI_URL).href,
      demMaxZoom: aoi.dem_max_zoom,
    }),
    center: aoi.center,
    zoom: aoi.zoom,
    maxZoom: aoi.dem_max_zoom + 2,   // 자료가 없는 줌까지 열어 두지 않는다
    hash: true,
    // 한글 라벨은 기기 글꼴로 그린다 — 글리프 서버에 한글을 요구하지 않는다.
    localIdeographFontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    // 아이폰에서 죽던 자리. 픽셀 비율을 올리면 같은 화면에 4배 메모리를 쓴다.
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  // 조용히 실패하지 않게 한다.
  map.on('error', e => banner(`지도 오류: ${e?.error?.message || '까닭 미상'}`, 'error'));
  // **범례를 `load` 에 매달지 않는다.** 글꼴 하나가 404 나면 `load` 가 영영
  // 안 오는 일이 실제로 있었다(글꼴 출처를 잘못 잡았을 때). 그때 범례까지 같이
  // 사라지면 화면은 규칙 없는 그림이 된다. 범례는 지도와 무관한 DOM 이다.
  renderLegend({
    exaggeration: 0.5,
    sourceRes: aoi.source_res,
    shownRes: `z${aoi.dem_max_zoom} 까지`,
    note: aoi.caption_note || '',
  });
  map.on('load', clearBanner);

  // WebGL 문맥이 날아가면 흰 화면만 남는다. 무슨 일인지 말해 준다.
  map.getCanvas().addEventListener('webglcontextlost', ev => {
    ev.preventDefault();
    banner('그래픽 문맥이 끊겼습니다. 새로고침하면 돌아옵니다.', 'error');
  });

  window.__map = map;   // 콘솔에서 레이어를 하나씩 끄며 범인을 좁히기 위해
  return map;
}

loadAoi(new URLSearchParams(location.search).get('aoi'))
  .then(start)
  .catch(err => banner(`띄우지 못했습니다 — ${err.message}`, 'error'));
