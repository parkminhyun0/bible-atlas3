/**
 * 서서 보기 — 사람 눈높이에서 지형을 본다.
 *
 * ## 왜 기울이는 것만으로는 모자라는가
 *
 * `pitch` 를 올리면 비스듬히 내려다볼 뿐이다. 그것은 여전히 **위에서 보는 눈**이고,
 * "이 언덕에 서면 무엇이 보이는가" 에는 답하지 못한다. 감람산에서 성전 터가
 * 보이는가, 모리아 산이 기드론 골짜기 건너로 얼마나 솟아 보이는가 —
 * 성경을 읽는 사람이 실제로 묻는 것은 이쪽이다.
 *
 * ## 어떻게
 *
 * MapLibre 6 에 `FreeCameraOptions` 는 없다(확인했다). 대신 둘이 있다:
 *
 *   `map.queryTerrainElevation(lngLat)`        그 자리의 **실제 지면 고도**(m)
 *   `map.calculateCameraOptionsFromTo(from, altFrom, to, altTo)`
 *                                              카메라를 A 에 두고 B 를 볼 때의
 *                                              center·zoom·pitch·bearing
 *
 * 이 둘이면 참된 눈높이 시점이 나온다. 지면 고도 + 1.7 m 에 카메라를 놓고,
 * 바라보는 쪽 500 m 앞의 **그 자리 지면 고도**를 목표로 삼는다.
 *
 * ## 정직성
 *
 * 이 시점에서도 **수직 과장은 화면에만** 걸린다. 과장을 켜 두면 언덕이 실제보다
 * 가파르게 보이므로, 서서 보기에서는 과장을 **1.0× 로 되돌린다** —
 * "여기 서면 이렇게 보인다" 고 말하는 화면에서 부풀리면 그것은 거짓말이다.
 */

/** 사람 눈높이(m). 성인 평균 신장에서 눈까지. */
export const EYE_HEIGHT_M = 1.7;

/** 얼마나 앞을 보는가(m). 너무 가까우면 땅만, 너무 멀면 기울기가 눕는다. */
const LOOK_AHEAD_M = 900;

/** 지면 고도를 읽는다. 타일이 아직이면 null — 그때는 서지 않는다. */
function groundAt(map, lngLat) {
  const e = map.queryTerrainElevation(lngLat);
  return typeof e === 'number' && isFinite(e) ? e : null;
}

/** 방위각 bearing 으로 distM 만큼 간 자리. */
function moveBy(lng, lat, bearingDeg, distM) {
  const R = 6371008.8;
  const br = (bearingDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(br)) / R;
  const dLng = (distM * Math.sin(br)) / (R * Math.cos((lat * Math.PI) / 180));
  return [lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI];
}

/**
 * 그 자리에 서서 bearing 쪽을 본다.
 *
 * @returns {boolean} 섰으면 true. 지형 타일이 아직이면 false —
 *   **지면 고도를 모르는 채로 세우지 않는다.** 그러면 땅 속이나 허공에 선다.
 */
export function standAt(map, lngLat, bearing = 90) {
  const from = { lng: lngLat[0], lat: lngLat[1] };
  const g = groundAt(map, from);
  if (g === null) return false;

  const [tlng, tlat] = moveBy(from.lng, from.lat, bearing, LOOK_AHEAD_M);
  const to = { lng: tlng, lat: tlat };
  // 목표의 지면 고도를 모르면 내 발밑 높이로 본다 — 수평으로 보는 셈이다.
  const gt = groundAt(map, to);

  const cam = map.calculateCameraOptionsFromTo(
    from, g + EYE_HEIGHT_M, to, (gt === null ? g : gt) + EYE_HEIGHT_M);

  // 하늘만 보거나 발밑만 보는 것을 막는다.
  cam.pitch = Math.min(Math.max(cam.pitch ?? 85, 70), 85);
  map.jumpTo(cam);
  return true;
}

/**
 * 서서 보기로 들어간다.
 *
 * 지형 타일이 아직 없으면 잠깐 기다렸다 다시 해 본다 — 한 번 실패했다고
 * 포기하면 "눌렀는데 아무 일도 안 난다" 가 된다.
 */
export async function enterGroundView(map, lngLat, bearing = 90, opts = {}) {
  const { exaggeration = 1.0, tries = 12, waitMs = 250 } = opts;

  // 먼저 그 자리로 가까이 간다. 멀리 있으면 지형 타일이 없어 고도를 못 읽는다.
  map.jumpTo({ center: lngLat, zoom: 15, pitch: 60, bearing });
  // 서서 보는 화면에서는 과장을 되돌린다. 위 '정직성' 참고.
  map.setTerrain({ source: 'terrain', exaggeration });

  for (let i = 0; i < tries; i++) {
    if (standAt(map, lngLat, bearing)) return true;
    await new Promise(r => setTimeout(r, waitMs));
  }
  return false;
}

/** 서서 보기에서 몸만 돌린다. 선 자리는 그대로. */
export function turn(map, lngLat, bearing) {
  return standAt(map, lngLat, bearing);
}
