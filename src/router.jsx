import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import TeaList from './pages/TeaList'
import TeaDetail from './pages/TeaDetail'
import TeaGuide from './pages/TeaGuide'
import TeaMap from './pages/TeaMap'
import Agent from './pages/Agent'
import My from './pages/My'
import NotFound from './pages/NotFound'

// ── 메뉴 목록 ────────────────────────────────────────────
// 페이지를 추가할 때: ① pages/에 파일 만들기 ② 아래 NAV_ITEMS 에 한 줄 추가 ③ routes 에 한 줄 추가
export const NAV_ITEMS = [
  { to: '/tea', label: '찻집 찾기' },
  { to: '/guide', label: '차 가이드' },
  { to: '/map', label: '제주 지도' },
  { to: '/agent', label: '이야기' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,      // 모든 페이지에 공통으로 보이는 틀(메뉴·푸터)
    errorElement: <NotFound />,   // 없는 주소로 들어오면
    children: [
      { index: true, element: <Home /> },
      { path: 'tea', element: <TeaList /> },
      { path: 'tea/:id', element: <TeaDetail /> },
      { path: 'guide', element: <TeaGuide /> },
      { path: 'map', element: <TeaMap /> },
      { path: 'agent', element: <Agent /> },
      { path: 'my', element: <My /> },
    ],
  },
])
