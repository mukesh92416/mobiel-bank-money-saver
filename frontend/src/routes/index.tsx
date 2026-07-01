import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'

const SplashScreen = lazy(() => import('@/pages/SplashScreen'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Goals = lazy(() => import('@/pages/Goals'))
const GoalDetail = lazy(() => import('@/pages/GoalDetail'))
const CreateGoal = lazy(() => import('@/pages/CreateGoal'))
const AddMoney = lazy(() => import('@/pages/AddMoney'))
const WithdrawMoney = lazy(() => import('@/pages/WithdrawMoney'))
const TransactionHistory = lazy(() => import('@/pages/TransactionHistory'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const Achievements = lazy(() => import('@/pages/Achievements'))
const Profile = lazy(() => import('@/pages/Profile'))
const Settings = lazy(() => import('@/pages/Settings'))
const AutoSave = lazy(() => import('@/pages/AutoSave'))
const CreateAutoSave = lazy(() => import('@/pages/CreateAutoSave'))

function SuspenseFallback() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

function LazyPage({ Component }: { Component: React.LazyExoticComponent<() => ReactNode> }) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Component />
    </Suspense>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return <SuspenseFallback />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return <SuspenseFallback />

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LazyPage Component={SplashScreen} />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LazyPage Component={Login} />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <LazyPage Component={Register} />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <LazyPage Component={ForgotPassword} />
      </PublicRoute>
    ),
  },
  {
    path: '/share',
    element: <Navigate to="/add" replace />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <LazyPage Component={Dashboard} /> },
      { path: '/goals', element: <LazyPage Component={Goals} /> },
      { path: '/goals/new', element: <LazyPage Component={CreateGoal} /> },
      { path: '/goals/:id', element: <LazyPage Component={GoalDetail} /> },
      { path: '/goals/:id/edit', element: <LazyPage Component={CreateGoal} /> },
      { path: '/add', element: <LazyPage Component={AddMoney} /> },
      { path: '/withdraw', element: <LazyPage Component={WithdrawMoney} /> },
      { path: '/history', element: <LazyPage Component={TransactionHistory} /> },
      { path: '/auto-save', element: <LazyPage Component={AutoSave} /> },
      { path: '/auto-save/new', element: <LazyPage Component={CreateAutoSave} /> },
      { path: '/analytics', element: <LazyPage Component={Analytics} /> },
      { path: '/notifications', element: <LazyPage Component={Notifications} /> },
      { path: '/achievements', element: <LazyPage Component={Achievements} /> },
      { path: '/profile', element: <LazyPage Component={Profile} /> },
      { path: '/settings', element: <LazyPage Component={Settings} /> },
    ],
  },
])
