import { NavLink, useLocation } from 'react-router-dom'
import * as Lucide from 'lucide-react'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  path: string
  icon: keyof typeof Lucide
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: 'LayoutDashboard' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3' },
  { label: 'Goals', path: '/goals', icon: 'Target' },
  { label: 'History', path: '/history', icon: 'ArrowLeftRight' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50',
        'bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg',
        'border-t border-gray-200/50 dark:border-gray-700/50',
        'pb-safe pb-[env(safe-area-inset-bottom,0px)]',
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ label, path, icon }) => {
          const Icon = Lucide[icon] as React.ComponentType<{ className?: string; strokeWidth?: number }>
          const isActive = location.pathname === path

          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'min-w-14 py-1 px-2 rounded-xl',
                'transition-all duration-200 ease-out',
                isActive
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-transform duration-200',
                  isActive && 'scale-110',
                )}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-all duration-200',
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-70',
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-emerald-500" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
