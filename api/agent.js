import Anthropic from '@anthropic-ai/sdk';
import { searchTeaHouses, listTeaHouses } from '../server/kakao.js';
import { searchBlogReviews } from '../server/naver.js';
import { getTravelTime } from '../server/osrm.js';
import { getWeather } from '../server/weather.js';
import { getJejuTeaFacts } from '../server/teaFacts.js';
import { AIRPORT, REGIONS } from '../server/regions.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-5-5';

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const regionNames = REGIONS.map((r) => r.name);
const tools = [
  {
    name: 'search_tea_houses',
    description: '카카오 로컬 API로 제주의 찻집을 검색한다. region 을 주면 그 지역만, 안 주면 제주 전체를 돌려준다.',
    input_schema: {
      type: 'object',
      properties: { region: { type: 'string', enum: regionNames, description: '지역 이름' } },
    },
  },
  {
    name: 'search_blog_reviews',
    description: '네이버 블로그에서 찻집 후기를 검색한다. 찻집 분위기·메뉴·평판을 확인할 때 쓴다.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: '검색어 (예: 제주 애월 OO찻집 후기)' } },
      required: ['query'],
    },
  },
  {
    name: 'get_travel_time',
    description: 'OSRM으로 두 장소 사이 자동차 이동 시간(분)과 거리(km)를 구한다. 장소는 "제주공항", 지역 이름, 또는 찻집 이름.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '출발지 (제주공항 / 지역 이름 / 찻집 이름)' },
        to: { type: 'string', description: '도착지 (제주공항 / 지역 이름 / 찻집 이름)' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_jeju_tea_facts',
    description: '제주 차(녹차 재배 역사·환경·차밭 특징·첫물차)와 다른 산지(보성) 비교에 대해 확인된 사실 목록을 가져온다. 제주 차 질문에는 반드시 먼저 호출한다.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_weather',
    description: '기상청 단기예보로 제주시/서귀포시의 앞으로 몇 시간 기온·하늘·강수를 조회한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
];

// 이름 → 좌표 (제주공항 · 지역 이름 · 찻집 이름)
async function findPlace(name) {
  if (name.includes('공항')) return AIRPORT;
  const region = REGIONS.find((r) => r.name.includes(name) || name.includes(r.name));
  if (region) return region;
  const house = (await listTeaHouses()).find((h) => h.name.includes(name) || name.includes(h.name));
  if (house) return house;
  throw new Error(`"${name}" 위치를 찾지 못했어요. 먼저 search_tea_houses 로 찻집 이름을 확인하세요.`);
}

// ② 도구 이름 → 실제 실행할 함수
const runTool = {
  search_tea_houses: async ({ region }) => (await searchTeaHouses({ region })).slice(0, 15),
  search_blog_reviews: ({ query }) => searchBlogReviews({ query, display: 5 }),
  get_travel_time: async ({ from, to }) => {
    const [a, b] = await Promise.all([findPlace(from), findPlace(to)]);
    return getTravelTime({ fromLng: a.lng, fromLat: a.lat, toLng: b.lng, toLat: b.lat });
  },
  get_jeju_tea_facts: getJejuTeaFacts,
  get_weather: getWeather,
};

const SYSTEM = `너는 제주 신화 속 거인 여신 "설문대할망"이다. 제주 찻집 가이드 "다담록"에서 손님을 맞이하는 AI 가이드 역할을 한다.
- 말투: 다정한 할머니처럼 부드럽게 말한다. 인사 정도에만 제주어를 살짝 섞고("혼저옵서예" 등), 뜻은 바로 이어서 표준어로 풀어 준다. 제주어를 길게 지어내지 않는다.
- 차를 처음 접하는 사람도 편하게 느끼도록 쉬운 말로 안내한다.
- 제주 차가 다른 지역(보성 등) 차와 어떻게 다른지 물으면 get_jeju_tea_facts 의 사실만 근거로 말한다. 환경·재배 이야기까지만 하고, "제주 차가 더 맛있다/좋다"고 단정하지 않는다. 근거가 없는 건 "그건 할망도 확실히 모르니 직접 알아보렴"이라고 말한다.
- 설화는 널리 알려진 줄거리(섬과 한라산·오름을 만든 거인 여신 이야기)까지만 말하고, 자료마다 다르다는 점을 밝힌다.

[찻집 추천]
- 찻집·후기·이동 시간·날씨는 반드시 도구로 확인한 뒤 답한다. 도구 결과에 없는 찻집은 지어내지 않는다.
- 사용자가 말한 지역·분위기·차 종류 취향에 맞춰 추천하고, 이유를 후기나 거리로 뒷받침한다.
- 비가 오거나 강수확률이 높으면 실내에서 오래 머물기 좋은 곳을 먼저 제안한다.

[차 입문 안내] (도구 없이 아는 대로 답해도 된다)
- 차 마시는 법: 물 온도, 우리는 시간, 향 맡기, 천천히 나눠 마시기를 단계별로 알려 준다.
- 차 예절: 찻잔을 두 손으로 드는 것, 소리 내지 않기, 상대 잔을 먼저 채우기 같은 기본 예절을 부담 없이 설명한다.
- 차 종류: 녹차, 홍차, 우롱차, 발효차(보이차), 허브·과일 대용차(귤피차 등)를 맛과 카페인 기준으로 쉽게 비교한다.
- 확실하지 않은 수치나 유래는 단정하지 말고 "보통은 ~" 처럼 말한다.

답은 한국어로, 6문장 이내로 짧게.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [] } = req.body ?? {};
  const messages = [...history.slice(-10), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < 6; turn++) {
      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM,
        tools,
        messages,
      });

      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        return res.status(200).json({ answer, steps });
      }

      messages.push({ role: 'assistant', content: r.content }); // Claude의 도구 호출 요청을 대화에 기록
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 0, error: result?.error });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results }); // 도구 결과를 Claude에게 돌려줌
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps });
  } catch (e) {
    // 429 = 호출 한도 초과, 401 = 키 오류
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message });
  }
}
