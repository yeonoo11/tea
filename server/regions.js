// 제주 지역 12곳의 대표 좌표 (lng = 경도, lat = 위도)
// 서버(찻집 검색)와 화면(3D 지도)이 함께 씁니다.
export const REGIONS = [
  { name: '제주시', lng: 126.5312, lat: 33.4996 },
  { name: '조천·함덕', lng: 126.67, lat: 33.543 },
  { name: '구좌·세화', lng: 126.86, lat: 33.519 },
  { name: '성산', lng: 126.9, lat: 33.4585 },
  { name: '표선', lng: 126.835, lat: 33.326 },
  { name: '남원', lng: 126.717, lat: 33.278 },
  { name: '서귀포', lng: 126.56, lat: 33.2541 },
  { name: '안덕', lng: 126.317, lat: 33.248 },
  { name: '대정', lng: 126.253, lat: 33.225 },
  { name: '한경', lng: 126.18, lat: 33.33 },
  { name: '한림', lng: 126.265, lat: 33.4119 },
  { name: '애월', lng: 126.3314, lat: 33.4636 },
];

// 길 찾기 출발지로 자주 쓰는 곳
export const AIRPORT = { name: '제주공항', lng: 126.493, lat: 33.5113 };

// 좌표에서 가장 가까운 지역 이름 (찻집이 어느 지역인지 나눌 때 사용)
export function nearestRegion(lng, lat) {
  let best = REGIONS[0];
  let bestDist = Infinity;
  for (const r of REGIONS) {
    const d = (r.lng - lng) ** 2 + (r.lat - lat) ** 2;
    if (d < bestDist) { best = r; bestDist = d; }
  }
  return best.name;
}
