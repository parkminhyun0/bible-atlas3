/**
 * 확실성을 화면 언어로 옮긴다 — 노션 22번 문서 10장의 규약.
 *
 * 설계 원칙은 FGDC-STD-013-2006 §2.1 에서 왔다. **2축 직교**다.
 *
 *   위치 확실성 → 테두리 선종 하나만 바꾼다 (실선 → 파선 → 점선)
 *   정체 확실성 → 라벨 뒤에 `?` 를 붙인다
 *   종류(도시·산·물) → 색·기호. 위 둘과 간섭하지 않는다.
 *
 * **굵기와 색은 확실성에 쓰지 않는다.** FGDC 의 여덟 기호가 전부 같은 .375 mm 인
 * 까닭이 이것이다 — 굵기를 확실성에 쓰면 종류를 표현할 채널이 사라진다.
 */

/** 정체가 불확실하면 라벨 뒤에 `?`. 없는 값은 물음표를 붙이지 않는다(모름 ≠ 의심). */
export function labelSuffix(idCertainty) {
  return idCertainty === 'uncertain' ? ' ?'
       : idCertainty === 'less-certain' ? ' (?)'
       : '';
}

/**
 * 위치 확실성 → 파선 무늬. 값은 선 굵기의 배수다.
 *
 * `location_accuracy_m` 이 있으면 그것을 쓰고, 없으면 `coord_basis` 로 떨어진다.
 * 정확도를 모르면 **파선을 그리지 않고 점선으로 둔다** — 모르는 것을 확실한
 * 것처럼 실선으로 그리지 않는다.
 */
export function dashFor(place) {
  const m = place.location_accuracy_m;
  if (typeof m === 'number') {
    if (m <= 50) return null;        // 실선
    if (m <= 500) return [3.5, 1.5]; // 긴 파선
    return [1.5, 1.5];               // 짧은 파선
  }
  if (place.coord_basis === 'excavation') return null;
  if (place.coord_basis === 'traditional') return [0.5, 1.5];  // 점선
  return [1.5, 1.5];
}

/**
 * MapLibre 표현식으로 같은 규칙을 쓴다. 자료마다 계산하지 않고 스타일이 하게 한다 —
 * 스타일을 자료로 다루려면 규칙도 자료 안에 있어야 한다.
 */
export const dashExpression = [
  'case',
  ['all', ['has', 'accuracy_m'], ['<=', ['get', 'accuracy_m'], 50]], 'solid',
  ['all', ['has', 'accuracy_m'], ['<=', ['get', 'accuracy_m'], 500]], 'long',
  ['has', 'accuracy_m'], 'short',
  ['==', ['get', 'coord_basis'], 'excavation'], 'solid',
  ['==', ['get', 'coord_basis'], 'traditional'], 'dot',
  'short',
];

/** 범례에 쓸 설명. 화면이 규칙을 스스로 밝히지 않으면 규칙이 없는 것과 같다. */
export const LEGEND = [
  { dash: 'none', ko: '실선', desc: '발굴로 확인 · 50 m 이내' },
  { dash: '7 3', ko: '긴 파선', desc: '약 500 m' },
  { dash: '3 3', ko: '짧은 파선', desc: '1 km 이상 · 정확도 미상' },
  { dash: '1 3', ko: '점선', desc: '전승이 가리키는 자리' },
];
