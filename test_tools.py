"""jeju_tea_tools.py 의 함수 3개를 하나씩 실행해 보는 테스트.

실행:  python test_tools.py
- 키가 .env 에 없는 도구는 "건너뜀"으로 표시돼요. (OSRM 은 키가 필요 없어요)
"""

import json

from jeju_tea_tools import get_travel_time, search_blog_reviews, search_restaurants


def show(title, result):
    print(f"\n=== {title} ===")
    print(json.dumps(result, ensure_ascii=False, indent=2)[:1200])


def run(title, func, check, **kwargs):
    """함수를 실행하고, 결과가 기대한 모양인지 확인해요."""
    result = func(**kwargs)
    show(title, result)
    if "error" in result and ".env" in result["error"]:
        print("-> 건너뜀 (API 키 없음)")
        return None
    assert "error" not in result, f"실패: {result['error']}"
    assert check(result), "결과 모양이 기대와 달라요"
    print("-> 통과")
    return result


if __name__ == "__main__":
    # 1) 제주시청 근처 카페(CE7) 5곳
    cafes = run("1) search_restaurants", search_restaurants,
                lambda r: len(r["places"]) > 0, category="CE7", size=5)

    # 2) 블로그 후기
    run("2) search_blog_reviews", search_blog_reviews,
        lambda r: len(r["reviews"]) > 0, query="제주 찻집 후기", display=3)

    # 3) 이동 시간: 제주공항 -> 제주시청 (키 필요 없음)
    run("3) get_travel_time", get_travel_time,
        lambda r: r["duration_min"] > 0,
        from_x=126.4930, from_y=33.5113, to_x=126.5312, to_y=33.4996)

    # 1번 결과의 첫 장소로 3번을 이어서 쓰는 예 (에이전트가 하는 방식)
    if cafes:
        first = cafes["places"][0]
        run("보너스) 시청 -> " + first["name"], get_travel_time,
            lambda r: r["duration_min"] >= 0,
            from_x=126.5312, from_y=33.4996, to_x=first["x"], to_y=first["y"])
