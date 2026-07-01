import type { Transaction, Goal, AnalyticsSummary, StreakData } from '@/types'

export interface CoachInsight {
  id: string
  type: 'positive' | 'negative' | 'info' | 'tip'
  icon: string
  title: string
  message: string
  action?: { label: string; to: string }
}

export function generateInsights(
  transactions: Transaction[],
  goals: Goal[],
  summary: AnalyticsSummary | null,
  streak: StreakData | null,
): CoachInsight[] {
  const insights: CoachInsight[] = []

  if (!transactions.length) {
    insights.push({
      id: 'welcome',
      type: 'info',
      icon: 'Sparkles',
      title: 'Welcome to MoneySaver!',
      message: 'Start by adding your first deposit to begin tracking your savings journey.',
      action: { label: 'Add Money', to: '/add' },
    })
    return insights
  }

  const deposits = transactions.filter((t) => t.type === 'deposit')
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal')

  if (deposits.length > 0) {
    const sorted = [...deposits].sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
    const latestDeposit = sorted[0]

    const dayOfWeek = new Date(latestDeposit.transaction_date).toLocaleDateString('en-IN', { weekday: 'long' })
    const sameDayDeposits = deposits.filter(
      (t) => new Date(t.transaction_date).toLocaleDateString('en-IN', { weekday: 'long' }) === dayOfWeek
    )

    if (sameDayDeposits.length >= 3) {
      insights.push({
        id: 'pattern-day',
        type: 'tip',
        icon: 'Calendar',
        title: 'Saving Pattern Detected',
        message: `You usually save on ${dayOfWeek}s. Consider setting up a weekly auto-save for this day.`,
        action: { label: 'Set Auto Save', to: '/auto-save/new' },
      })
    }
  }

  if (summary) {
    const avgDeposit = summary.total_deposits / deposits.length
    const last5Deposits = deposits.slice(0, 5)
    const recentAvg = last5Deposits.length > 0
      ? last5Deposits.reduce((s, t) => s + t.amount, 0) / last5Deposits.length
      : 0

    if (recentAvg > 0 && avgDeposit > 0 && recentAvg > avgDeposit * 1.1) {
      insights.push({
        id: 'increasing',
        type: 'positive',
        icon: 'TrendingUp',
        title: 'Saving More!',
        message: `Your recent deposits average ${formatInsightCurrency(recentAvg)} — that's ${Math.round((recentAvg / avgDeposit - 1) * 100)}% more than your overall average of ${formatInsightCurrency(avgDeposit)}.`,
      })
    }

    if (summary.monthly_deposits > 0 && summary.total_deposits > 0) {
      const monthsActive = Math.max(1, deposits.length > 0
        ? Math.ceil(
            (new Date(deposits[deposits.length - 1].transaction_date).getTime() -
              new Date(deposits[0].transaction_date).getTime()) /
              (30 * 86400000)
          )
        : 1
      )
      const monthlyAvg = summary.total_deposits / monthsActive
      const currentMonth = summary.monthly_deposits

      if (currentMonth > monthlyAvg * 1.15) {
        insights.push({
          id: 'month-improve',
          type: 'positive',
          icon: 'TrendingUp',
          title: 'This Month is Great!',
          message: `You've saved ${formatInsightCurrency(currentMonth)} this month — ${Math.round((currentMonth / monthlyAvg - 1) * 100)}% more than your monthly average of ${formatInsightCurrency(monthlyAvg)}. Keep it up!`,
        })
      } else if (currentMonth < monthlyAvg * 0.7) {
        insights.push({
          id: 'month-drop',
          type: 'negative',
          icon: 'TrendingDown',
          title: 'Slow Month',
          message: `You've saved ${formatInsightCurrency(currentMonth)} this month, which is below your monthly average of ${formatInsightCurrency(monthlyAvg)}. Try to catch up!`,
        })
      }
    }
  }

  if (withdrawals.length > 0) {
    const totalWithdrawn = withdrawals.reduce((s, t) => s + t.amount, 0)
    const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0)

    if (totalWithdrawn > 0 && totalDeposited > 0) {
      const withdrawalRatio = totalWithdrawn / totalDeposited
      if (withdrawalRatio > 0.5) {
        insights.push({
          id: 'high-withdrawal',
          type: 'negative',
          icon: 'AlertTriangle',
          title: 'High Withdrawal Rate',
          message: `You've withdrawn ${formatInsightCurrency(totalWithdrawn)} — that's ${Math.round(withdrawalRatio * 100)}% of your total deposits. Try to reduce withdrawals.`,
        })
      }
    }
  }

  if (summary && summary.balance > 0) {
    const dailyRate = summary.today_deposits
    if (dailyRate > 0) {
      const daysToGoal = Math.round(summary.balance / dailyRate)
      insights.push({
        id: 'daily-rate',
        type: 'tip',
        icon: 'Zap',
        title: 'At This Rate...',
        message: `If you save ${formatInsightCurrency(dailyRate)} daily, you'll reach your current balance of ${formatInsightCurrency(summary.balance)} in about ${daysToGoal} days.`,
      })
    }
  }

  if (summary && summary.monthly_deposits > 0 && goals.length > 0) {
    const incomplete = goals.filter(g => !g.completed)
    incomplete.forEach(goal => {
      const monthsNeeded = Math.ceil(goal.remaining / summary.monthly_deposits)
      if (monthsNeeded > 0 && monthsNeeded <= 12) {
        insights.push({
          id: `goal-forecast-${goal.id}`,
          type: 'positive',
          icon: 'Target',
          title: `Goal Forecast: ${goal.title}`,
          message: `At your current monthly savings rate of ${formatInsightCurrency(summary.monthly_deposits)}, you'll complete "${goal.title}" in ${monthsNeeded} month${monthsNeeded > 1 ? 's' : ''}!`,
          action: { label: 'View Goal', to: `/goals/${goal.id}` },
        })
      }
    })
  }

  if (summary && summary.month_over_month_change !== null) {
    if (summary.month_over_month_change > 10) {
      insights.push({
        id: 'mom-gain',
        type: 'positive',
        icon: 'TrendingUp',
        title: 'Month Over Month Growth',
        message: `You saved ${summary.month_over_month_change}% more this month compared to last month. Excellent progress!`,
      })
    } else if (summary.month_over_month_change < -10) {
      insights.push({
        id: 'mom-loss',
        type: 'negative',
        icon: 'TrendingDown',
        title: 'Month Over Month Decline',
        message: `Your savings dropped ${Math.abs(summary.month_over_month_change)}% compared to last month. Try to maintain consistency.`,
      })
    }
  }

  if (deposits.length >= 10) {
    const amounts = deposits.map(t => t.amount)
    const maxDeposit = Math.max(...amounts)
    const minDeposit = Math.min(...amounts)
    if (maxDeposit > minDeposit * 5) {
      insights.push({
        id: 'deposit-variance',
        type: 'info',
        icon: 'BarChart3',
        title: 'Saving Pattern',
        message: `Your deposits range from ${formatInsightCurrency(minDeposit)} to ${formatInsightCurrency(maxDeposit)}. Consistent amounts make budgeting easier.`,
      })
    }
  }

  if (deposits.length >= 5 && summary) {
    const total = deposits.reduce((s, t) => s + t.amount, 0)
    const avg = total / deposits.length
    const recent5 = deposits.slice(0, 5)
    const recentAvg = recent5.reduce((s, t) => s + t.amount, 0) / recent5.length
    if (recentAvg < avg * 0.5) {
      insights.push({
        id: 'declining-deposits',
        type: 'negative',
        icon: 'AlertTriangle',
        title: 'Declining Deposits',
        message: 'Your recent 5 deposits average significantly lower than your overall average. Consider increasing your savings amount.',
        action: { label: 'Add Money', to: '/add' },
      })
    }
  }

  if (goals.length > 0) {
    const incomplete = goals.filter((g) => !g.completed)
    incomplete.forEach((goal) => {
      const remaining = goal.remaining
      if (remaining > 0 && summary && summary.monthly_deposits > 0) {
        const monthsNeeded = Math.ceil(remaining / summary.monthly_deposits)
        if (monthsNeeded > 0 && monthsNeeded < 60) {
          insights.push({
            id: `goal-${goal.id}`,
            type: 'info',
            icon: 'Target',
            title: `Goal: ${goal.title}`,
            message: `You need ${formatInsightCurrency(remaining)} more. At your current monthly savings rate (${formatInsightCurrency(summary.monthly_deposits)}/month), you'll reach it in about ${monthsNeeded} month${monthsNeeded > 1 ? 's' : ''}.`,
            action: { label: 'View Goal', to: `/goals/${goal.id}` },
          })
        }
      }
    })
  }

  if (withdrawals.length > 0) {
    const cats: Record<string, number> = {}
    withdrawals.forEach((w) => {
      const cat = w.category || 'other'
      cats[cat] = (cats[cat] || 0) + w.amount
    })
    const topCat = Object.entries(cats).sort(([, a], [, b]) => b - a)[0]
    if (topCat && topCat[1] > 0) {
      insights.push({
        id: 'top-withdraw-cat',
        type: 'info',
        icon: 'BarChart3',
        title: 'Top Withdrawal Category',
        message: `Your highest withdrawal category is "${topCat[0]}" at ${formatInsightCurrency(topCat[1])}.`,
      })
    }
  }

  if (streak && streak.current_streak > 0) {
    if (streak.current_streak >= 7) {
      insights.push({
        id: 'streak-milestone',
        type: 'positive',
        icon: 'Flame',
        title: `${streak.current_streak}-Day Streak!`,
        message: `You've saved for ${streak.current_streak} consecutive days! This is your longest streak ever!` +
          (streak.longest_streak > streak.current_streak
            ? ` Your all-time best is ${streak.longest_streak} days.`
            : ''),
      })
    }
  }

  const recentCount = deposits.filter(
    (t) => new Date(t.transaction_date) >= new Date(Date.now() - 7 * 86400000)
  ).length
  if (recentCount === 0 && deposits.length > 0) {
    insights.push({
      id: 'no-recent',
      type: 'negative',
      icon: 'Bell',
      title: 'No Savings This Week',
      message: "You haven't made any deposits in the last 7 days. Try to save something today!",
      action: { label: 'Add Money', to: '/add' },
    })
  }

  if (insights.length > 5) {
    return insights.slice(0, 5)
  }

  return insights
}

function formatInsightCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
