/**
 * MapLibre 를 한 곳에서만 불러온다.
 *
 * ## 버전 6 에서 두 번 바뀌었다 (둘 다 조용히 흰 화면을 만든다)
 *
 * 1. **UMD 빌드가 없어졌다.** `dist/maplibre-gl.js`(전역 `maplibregl`)가 더 이상
 *    없고 dist 에는 `.mjs` 뿐이다. 옛 `<script src>` 방식은 **404** 로 죽는다.
 * 2. **default export 가 없다.** named export 뿐이다 — `Map`, `NavigationControl`,
 *    `ScaleControl` … `import maplibregl from ...` 은 `undefined` 를 준다.
 *    그러면 `maplibregl.Map` 에서 *Cannot read properties of undefined* 가 난다.
 *
 * 둘 다 실제로 겪었다. 오류 배너가 없었다면 흰 화면만 보고 원인을 몰랐을 것이다 —
 * 15번 문서가 말하는 "조용히 틀리는" 종류다.
 *
 * 버전은 이 한 줄에만 둔다. 여러 파일에 흩어 두면 올릴 때 하나를 빠뜨린다.
 */
export const MAPLIBRE_VERSION = '6.10.0';

const maplibregl = await import(
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/+esm`
);

if (typeof maplibregl.Map !== 'function') {
  throw new Error('MapLibre 를 불러왔으나 Map 이 없다 — 내보내기 꼴이 또 바뀌었다');
}

export default maplibregl;
