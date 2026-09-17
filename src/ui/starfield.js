/**
 * 별을 우리가 그린다.
 *
 * MapLibre 6 에는 `star-intensity` 가 없다(그것은 Mapbox 쪽 기능이다).
 * 그리고 **은하 사진을 가져다 쓰지 않는다** — 권리를 확인하지 않은 그림을
 * 화면에 올리지 않는 것이 이 프로젝트의 1원칙이다. 그래서 별과 은하띠를
 * 난수로 만든다. 만든 것은 권리가 우리에게 있다.
 *
 * 지도 캔버스 **뒤에** 깔린다. 지구 밖 빈 곳에서만 보이고, 지표로 내려오면
 * 대기가 덮어 자연히 사라진다.
 */

/** 같은 씨앗이면 같은 하늘. 새로고침마다 별자리가 바뀌면 산만하다. */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawStarfield(canvas, { seed = 20260918, count = 1400 } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  g.fillStyle = '#05070d';
  g.fillRect(0, 0, w, h);

  const rnd = mulberry32(seed);

  // 은하띠 — 화면을 비스듬히 가로지르는 옅은 띠. 별 밀도를 그쪽에 몰아 준다.
  const bandAngle = -0.38;
  const cx = w * 0.5, cy = h * 0.5;
  const band = g.createLinearGradient(
    cx - Math.sin(bandAngle) * h, cy - Math.cos(bandAngle) * h,
    cx + Math.sin(bandAngle) * h, cy + Math.cos(bandAngle) * h);
  band.addColorStop(0.00, 'rgba(255,255,255,0)');
  band.addColorStop(0.42, 'rgba(180,196,235,0.045)');
  band.addColorStop(0.50, 'rgba(226,232,248,0.085)');
  band.addColorStop(0.58, 'rgba(180,196,235,0.045)');
  band.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = band;
  g.fillRect(0, 0, w, h);

  // 별. 띠 가까울수록 많고, 대부분은 아주 작다 — 큰 별만 있으면 가짜처럼 보인다.
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h;
    // 띠 중심선으로부터의 거리
    const d = Math.abs((x - cx) * Math.cos(bandAngle) + (y - cy) * Math.sin(bandAngle));
    const nearBand = Math.exp(-((d / (h * 0.28)) ** 2));
    if (rnd() > 0.28 + nearBand * 0.72) continue;

    const r = rnd() ** 3.2 * 1.5 + 0.25;       // 거의 다 작게
    const a = 0.25 + rnd() * 0.65;
    // 별빛 색은 약간만 흔든다. 무지개로 만들면 장난감이 된다.
    const t = rnd();
    const col = t < 0.72 ? '255,255,255' : t < 0.9 ? '208,222,255' : '255,232,206';
    g.fillStyle = `rgba(${col},${a})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
}

/** 지구 밖에서만 별이 보이게 한다. 줌이 내려갈수록 또렷해진다. */
export function starOpacityForZoom(zoom) {
  // z0 완전히 보임 → z4 에서 사라짐. 그 위는 대기가 덮는다.
  if (zoom >= 4) return 0;
  if (zoom <= 0.5) return 1;
  return (4 - zoom) / 3.5;
}
