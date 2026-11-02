"""제주 찻집 찾기 에이전트용 도구(함수) 3개.

  1) search_restaurants   : 카카오 로컬 API - 카테고리로 장소 검색
  2) search_blog_reviews  : 네이버 검색 API - 블로그 후기 검색
  3) get_travel_time      : OSRM - 두 지점 사이 자동차 이동 시간

API 키는 코드에 쓰지 않고 .env 파일에서 읽어요. (.env.example 참고)
외부 라이브러리 없이 파이썬 기본 라이브러리만 사용합니다.

모든 함수는 에러가 나도 예외를 던지지 않고 {"error": "..."} 를 돌려줘요.
(에이전트가 에러 내용을 읽고 스스로 다음 행동을 고를 수 있게 하기 위해서예요.)
"""

import html
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

# ----------------------------------------------------------------------
# 공통: .env 읽기 / HTTP 요청
# ----------------------------------------------------------------------

def _load_env(path=None):
    """.env 파일의 KEY=VALUE 줄을 읽어서 환경변수에 넣어요.
    이미 설정된 환경변수는 덮어쓰지 않아요."""
    path = path or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            # 줄 끝 주석(# ...) 과 따옴표 제거
            value = value.split(" #", 1)[0].strip().strip('"').strip("'")
            os.environ.setdefault(key.strip(), value)


_load_env()


def _get_json(url, params, headers=None, timeout=10):
    """GET 요청을 보내고 JSON을 돌려줘요. 실패하면 {"error": ...} 를 돌려줘요."""
    full_url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(full_url, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # 서버가 알려 준 에러 내용을 같이 보여 줘요 (키 오류, 파라미터 오류 등)
        detail = e.read().decode("utf-8", errors="replace")[:300]
        return {"error": f"HTTP {e.code}: {detail}"}
    except (urllib.error.URLError, TimeoutError) as e:
        return {"error": f"네트워크 오류: {e}"}


def _need_env(*names):
    """필요한 키가 .env 에 없으면 안내 문구를 돌려줘요. (있으면 None)"""
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        return {"error": f".env 에 {', '.join(missing)} 값이 없어요. .env.example 을 참고해 채워 주세요."}
    return None


# ----------------------------------------------------------------------
# 1) 카카오 로컬 - 카테고리로 장소 검색
#    문서: https://developers.kakao.com/docs/ko/local/dev-guide
#    GET https://dapi.kakao.com/v2/local/search/category.json
#    헤더: Authorization: KakaoAK {REST API 키}
# ----------------------------------------------------------------------

KAKAO_CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json"

# 제주시청 근처 좌표 (x = 경도, y = 위도). 위치를 안 주면 여기를 기준으로 찾아요.
JEJU_CITY_X, JEJU_CITY_Y = 126.5312, 33.4996


def search_restaurants(category="CE7", x=JEJU_CITY_X, y=JEJU_CITY_Y,
                       radius=2000, size=10, sort="distance"):
    """기준 좌표 주변의 장소를 카테고리로 검색해요.

    category: 카카오 카테고리 코드. CE7=카페(찻집), FD6=음식점, AT4=관광명소
    x, y    : 기준 좌표 (경도, 위도)
    radius  : 검색 반경(미터, 0~20000)
    size    : 가져올 개수 (1~15)
    sort    : "distance"(가까운 순) 또는 "accuracy"(정확도 순)
    """
    err = _need_env("KAKAO_REST_API_KEY")
    if err:
        return err

    params = {
        "category_group_code": category,
        "x": x,
        "y": y,
        "radius": max(0, min(int(radius), 20000)),
        "size": max(1, min(int(size), 15)),
        "sort": sort,
    }
    headers = {"Authorization": f"KakaoAK {os.environ['KAKAO_REST_API_KEY']}"}
    data = _get_json(KAKAO_CATEGORY_URL, params, headers)
    if "error" in data:
        return data

    # 에이전트가 쓰기 쉽게 필요한 항목만 골라서 돌려줘요.
    places = [
        {
            "name": d.get("place_name"),
            "category": d.get("category_name"),
            "address": d.get("road_address_name") or d.get("address_name"),
            "phone": d.get("phone"),
            "x": float(d["x"]),          # 경도
            "y": float(d["y"]),          # 위도
            "distance_m": int(d["distance"]) if d.get("distance") else None,
            "url": d.get("place_url"),
        }
        for d in data.get("documents", [])
    ]
    return {"total_count": data.get("meta", {}).get("total_count"), "places": places}


# ----------------------------------------------------------------------
# 2) 네이버 검색 - 블로그 후기 검색
#    GET https://openapi.naver.com/v1/search/blog.json
#    헤더: X-Naver-Client-Id, X-Naver-Client-Secret
#    파라미터: query(필수), display(1~100), start(1~1000), sort(sim|date)
# ----------------------------------------------------------------------

NAVER_BLOG_URL = "https://openapi.naver.com/v1/search/blog.json"


def _clean(text):
    """네이버 결과의 <b> 태그와 &quot; 같은 HTML 문자를 없애요."""
    return html.unescape(re.sub(r"<[^>]+>", "", text or ""))


def search_blog_reviews(query, display=5, sort="sim"):
    """네이버 블로그에서 후기를 검색해요. 예: "제주 애월 OO찻집 후기"

    query  : 검색어
    display: 가져올 개수 (1~100)
    sort   : "sim"(정확도 순) 또는 "date"(최신 순)
    """
    err = _need_env("NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET")
    if err:
        return err

    params = {"query": query, "display": max(1, min(int(display), 100)), "sort": sort}
    headers = {
        "X-Naver-Client-Id": os.environ["NAVER_CLIENT_ID"],
        "X-Naver-Client-Secret": os.environ["NAVER_CLIENT_SECRET"],
    }
    data = _get_json(NAVER_BLOG_URL, params, headers)
    if "error" in data:
        return data

    reviews = [
        {
            "title": _clean(item.get("title")),
            "summary": _clean(item.get("description")),
            "blogger": item.get("bloggername"),
            "date": item.get("postdate"),   # 예: 20261101
            "link": item.get("link"),
        }
        for item in data.get("items", [])
    ]
    return {"total": data.get("total"), "reviews": reviews}


# ----------------------------------------------------------------------
# 3) OSRM - 두 지점 사이 이동 시간
#    문서: https://project-osrm.org/docs/v5.24.0/api/#route-service
#    GET http://router.project-osrm.org/route/v1/{profile}/{경도,위도;경도,위도}
#    ※ 좌표 순서가 "경도,위도" 예요. (위도,경도 아님!)
#    ※ 무료 데모 서버라 API 키는 필요 없지만, 자동차(driving)만 지원해요.
# ----------------------------------------------------------------------

OSRM_URL = "https://router.project-osrm.org/route/v1"


def get_travel_time(from_x, from_y, to_x, to_y, profile="driving"):
    """출발지에서 도착지까지 자동차로 걸리는 시간/거리를 알려줘요.

    from_x, from_y: 출발지 (경도, 위도)
    to_x, to_y    : 도착지 (경도, 위도)
    """
    coords = f"{from_x},{from_y};{to_x},{to_y}"
    data = _get_json(f"{OSRM_URL}/{profile}/{coords}", {"overview": "false"})
    if "error" in data:
        return data
    if data.get("code") != "Ok" or not data.get("routes"):
        return {"error": f"경로를 찾지 못했어요 (code={data.get('code')})"}

    route = data["routes"][0]
    return {
        "duration_min": round(route["duration"] / 60, 1),   # 초 -> 분
        "distance_km": round(route["distance"] / 1000, 2),  # 미터 -> km
    }
