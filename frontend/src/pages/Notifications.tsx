import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Gift,
  AlertTriangle,
  CheckCircle,
  CheckCheck,
} from 'lucide-react'
import { notificationService } from '@/services/notificationService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { getRelativeTime } from '@/utils/format'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'
import type { Notification } from '@/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Bell,
  achievement: Gift,
  warning: AlertTriangle,
  success: CheckCircle,
}

function NotificationIcon({ type }: { type: string }) {
  const Icon = iconMap[type] ?? Bell
  const colorMap: Record<string, string> = {
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    achievement: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    warning: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  }
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        colorMap[type] ?? colorMap.info,
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate(-1)
    },
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unread_count ?? 0

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </motion.main>
    )
  }

  if (isError) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4"
      >
        <Card variant="glass" padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Could not load notifications. Please try again.
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </motion.main>
    )
  }

  return (
    <motion.main
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="pb-28 px-4 pt-4 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<CheckCheck className="size-4" />}
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-12" />}
          title="No notifications yet"
          description="We'll let you know when something happens."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {notifications.map((notification: Notification) => (
            <motion.div key={notification.id} variants={staggerItem}>
              <Card
                variant="elevated"
                padding="md"
                onClick={() => {
                  if (!notification.read) {
                    markReadMutation.mutate(notification.id)
                  }
                }}
                className={cn(
                  'relative flex items-start gap-3',
                  !notification.read && 'cursor-pointer',
                )}
              >
                {!notification.read && (
                  <span className="absolute top-3 left-3 size-2 rounded-full bg-blue-500 shrink-0" />
                )}
                <div className={cn(!notification.read && 'ml-4')}>
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'text-sm font-semibold',
                    notification.read
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100',
                  )}>
                    {notification.title}
                  </h3>
                  {notification.message && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {getRelativeTime(notification.created_at)}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  )
}
