import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import KakaoMap from '../components/KakaoMap'
import { Empty, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'

// 내 북마크 — 로그인한 사람의 북마크만 보여요 (Supabase favorites, 본인 것만 읽도록 설정)
export default function My() {
  const { user, authReady, signOut, favorites, favLoading, loadFavorites, removeFavorite, teaHouses, loadTeaHouses } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { if (user) { loadFavorites(); loadTeaHouses() } }, [user, loadFavorites, loadTeaHouses])

  // 북마크한 찻집만 골라서 3D 지도에 올려요 ("나만의 제주 찻집 지도")
  const saved = useMemo(() => {
    const ids = new Set(favorites.filter((f) => f.source === 'tea').map((f) => String(f.item_id)))
    return teaHouses.filter((h) => ids.has(String(h.id)))
  }, [favorites, teaHouses])
  const savedIds = useMemo(() => saved.map((h) => String(h.id)), [saved])

  if (!authReady) return <Loading text="로그인 정보를 확인하는 중..." />

  if (!user) {
    return (
      <>
        <PageHeader title="내 북마크" subtitle="로그인하면 북마크한 찻집을 모아 볼 수 있어요." art="/images/dadam/oranges.png" artSide="right" />
        <div className="dd-need-login">
          <p>북마크는 로그인한 뒤에 쓸 수 있어요.</p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">로그인</Link>
            <Link to="/signup" state={{ from: location.pathname }} className="btn btn-outline-primary">회원가입</Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="내 북마크" subtitle={`${user.nickname}님이 저장한 찻집이에요.`} art="/images/dadam/oranges.png" artSide="right" />

      <div className="dd-account">
        <div>
          <strong>{user.nickname}</strong>
          <span>{user.email}</span>
        </div>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={signOut}>
          <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />로그아웃
        </button>
      </div>

      {saved.length > 0 && (
        <section className="dd-mymap">
          <h2>나만의 제주 찻집 지도</h2>
          <div className="dd-frame">
            <KakaoMap houses={saved} highlightIds={savedIds} flyKey={savedIds.join(',')}
              onSelect={(h) => navigate(`/tea/${h.id}`)} height="min(60vh, 460px)" />
          </div>
          <div className="dd-map-meta">북마크한 찻집 {saved.length}곳이에요 · 핀을 누르면 상세 페이지로 가요</div>
        </section>
      )}

      {favLoading ? <Loading /> : favorites.length === 0 ? (
        <Empty text="아직 북마크한 찻집이 없어요. 찻집 카드의 북마크 버튼을 눌러 보세요." />
      ) : (
        <ul className="dd-fav-list">
          {favorites.map((f) => (
            <li key={f.id}>
              <div>
                {f.source === 'tea' ? <Link to={`/tea/${f.item_id}`}>{f.title}</Link> : f.title}
                <small>{new Date(f.created_at).toLocaleDateString('ko-KR')}에 저장</small>
              </div>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => removeFavorite(f.id)} aria-label={`${f.title} 북마크 지우기`}>
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
