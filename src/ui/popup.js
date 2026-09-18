/**
 * 장소를 눌렀을 때 나오는 패널.
 *
 * ## 이 패널이 있어야 하는 까닭
 *
 * 화면의 점 하나는 "여기다" 라고 말한다. 그러나 우리 자료가 실제로 말하는 것은
 * **"여기라고 보는 견해가 있고, 그 견해를 몇이 지지하며, 다른 후보가 몇 곳 있다"**
 * 이다. 그 차이를 보여 주지 않으면 우리가 고른 하나가 정답처럼 보인다.
 *
 * 15번 문서의 원칙 — 확인된 사실 · 학술 복원 · 시각 보간을 가른다 — 은 자료에만
 * 두면 아무 일도 하지 않는다. **독자가 눌러서 볼 수 있어야 원칙이다.**
 */

const CERT_KO = {
  certain: '확실',
  'less-certain': '대체로 확실',
  uncertain: '갈린다',
};

const BASIS_KO = {
  openbible_votes: 'OpenBible 이 모은 주석·사전·지도책의 지지 수',
  pleiades_association: 'Pleiades 의 associationCertainty',
  source_marking: '원본이 스스로 단 의심 표시',
  manual: '손으로 판정',
  not_assessed: '아직 보지 않았다',
  no_external_link: '외부 가제티어와 이을 수 없다',
  source_has_no_value: '원자료에 그 값이 없다',
};

const BASIS_KO_EXIST = {
  attested_text: '본문이 말한다',
  attested_material: '발굴·유물이 받친다',
  disputed: '존재 자체가 논쟁된다',
  not_assessed: '아직 보지 않았다',
};

const COORD_KO = {
  excavation: '발굴로 확인된 지점',
  representative: '유적 대표점',
  area_centroid: '영역의 중심',
  traditional: '전승이 가리키는 자리',
  unlocated: '자리를 모른다',
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function row(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `<div class="p-row"><span class="p-k">${esc(label)}</span>` +
         `<span class="p-v">${value}</span></div>`;
}

/** 연도를 사람 말로. -1200 → 'BC 1200'. */
function year(y) {
  if (typeof y !== 'number') return null;
  return y < 0 ? `BC ${-y}` : `AD ${y}`;
}

function mainBody(p) {
  const cert = CERT_KO[p.id_certainty];
  const basis = BASIS_KO[p.id_certainty_basis];
  const period = (p.p_from !== undefined || p.p_to !== undefined)
    ? `${year(p.p_from) ?? '?'} ~ ${year(p.p_to) ?? '?'}` : null;

  const links = [];
  if (p.pleiades) links.push(
    `<a href="https://pleiades.stoa.org/places/${esc(p.pleiades)}" target="_blank" rel="noopener">Pleiades</a>`);
  if (p.wikidata) links.push(
    `<a href="https://www.wikidata.org/wiki/${esc(p.wikidata)}" target="_blank" rel="noopener">Wikidata</a>`);

  return [
    row('종류', esc(p.kind)),
    // **확신과 그 까닭을 같이 보인다.** 값만 두면 어디서 온 판정인지 알 수 없다.
    cert ? row('동일시', `${esc(cert)}${basis ? `<br><small>${esc(basis)}</small>` : ''}`)
         : row('동일시', `<span class="p-none">아직 판정하지 않았다</span>` +
                         (basis ? `<br><small>${esc(basis)}</small>` : '')),
    row('존재', esc(BASIS_KO_EXIST[p.existence])),
    row('좌표 성격', esc(COORD_KO[p.coord_basis] || p.coord_basis)),
    // 정확도는 **미터가 정본**이다. 없으면 없다고 말한다 — 추정해 채우지 않는다.
    p.accuracy_m !== undefined
      ? row('좌표 정확도', `약 ${esc(p.accuracy_m)} m`)
      : row('좌표 정확도', '<span class="p-none">모른다</span>'),
    row('점유 시기', period ? esc(period) : null),
    row('성경', p.refs ? esc(p.refs) : null),
    row('출처', p.sources ? esc(p.sources) : null),
    links.length ? row('원전', links.join(' · ')) : '',
    p.alt_n ? `<div class="p-alt">이 자리에 대한 <b>다른 후보가 ${p.alt_n}곳</b> 있습니다.
                 지도에서 속이 빈 점으로 이어져 있습니다.</div>` : '',
  ].join('');
}

function altBody(p) {
  return [
    `<div class="p-alt">「${esc(p.alt_of_ko)}」의 <b>다른 후보</b>입니다.
       우리는 어느 하나를 정답으로 고르지 않습니다.</div>`,
    row('출처', p.sources ? esc(p.sources) : null),
    p.note ? `<div class="p-note">${esc(p.note)}</div>` : '',
  ].join('');
}

export function showPopup(feature, { onStand } = {}) {
  const el = document.getElementById('panel');
  if (!el) return;
  const p = feature.properties || {};
  const isAlt = p.is_alt === 1 || p.is_alt === '1';
  const lngLat = feature.geometry?.coordinates;

  el.innerHTML = `
    <button class="p-close" aria-label="닫기">×</button>
    <div class="p-title">${esc(p.ko)}${p.en && p.en !== p.ko ? `
      <small>${esc(p.en)}</small>` : ''}</div>
    ${isAlt ? altBody(p) : mainBody(p)}
    ${p.desc ? `<div class="p-note">${esc(p.desc)}</div>` : ''}
    ${lngLat ? `<button class="p-stand">여기 서서 보기</button>` : ''}
    <div class="p-id">${esc(p.id)}</div>`;
  el.hidden = false;
  el.querySelector('.p-close').addEventListener('click', hidePopup);
  const stand = el.querySelector('.p-stand');
  if (stand && onStand && lngLat) {
    stand.addEventListener('click', () => onStand(lngLat, p.ko));
  }
}

export function hidePopup() {
  const el = document.getElementById('panel');
  if (el) el.hidden = true;
}
