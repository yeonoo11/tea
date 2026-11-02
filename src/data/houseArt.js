// 실제 매장 사진 데이터가 없어서, 분위기를 보여 주는 수채화(예시)를 찻집마다 돌려 가며 보여줘요
const HOUSE_ART = ['house-1', 'house-2', 'house-3']
export const artOf = (house) => HOUSE_ART[Number(String(house.id).replace(/\D/g, '').slice(-3) || 0) % HOUSE_ART.length]
