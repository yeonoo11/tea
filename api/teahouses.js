import { searchTeaHouses } from '../server/kakao.js';

// GET /api/teahouses            → 제주 전체 찻집
// GET /api/teahouses?region=애월 → 그 지역 찻집만
export default async function handler(req, res) {
  try {
    res.status(200).json(await searchTeaHouses({ region: req.query.region }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
