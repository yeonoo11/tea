// 카카오 로컬 API — 키워드로 장소 검색
// 문서: https://developers.kakao.com/docs/ko/local/dev-guide
// GET https://dapi.kakao.com/v2/local/search/keyword.json  (헤더: Authorization: KakaoAK {REST API 키})
import { REGIONS, nearestRegion } from './regions.js';

const URL_KEYWORD = 'https://dapi.kakao.com/v2/local/search/keyword.json';

// 지역마다 12번씩 부르지 않도록 서버 메모리에 1시간 보관 (호출 한도 절약)
let cache = { at: 0, list: [] };
const CACHE_MS = 60 * 60 * 1000;

async function searchAround(region, query = '찻집') {
  const params = new URLSearchParams({
    query,
    x: String(region.lng),
    y: String(region.lat),
    radius: '7000',
    size: '15',
  });
  const r = await fetch(`${URL_KEYWORD}?${params}`, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  });
  if (!r.ok) throw new Error(`카카오 로컬 API 오류 ${r.status}: ${(await r.text()).slice(0, 120)}`);
  return (await r.json()).documents ?? [];
}

// 제주 전체 찻집 목록 (중복 제거, 지역 이름 붙이기)
export async function listTeaHouses() {
  if (!process.env.KAKAO_REST_API_KEY) throw new Error('KAKAO_REST_API_KEY 가 .env.local 에 없어요');
  if (Date.now() - cache.at < CACHE_MS && cache.list.length) return cache.list;

  const results = await Promise.all(REGIONS.map((r) => searchAround(r)));
  const byId = new Map();
  for (const d of results.flat()) {
    if (byId.has(d.id)) continue;
    const lng = Number(d.x);
    const lat = Number(d.y);
    byId.set(d.id, {
      id: d.id,
      name: d.place_name,
      category: d.category_name,
      address: d.road_address_name || d.address_name,
      phone: d.phone,
      url: d.place_url,
      lng,
      lat,
      region: nearestRegion(lng, lat),
    });
  }
  cache = { at: Date.now(), list: [...byId.values()] };
  return cache.list;
}

// 에이전트·화면 공용: 지역으로 걸러서 돌려주기
export async function searchTeaHouses({ region } = {}) {
  const all = await listTeaHouses();
  return region ? all.filter((h) => h.region.includes(region) || region.includes(h.region)) : all;
}
