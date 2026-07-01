import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  PiggyBank,
  IndianRupee,
  Flame,
  ArrowLeftRight,
  Trophy,
  Sun,
  Moon,
  Crown,
  Lock,
  AlertCircle,
  Award,
} from 'lucide-react'
import * as Lucide from 'lucide-react'
import { achievementService } from '@/services/achievementService'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'
import type { Achievement } from '@/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'piggy-bank': PiggyBank,
  'rupee-sign': IndianRupee,
  fire: Flame,
  'exchange-alt': ArrowLeftRight,
  trophy: Trophy,
  sun: Sun,
  moon: Moon,
  crown: Crown,
}

function getAchievementIcon(iconName: string, className?: string) {
  const Icon = iconMap[iconName]
    ?? (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
    ?? PiggyBank
  return <Icon className={className} />
}

export default function Achievements() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementService.list(),
  })

  const achievements = data?.achievements ?? []
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  if (isLoading) {
    return (
      <motion.main
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="pb-28 px-4 pt-4 space-y-5"
      >
        <div className="h-7 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <Skeleton className="size-12 rounded-full mx-auto" />
              <Skeleton className="h-3 w-3/4 mx-auto" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-2/3 mx-auto" />
            </div>
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
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Could not load achievements. Please try again.
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
          Achievements
        </h1>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:to-yellow-500/5 border border-amber-200/50 dark:border-amber-700/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Award className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {unlockedCount} of {achievements.length} unlocked
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-36 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${achievements.length ? (unlockedCount / achievements.length) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
              />
            </div>
          </div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <EmptyState
          icon={<Award className="size-12" />}
          title="No achievements yet"
          description="Start saving to unlock achievements!"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {achievements.map((achievement: Achievement) => (
            <motion.div key={achievement.id} variants={staggerItem}>
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative rounded-2xl border p-4 transition-all duration-200 overflow-hidden',
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-emerald-200/60 dark:border-emerald-700/40 shadow-lg shadow-emerald-500/10'
                    : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50',
                )}
              >
                {achievement.unlocked && (
                  <>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 1] }}
                      transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                      className="absolute -top-6 -right-6 size-16 rounded-full bg-emerald-400/20 blur-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
                  </>
                )}

                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 rounded-2xl">
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="size-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Locked
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center text-center relative z-[1]">
                  <motion.div
                    animate={
                      achievement.unlocked
                        ? { scale: [1, 1.1, 1], transition: { duration: 0.5, ease: 'easeOut' } }
                        : {}
                    }
                    className={cn(
                      'flex size-12 items-center justify-center rounded-full mb-3',
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {getAchievementIcon(achievement.icon, 'size-6')}
                  </motion.div>

                  <h3
                    className={cn(
                      'text-sm font-semibold leading-tight mb-1',
                      achievement.unlocked
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    {achievement.name}
                  </h3>

                  {achievement.description && (
                    <p
                      className={cn(
                        'text-[11px] leading-relaxed line-clamp-2',
                        achievement.unlocked
                          ? 'text-gray-600 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500',
                      )}
                    >
                      {achievement.description}
                    </p>
                  )}

                  {achievement.unlocked && achievement.unlocked_at && (
                    <p className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Unlocked {formatDate(achievement.unlocked_at)}
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  )
}
