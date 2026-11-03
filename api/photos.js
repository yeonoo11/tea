import { searchShopPhotos } from '../server/kakaoImage.js';

// GET /api/photos?name=다소니&region=제주시 → 그 찻집의 실제 사진 후보
export default async function handler(req, res) {
  try {
    res.status(200).json(await searchShopPhotos({ name: req.query.name, region: req.query.region }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
