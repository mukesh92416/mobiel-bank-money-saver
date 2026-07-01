import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format'

interface HeatmapEntry {
  amount: number
  count: number
  intensity: number
}

interface SavingsHeatmapProps {
  data: Record<string, HeatmapEntry>
  year: number
}

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getIntensityClass(intensity: number): string {
  if (intensity <= 0) return 'bg-gray-100 dark:bg-gray-800'
  if (intensity <= 1) return 'bg-emerald-200 dark:bg-emerald-900'
  if (intensity <= 2) return 'bg-emerald-300 dark:bg-emerald-700'
  if (intensity <= 3) return 'bg-emerald-500 dark:bg-emerald-500'
  return 'bg-emerald-700 dark:bg-emerald-300'
}

export function SavingsHeatmap({ data, year }: SavingsHeatmapProps) {
  const weeks = useMemo(() => {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const result: { date: string; day: number; month: number; dayOfWeek: number }[][] = []
    let currentWeek: { date: string; day: number; month: number; dayOfWeek: number }[] = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay()
      const day = d.getDate()

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push({ date: dateStr, day, month: d.getMonth(), dayOfWeek })
    }
    if (currentWeek.length > 0) result.push(currentWeek)

    while (result[0]?.length < 7) {
      result[0].unshift({ date: '', day: 0, month: -1, dayOfWeek: 0 })
    }

    return result
  }, [year])

  const monthLabels = useMemo(() => {
    const labels: { index: number; label: string }[] = []
    weeks.forEach((week, weekIdx) => {
      const firstRealDay = week.find(d => d.month >= 0)
      if (firstRealDay && !labels.find(l => l.index === firstRealDay.month)) {
        labels.push({ index: firstRealDay.month, label: MONTHS[firstRealDay.month] })
      }
    })
    return labels
  }, [weeks])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] pt-5 pr-1">
          {DAYS.map((day, i) => (
            <span key={i} className="text-[9px] text-gray-400 dark:text-gray-500 h-[14px] leading-[14px]">
              {day}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-[3px]">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[9px] text-gray-400 dark:text-gray-500 font-medium"
                style={{ marginLeft: i === 0 ? 0 : weeks.findIndex(w => w.some(d => d.month === m.index && d.dayOfWeek === 0)) * 15 - 4 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px] mt-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  const entry = data[day.date]
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className={cn(
                        'size-[14px] rounded-[3px] transition-colors duration-200',
                        entry ? getIntensityClass(entry.intensity) : 'bg-transparent',
                      )}
                      title={entry ? `${day.date}: ${formatCurrency(entry.amount)}` : day.date || ''}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-[9px] text-gray-400 dark:text-gray-500">Less</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={cn('size-[10px] rounded-sm', getIntensityClass(i))} />
            ))}
            <span className="text-[9px] text-gray-400 dark:text-gray-500">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
