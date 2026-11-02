import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { Container, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import { useAppStore } from '../store/useAppStore'

// 이름 옆의 작은 찻잎 (원본 SVG)
function Leaf() {
  return (
    <svg className="leaf" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20C4 11 10 4 20 4c0 9-6 16-14 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 20 14 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function RootLayout() {
  const toasts = useAppStore((s) => s.toasts)
  const nickname = useAppStore((s) => s.nickname)
  const { pathname } = useLocation()
  const wide = pathname === '/map'   // 지도는 여백을 줄여 넓게

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="md" className="dd-nav" collapseOnSelect sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">다담록<Leaf /></Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" aria-label="메뉴 열기" />
          <Navbar.Collapse id="main-nav">
            <Nav className="mx-auto">
              {NAV_ITEMS.map((item) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} eventKey={item.to}>{item.label}</Nav.Link>
              ))}
            </Nav>
            <Nav className="dd-nav-icons">
              <Nav.Link as={NavLink} to="/my" eventKey="/my" aria-label="내 북마크">
                <i className="bi bi-bookmark" aria-hidden="true" /><span className="d-md-none ms-2">내 북마크</span>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/my" eventKey="/my-user" aria-label="내 정보">
                <i className="bi bi-person-circle" aria-hidden="true" />
                <span className={nickname ? 'ms-2 small' : 'd-md-none ms-2'}>{nickname || '내 정보'}</span>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1">
        <Container fluid={wide} className={wide ? 'px-3 px-lg-4 pb-4' : 'pb-5'}>
          <Outlet />   {/* ← 여기에 주소에 맞는 페이지가 들어갑니다 */}
        </Container>
      </main>

      <footer className="dd-footer">
        <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <div>
            <div className="serif mb-1">다담록</div>
            차를 담다, 제주를 만나다.
          </div>
          <div className="text-md-end">
            데이터 출처: 카카오 로컬 · 네이버 검색 · OSRM · 기상청<br />
            제주대 청년도약 부트캠프 1기 프로젝트
          </div>
        </Container>
      </footer>

      <ScrollRestoration />   {/* 페이지를 옮기면 맨 위에서 시작 */}

      {/* 스토어의 toast() 로 띄운 알림 */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant}>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>
  )
}
