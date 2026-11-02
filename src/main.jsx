import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// ── 디자인 ───────────────────────────────────────────────
// 기본 Bootstrap 5 위에 우리 테마(styles/theme.css)를 얹습니다. (v2: 민트 테마 대신 직접 만든 미니멀 테마)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'

import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
