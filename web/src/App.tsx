import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router'
import { useAuth } from './store/useAuth'
import { MotionConfig } from 'motion/react'
import { Printing } from './components/ui'
import LandingPage from './pages/LandingPage'

// The app shell and auth pages load on demand, so the landing page stays light.
const AppPage = lazy(() => import('./pages/AppPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))

function FullScreenLoading() {
  return (
    <div className="grid h-dvh place-items-center">
      <Printing>OPENING THE BOOKS</Printing>
    </div>
  )
}

function Root() {
  const bootstrap = useAuth((s) => s.bootstrap)
  useEffect(() => {
    bootstrap()
  }, [bootstrap])
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <Outlet />
    </Suspense>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status)
  const location = useLocation()
  if (status === 'unknown') return <FullScreenLoading />
  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/signup', element: <AuthPage mode="signup" /> },
      { path: '/app', element: <RequireAuth><AppPage /></RequireAuth> },
      { path: '/app/c/:caseId', element: <RequireAuth><AppPage /></RequireAuth> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  // Paper doesn't move for anyone who's asked it not to (design.md §8).
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
