import { api } from '@/api/client'
import type { AnalyticsSummary, TrendDataPoint, CategoryData, StreakData, PredictionData, ComparisonData, HeatmapData } from '@/types'

export const analyticsService = {
  summary: () =>
    api.get<AnalyticsSummary>('/analytics/summary'),

  trend: (period?: string) =>
    api.get<{ trend: TrendDataPoint[] }>('/analytics/trend', { period }),

  categories: () =>
    api.get<{ deposits: CategoryData[]; withdrawals: CategoryData[] }>('/analytics/categories'),

  goals: () =>
    api.get<{ goals: { title: string; target: number; current: number; progress: number; remaining: number }[] }>('/analytics/goals'),

  streak: () =>
    api.get<StreakData>('/analytics/streak'),

  prediction: (months?: number) =>
    api.get<PredictionData>('/analytics/prediction', { months: String(months ?? 3) }),

  comparison: () =>
    api.get<ComparisonData>('/analytics/comparison'),

  heatmap: (year?: number) =>
    api.get<HeatmapData>('/analytics/heatmap', { year: String(year ?? new Date().getFullYear()) }),
}
