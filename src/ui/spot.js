/**
 * 누른 자리 — 해발 고도를 읽고, 거기 설 수 있게 한다.
 *
 * 지명을 빼 두었으므로 누를 것이 땅밖에 없다. 그리고 지금 핵심이 지형이니
 * 그것이 옳다. 이 패널이 하는 말은 하나다: **여기는 해발 몇 미터인가.**
 *
 * ## 고도를 적을 때의 규칙
 *
 * 화면의 지형에는 수직 과장이 걸려 있다(기본 1.5×). `queryTerrainElevation` 은
 * **과장이 걸린 값**을 돌려주므로 그대로 적으면 거짓말이 된다 —
 * 감람산이 1.5× 에서 1,199 m, 1.0× 에서 801 m 로 나오는 것을 실측했다.
 * 그래서 화면에 적는 값은 언제나 과장을 나눈 **참 고도**다.
 */

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** 도분초. 좌표를 소수로만 보이면 지도에서 읽는 느낌이 나지 않는다. */
function dms(v, posChar, negChar) {
  const c = v < 0 ? negChar : posChar;
  const a = Math.abs(v);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const sec = ((mFloat - m) * 60).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}′${String(sec).padStart(4, '0')}″${c}`;
}

/**
 * @param {number|null} elevM 참 고도(과장을 나눈 값). 모르면 null
 * @param {{lng:number,lat:number}} lngLat
 * @param {Function} onStand 「여기 서서 보기」를 눌렀을 때
 */
export function showSpot(elevM, lngLat, onStand) {
  const el = document.getElementById('panel');
  if (!el) return;

  const known = typeof elevM === 'number' && isFinite(elevM);
  el.innerHTML = `
    <button class="p-close" aria-label="닫기">×</button>
    <div class="p-title">${known ? `해발 ${Math.round(elevM)} m` : '고도를 읽지 못했다'}</div>
    ${known ? '' : `<div class="p-note">이 자리의 지형 타일이 아직 도착하지 않았습니다.
       잠시 뒤 다시 눌러 주세요.</div>`}
    <div class="p-row"><span class="p-k">위도</span>
      <span class="p-v">${esc(dms(lngLat.lat, 'N', 'S'))}</span></div>
    <div class="p-row"><span class="p-k">경도</span>
      <span class="p-v">${esc(dms(lngLat.lng, 'E', 'W'))}</span></div>
    <div class="p-row"><span class="p-k">십진</span>
      <span class="p-v">${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}</span></div>
    ${known ? '<button class="p-stand">여기 서서 보기</button>' : ''}
    <div class="p-note">
      고도는 <b>수직 과장을 나눈 참값</b>입니다. 화면의 지형은 1.5× 로 부풀려
      그렸지만 이 숫자는 부풀리지 않았습니다.
    </div>`;
  el.hidden = false;
  el.querySelector('.p-close').addEventListener('click', hideSpot);
  const stand = el.querySelector('.p-stand');
  if (stand) stand.addEventListener('click', onStand);
}

export function hideSpot() {
  const el = document.getElementById('panel');
  if (el) el.hidden = true;
}
