// OSRM — 두 지점 사이 자동차 이동 시간 (API 키 없음)
// 문서: https://project-osrm.org/docs/v5.24.0/api/#route-service
// GET https://router.project-osrm.org/route/v1/driving/{경도,위도};{경도,위도}  ← 경도가 먼저!
const BASE = 'https://router.project-osrm.org/route/v1/driving';

export async function getTravelTime({ fromLng, fromLat, toLng, toLat }) {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const r = await fetch(`${BASE}/${coords}?overview=false`);
  const data = await r.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error(`경로를 찾지 못했어요 (${data.code})`);
  const route = data.routes[0];
  return {
    minutes: Math.round(route.duration / 60),                 // 초 → 분
    km: Math.round(route.distance / 100) / 10,                // 미터 → km (소수 1자리)
  };
}
