// 네이버 검색 API — 블로그 후기 검색
// GET https://openapi.naver.com/v1/search/blog.json
// 헤더: X-Naver-Client-Id, X-Naver-Client-Secret / 파라미터: query, display(1~100), sort(sim|date)
const URL_BLOG = 'https://openapi.naver.com/v1/search/blog.json';
// 새 NAVER API HUB (네이버 클라우드 플랫폼) — 개발자센터 키와는 별개의 키예요. 가이드: https://guide.ncloud-docs.com/docs/apihub-migration
// 블로그 경로(/search/v1/blog)는 뉴스 경로(/search/v1/news)를 보고 짐작한 값이라, 안 되면 API HUB 가이드의 블로그 검색 경로로 고쳐 주세요.
const URL_BLOG_HUB = 'https://naverapihub.apigw.ntruss.com/search/v1/blog';

// 결과 속 <b> 태그와 &quot; 같은 HTML 문자를 없앱니다
const clean = (s = '') => s
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");

export async function searchBlogReviews({ query, display = 5 } = {}) {
  const hub = Boolean(process.env.NAVER_HUB_CLIENT_ID && process.env.NAVER_HUB_CLIENT_SECRET);
  if (!hub && !(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)) {
    throw new Error('NAVER_HUB_CLIENT_ID / NAVER_HUB_CLIENT_SECRET (NAVER API HUB 키)가 .env.local 에 없어요');
  }
  if (!query) throw new Error('query(검색어)가 필요해요');
  const params = new URLSearchParams({ query, display: String(display), sort: 'sim' });
  const r = await fetch(`${hub ? URL_BLOG_HUB : URL_BLOG}?${params}`, {
    headers: hub
      ? { 'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_HUB_CLIENT_ID, 'X-NCP-APIGW-API-KEY': process.env.NAVER_HUB_CLIENT_SECRET }
      : { 'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID, 'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET },
  });
  if (!r.ok) throw new Error(`네이버 검색 API 오류 ${r.status}: ${(await r.text()).slice(0, 120)}`);
  const data = await r.json();
  return (data.items ?? []).map((i) => ({
    title: clean(i.title),
    summary: clean(i.description),
    blogger: i.bloggername,
    date: i.postdate,
    link: i.link,
  }));
}
