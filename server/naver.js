// 네이버 검색 API — 블로그 후기 검색
// GET https://openapi.naver.com/v1/search/blog.json
// 헤더: X-Naver-Client-Id, X-Naver-Client-Secret / 파라미터: query, display(1~100), sort(sim|date)
const URL_BLOG = 'https://openapi.naver.com/v1/search/blog.json';

// 결과 속 <b> 태그와 &quot; 같은 HTML 문자를 없앱니다
const clean = (s = '') => s
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");

export async function searchBlogReviews({ query, display = 5 } = {}) {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 가 .env.local 에 없어요');
  }
  if (!query) throw new Error('query(검색어)가 필요해요');
  const params = new URLSearchParams({ query, display: String(display), sort: 'sim' });
  const r = await fetch(`${URL_BLOG}?${params}`, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    },
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
