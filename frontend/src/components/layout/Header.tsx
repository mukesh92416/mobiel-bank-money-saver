import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Lucide from 'lucide-react'
import { cn } from '@/utils/cn'

interface HeaderProps {
  title: string
  onBack?: () => void
  rightAction?: ReactNode
  showNotification?: boolean
  notificationCount?: number
}

export function Header({
  title,
  onBack,
  rightAction,
  showNotification,
  notificationCount = 0,
}: HeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl',
        'border-b border-gray-200/50 dark:border-gray-700/50',
        'safe-area-top',
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 min-w-0">
          {onBack !== undefined && (
            <button
              onClick={handleBack}
              className={cn(
                'flex items-center justify-center size-9 rounded-xl',
                'text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-150 shrink-0',
              )}
              aria-label="Go back"
            >
              <Lucide.ArrowLeft className="size-5" />
            </button>
          )}

          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {rightAction}

          {showNotification && (
            <button
              className={cn(
                'relative flex items-center justify-center size-9 rounded-xl',
                'text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors duration-150',
              )}
              aria-label="Notifications"
            >
              <Lucide.Bell className="size-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}

          <button
            className={cn(
              'flex items-center justify-center size-9 rounded-full',
              'bg-gradient-to-br from-emerald-400 to-emerald-600',
              'text-white font-semibold text-sm',
              'shadow-md shadow-emerald-500/20',
              'hover:shadow-lg hover:shadow-emerald-500/30',
              'transition-all duration-200',
            )}
            aria-label="Profile"
          >
            <Lucide.User className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
