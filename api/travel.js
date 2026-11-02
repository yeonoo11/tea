import { getTravelTime } from '../server/osrm.js';

// GET /api/travel?fromLng=..&fromLat=..&toLng=..&toLat=..
export default async function handler(req, res) {
  try {
    const { fromLng, fromLat, toLng, toLat } = req.query;
    res.status(200).json(await getTravelTime({ fromLng, fromLat, toLng, toLat }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
