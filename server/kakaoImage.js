// 카카오(다음) 이미지 검색 API — 찻집 이름으로 실제 매장 사진 찾기
// GET https://dapi.kakao.com/v2/search/image  (헤더: Authorization: KakaoAK {REST API 키})
const URL_IMAGE = 'https://dapi.kakao.com/v2/search/image';

// 같은 찻집을 여러 번 찾지 않도록 서버 메모리에 1시간 보관
const cache = new Map();
const CACHE_MS = 60 * 60 * 1000;

export async function searchShopPhotos({ name, region = '', size = 4 } = {}) {
  if (!process.env.KAKAO_REST_API_KEY) throw new Error('KAKAO_REST_API_KEY 가 .env.local 에 없어요');
  if (!name) throw new Error('name(찻집 이름)이 필요해요');

  const query = `제주 ${region} ${name}`.replace(/\s+/g, ' ').trim();
  const hit = cache.get(query);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.photos;

  const params = new URLSearchParams({ query, size: '15', sort: 'accuracy' });
  const r = await fetch(`${URL_IMAGE}?${params}`, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  });
  if (!r.ok) throw new Error(`카카오 이미지 검색 오류 ${r.status}: ${(await r.text()).slice(0, 120)}`);

  // 같은 사진이 겹치지 않게, 너무 작은 사진은 빼요
  const seen = new Set();
  const photos = [];
  for (const d of (await r.json()).documents ?? []) {
    if (!d.image_url?.startsWith('https://') || seen.has(d.image_url)) continue;   // http 사진은 https 사이트에서 막혀요
    if (d.width && d.width < 400) continue;
    seen.add(d.image_url);
    photos.push({
      image: d.image_url,
      thumbnail: d.thumbnail_url,
      source: d.display_sitename || '',
      link: d.doc_url,
    });
    if (photos.length >= size) break;
  }
  cache.set(query, { at: Date.now(), photos });
  return photos;
}
