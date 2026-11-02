import { searchBlogReviews } from '../server/naver.js';

// GET /api/reviews?query=제주 OO찻집 후기
export default async function handler(req, res) {
  try {
    res.status(200).json(await searchBlogReviews({ query: req.query.query }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
