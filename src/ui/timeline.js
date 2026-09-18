/**
 * 시대 슬라이더 — "기원전 1000년의 지도" 를 그린다.
 *
 * ## 이 층에서 가장 위험한 것
 *
 * 연대로 거르면 **연대를 모르는 곳이 사라진다.** 그러면 화면은 "그때 거기 없었다"
 * 고 말하게 된다 — 우리는 그것을 모르는데도. 지금 연대를 가진 곳은
 * 예루살렘 4% · 갈릴리 24% 다. 거르는 순간 화면의 96% 가 거짓 부재가 된다.
 *
 * 그래서 **세 상태로 가른다**:
 *
 *   연대 있음 + 그 해에 존재  → 진하게
 *   연대 있음 + 그 해에 없음  → 숨김
 *   **연대 없음**             → **옅게, 그러나 숨기지 않는다**
 *
 * 그리고 숫자를 항상 함께 보인다. "이 해에 확인된 곳 N · 연대를 모르는 곳 M" —
 * M 이 크다는 사실 자체가 독자가 알아야 할 정보다.
 *
 * ## 연대의 성격
 *
 * 우리 `periods` 는 Pleiades 의 **시대 태그**에서 왔지 발굴 지층 보고가 아니다.
 * 한 유적에 붙은 태그의 합집합이라 범위가 실제보다 넓다(다윗성이 -10000 년부터로
 * 나오는 것이 그 탓이다 — 구석기 태그 하나가 끌고 내려간다). 캡션이 그것을 말한다.
 */

export const YEAR_MIN = -3000;
export const YEAR_MAX = 100;

/** 사람 말로. -1000 → 'BC 1000'. */
export function yearKo(y) {
  return y < 0 ? `BC ${-y}` : (y === 0 ? 'BC 1' : `AD ${y}`);
}

/**
 * 성경 시대 층(노션 20번)의 눈금. 슬라이더가 그냥 숫자 막대이면
 * 독자는 어디로 끌어야 할지 모른다.
 */
const MARKS = [
  [-2000, '족장'],
  [-1250, '출애굽'],
  [-1000, '다윗'],
  [-586, '포로'],
  [-4, '예수'],
];

export function mountTimeline({ onChange }) {
  const el = document.getElementById('timeline');
  if (!el) return null;

  const marks = MARKS.map(([y, ko]) => {
    const x = ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * 100).toFixed(2);
    return `<span class="tl-mark" style="left:${x}%"><i></i>${ko}</span>`;
  }).join('');

  el.innerHTML = `
    <div class="tl-head">
      <label class="tl-toggle"><input type="checkbox" id="tl-on"> 시대별로 보기</label>
      <span class="tl-year" id="tl-year"></span>
    </div>
    <div class="tl-body" id="tl-body" hidden>
      <input type="range" id="tl-range" min="${YEAR_MIN}" max="${YEAR_MAX}" step="10">
      <div class="tl-marks">${marks}</div>
      <div class="tl-count" id="tl-count"></div>
      <div class="tl-warn">
        연대는 Pleiades 의 <b>시대 태그</b>에서 왔지 발굴 지층 보고가 아닙니다.
        한 유적에 붙은 태그의 합집합이라 범위가 실제보다 넓습니다.
        <b>연대를 모르는 곳은 숨기지 않고 옅게</b> 둡니다 — 모르는 것을
        &lsquo;없었다&rsquo;로 바꾸지 않기 위해서입니다.
      </div>
    </div>`;
  el.hidden = false;

  const on = el.querySelector('#tl-on');
  const body = el.querySelector('#tl-body');
  const range = el.querySelector('#tl-range');
  const yearEl = el.querySelector('#tl-year');
  const countEl = el.querySelector('#tl-count');

  range.value = String(-1000);

  const paint = () => {
    const y = Number(range.value);
    yearEl.textContent = on.checked ? yearKo(y) : '모든 시대';
    onChange({ enabled: on.checked, year: y, setCount: t => { countEl.textContent = t; } });
  };

  on.addEventListener('change', () => { body.hidden = !on.checked; paint(); });
  range.addEventListener('input', paint);
  paint();
  return { paint };
}
